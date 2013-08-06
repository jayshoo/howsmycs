var config = require('./config');

var express = require('express');
var app = express.createServer();

var LolClient = require('./lolclient/lol-client');
var client = new LolClient({
  region: 'oce',
  username: config.logins.oce[0],
  password: config.logins.oce[1],
  version: '3.10.13_07_26_19_59'
});

client.on('connection', function() {
  console.log('Connected to League RTMP server.');
});
client.connect();

app.listen(config.webPort);

app.configure(function() {
  app.use(express.static(__dirname + '/static'));
  app.set('views', __dirname);
  app.set('view engine', 'jade');
  app.set('view options', {
    layout: false
  });
});

app.get('/', function(req, res) {
  res.render('index', { config: config });
});

app.get('/summoner/:name', function(req, res) {
  client.getSummonerByName(req.params.name, function(err, summoner) {
    var acctId = summoner.object.acctId.value;
    client.getMatchHistory(acctId, function(err, history) {
      res.render('history', { data: history });
    });
  });
});

