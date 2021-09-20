module.exports = async function (context, req) {
  if (!req.body || !('bpm' in req.body) || !('isCorrect' in req.body)) {
    context.res = { status: 404, body: 'No required parameter!' };
    context.done();
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
  const timestamp = Math.floor(Date.now() / 1);

  context.bindings.outputDocument = JSON.stringify({
    id: new Date().toISOString() + Math.random().toString().substr(2, 8),
    bpm: bpm,
    isCorrect: isCorrect,
    timestamp: timestamp,
  });

  context.res = {
    body: {
      message: 'Thank you!',
      clientPrincipal: clientPrincipal,
    },
  };
};
