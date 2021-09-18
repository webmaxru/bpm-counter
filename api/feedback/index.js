module.exports = async function (context, req) {
  if (!req.body || !req.body.bpm || !req.body.isCorrect) {
    context.res = { status: 404, body: 'No required parameter!' };
    context.done();
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
    body: 'Thank you!',
  };
};
