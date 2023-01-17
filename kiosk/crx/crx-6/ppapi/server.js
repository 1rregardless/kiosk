(function() {
  var app, bodyParser, express, handle, server;

  express = require('express');

  bodyParser = require('body-parser');

  app = express();

  app.use(bodyParser());

  handle = function(req, res, type) {
    console.log(`Type: ${type}`);
    console.log("Headers:", req.headers);
    if (type === 'GET') {
      return res.send({
        headers: req.headers
      });
    } else {
      console.log('Body', req.body);
      return res.send({
        body: req.body,
        headers: req.headers
      });
    }
  };

  app.get('/', function(req, res) {
    return handle(req, res, 'GET');
  });

  app.put('/', function(req, res) {
    return handle(req, res, 'PUT');
  });

  app.post('/', function(req, res) {
    return handle(req, res, 'POST');
  });

  server = app.listen(3000, function() {
    return console.log("Listening");
  });

}).call(this);
