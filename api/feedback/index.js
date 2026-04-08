const appInsights = require('applicationinsights');
const { CosmosClient } = require('@azure/cosmos');

// Guard App Insights startup — function works without telemetry
let client = null;
try {
  if (
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
    process.env.APPINSIGHTS_INSTRUMENTATIONKEY
  ) {
    appInsights.setup();
    client = appInsights.defaultClient;
  }
} catch (err) {
  // App Insights initialization failed — continue without telemetry
}

// Lazy-init Cosmos container (promise cached across invocations)
let cosmosContainerPromise = null;

function getCosmosContainer() {
  if (cosmosContainerPromise) return cosmosContainerPromise;

  const connectionString =
    process.env.COSMOSDB_CONNECTION_STRING ||
    process.env.bpmcounterdbaccount_DOCUMENTDB;
  if (!connectionString) return Promise.resolve(null);

  cosmosContainerPromise = (async () => {
    const cosmosClient = new CosmosClient(connectionString);
    const { database } = await cosmosClient.databases.createIfNotExists({
      id: 'bpmtech-db',
    });
    const { container } = await database.containers.createIfNotExists({
      id: 'feedback',
      partitionKey: { paths: ['/id'] },
    });
    return container;
  })();

  return cosmosContainerPromise;
}

module.exports = async function (context, req) {
  const operationIdOverride = {
    'ai.operation.id': context.traceContext.traceparent,
  };

  if (
    !req.body ||
    typeof req.body !== 'object' ||
    Array.isArray(req.body) ||
    !('bpm' in req.body) ||
    !('isCorrect' in req.body)
  ) {
    client?.trackException({
      exception: new Error('No required parameter!'),
      tagOverrides: operationIdOverride,
    });

    context.res = { status: 400, body: 'No required parameter!' };
    return;
  }

  let clientPrincipal = {};

  try {
    const header = req.headers['x-ms-client-principal'];
    const encoded = Buffer.from(header, 'base64');
    const decoded = encoded.toString('ascii');
    clientPrincipal = JSON.parse(decoded);
  } catch (err) {
    context.log(`${err.name}: ${err.message}`);
  }

  const bpm = req.body.bpm;
  const isCorrect = req.body.isCorrect;
  const timestamp = Date.now();
  const documentId =
    new Date().toISOString() + Math.random().toString().substring(2, 10);

  const document = {
    id: documentId,
    bpm: bpm,
    isCorrect: isCorrect,
    timestamp: timestamp,
  };

  try {
    const container = await getCosmosContainer();
    if (container) {
      await container.items.create(document);
    } else {
      context.log.warn('CosmosDB not configured — skipping document write');
    }
  } catch (err) {
    context.log.error(`CosmosDB write failed: ${err.message}`);
    context.res = { status: 500, body: 'Failed to save feedback' };
    return;
  }

  client?.trackEvent({
    name: 'feedback_save',
    tagOverrides: operationIdOverride,
    properties: {
      id: documentId,
      bpm: bpm,
      isCorrect: isCorrect,
      timestamp: timestamp,
    },
  });

  context.res = {
    body: {
      message: 'Thank you!',
      clientPrincipal: clientPrincipal,
    },
  };
};
