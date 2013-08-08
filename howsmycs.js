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

// connect to all the regions set up in the config
var clients = {}; // manage a LolClient per region, keyed by region code
for (var region in config.logins) {
  console.log('Connecting to '+region+'...');
  var client = new LolClient({
    region: region,
    username: config.logins[region][0],
    password: config.logins[region][1],
    version: '3.10.github.com/jayshoo/howsmycs'
  });
  client.on('connection', function onConnect() {
    console.log('RTMP client connected to '+this.options.region);
    clients[this.options.region] = client;
    keepAlive(client);
  });

  client.connect();
}


// RTMP server drops connection after awhile
// Let's keep the connection alive if possible
// TODO: find an actual sanctioned "ping" RTMP method
var keepAliveSecs = 300;
function keepAlive(client) {
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

app.get('/:region/:name/history', function(req, res) {
  var client = clients[req.params.region];
  client.getSummonerByName(req.params.name, function onSummoner(err, summoner) {
    var acctId = summoner.object.acctId.value;
    client.getMatchHistory(acctId, function onMatchHistory(err, history) {
      res.render('history', { data: history });
    });
  });
});

