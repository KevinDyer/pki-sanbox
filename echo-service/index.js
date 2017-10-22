(() => {
  'use  strict';

  const Server = require('./src/server');

  Promise.resolve()
  .then(() => Server.newServer())
  .then((server) => {
    process.on('SIGINT', () => {
      Promise.resolve()
      .then(() => server.close())
      .then(() => process.exit(0));
    });
    return Promise.resolve()
    .then(() => server.listen());
  })
  .catch((err) => console.error(err));
})();
