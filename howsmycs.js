var config = require('./config');

var express = require('express');
var app = express();

var LolClient = require('./lolclient/lol-client');

// LolClient comes with na/eu regions only; let's wipe and load all regions
LolClient.prototype._rtmpHosts = [];
LolClient.prototype._loginQueueHosts = [];

var regionData = require('./lolregiondata');
for (var index in regionData) {
  var region = regionData[index];
  var code = region[0].toLowerCase();

  LolClient.prototype._rtmpHosts[code] = region[3];
  LolClient.prototype._loginQueueHosts[code] = region[4];
}

var client = new LolClient({
  region: 'oce',
  username: config.logins.oce[0],
  password: config.logins.oce[1],
  version: '3.10.13_07_26_19_59'
});

client.on('connection', function() {
  console.log('Connected to League RTMP server.');
  keepAlive();
});
client.connect();

// RTMP server drops connection after awhile
// Let's keep the connection alive if possible
// TODO: find an actual sanctioned "ping" RTMP method
var keepAliveSecs = 60;
function keepAlive() {
  console.log('ping...');
  client.getSummonerByName('j0shu', function(err, summoner) {
    console.log('...pong!');
  });
  setTimeout(keepAlive, 1000*keepAliveSecs);
}


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

