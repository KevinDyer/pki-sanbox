(() => {
  'use strict';

  const PORT = process.env.PORT || 443;
  const HOST = process.env.HOST || '0.0.0.0';
  const CFSSL_HOST = 'http://intermediate-ca:8888';

  const os = require('os')
  const https = require('https')
  const EventEmitter = require('events');
  const express = require('express');
  const helmet = require('helmet');
  const morgan = require('morgan');
  const fetch = require('node-fetch');
  const bodyParser = require('body-parser');
  const csr = require('./../csr.json');

  function getCertificateAuthorityInfo() {
    const body = {};
    const input = `${CFSSL_HOST}/api/v1/cfssl/info`;
    const init = {
      method: 'POST',
      body: JSON.stringify(body)
    };
    console.log(require('util').inspect(input, {colors: true, depth: null}));
    console.log(require('util').inspect(init, {colors: true, depth: null}));
    return fetch(input, init)
    .then((res) => {
      return res.json()
      .then((body) => {
        if (!res.ok) {
          console.log(`res is not OK`);
          console.log(require('util').inspect(body, {colors: true, depth: null}));
          return Promise.reject(new Error('request failed'));
        }
        const {success, messages, errors, result} = body;
        if (!success) {
          console.log(require('util').inspect(messages, {colors: true, depth: null}));
          console.log(require('util').inspect(errors, {colors: true, depth: null}));
          return Promise.reject(new Error('cfssl request failed'));
        }
        console.log(require('util').inspect(result, {colors: true, depth: null}));
        const {certiticate} = result;
        return {cert: certiticate};
      });
    });
  }

  function getCertificateInfo() {
    const body = {request: csr};
    const input = `${CFSSL_HOST}/api/v1/cfssl/newcert`;
    const init = {
      method: 'POST',
      body: JSON.stringify(body)
    };
    console.log(require('util').inspect(input, {colors: true, depth: null}));
    console.log(require('util').inspect(init, {colors: true, depth: null}));
    return fetch(input, init)
    .then((res) => {
      return res.json()
      .then((body) => {
        if (!res.ok) {
          console.log(`res is not OK`);
          console.log(require('util').inspect(body, {colors: true, depth: null}));
          return Promise.reject(new Error('request failed'));
        }
        const {success, messages, errors, result} = body;
        if (!success) {
          console.log(require('util').inspect(messages, {colors: true, depth: null}));
          console.log(require('util').inspect(errors, {colors: true, depth: null}));
          return Promise.reject(new Error('cfssl request failed'));
        }
        console.log(require('util').inspect(result, {colors: true, depth: null}));
        const {private_key, certiticate} = result;
        return {key: private_key, cert: certiticate};
      });
    });
  }

  class Server {
    static newServer() {
      return Promise.all([
        getCertificateAuthorityInfo(),
        getCertificateInfo()
      ])
      .then(([certificateAuthorityInfo, certificateInfo]) => {
        const cert = `${certificateInfo.cert}${certificateAuthorityInfo.cert}`;
        const key = certificateInfo.key;
        return new Server({key: key, cert: cert});
      });
    }

    constructor({key, cert}) {
      const app = express();
      app.use(helmet());
      app.use(morgan('dev'));
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({extended: true}));
      app.use((req, res) => {
        res.status(200).json({
          method: req.method,
          headers: req.headers,
          body: req.body
        });
      });
      const options = {
        key: key,
        cert: cert
      };
      this._server = https.createServer(options, app);
    }

    listen() {
      return new Promise((resolve, reject) => {
        this._server.once('error', reject);
        this._server.listen(PORT, HOST, () => {
          this._server.removeListener('error', reject);
          const {port} = this._server.address();
          console.log(`Listening on ${PORT}...`);
          resolve();
        });
      });
    }

    close() {
      return new Promise((resolve, reject) => {
        this._server.once('error', reject);
        this._server.close(() => {
          this._server.removeListener('error', reject);
          resolve();
        });
      });
    }
  }
  
  module.exports = Server;
})();
