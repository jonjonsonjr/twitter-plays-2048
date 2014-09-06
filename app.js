// module dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var util = require('util');
var twitter = require('twitter');
var twit = new twitter({
  consumer_key: 'Rj2NfrALS1yS15XAvNp4llrfj',
  consumer_secret: 'sYkwRzzPRnEg1simeUdnB8ZYwKYXgdxdnhv34SXNrurpfMRe52',
  access_token_key: '100691776-P2GXqBN1OV1N80Q3jmBevydjxnDCrGxeQ5NLLIop',
  access_token_secret: 'QrQeLhNMq5vSffMvuHV7s5L8a670OvqNRuYPnecXWJKXA'
});

var tweets = [];
var currentTweet = "";
var movesHistogram = {
  up: 0,
  down: 0,
  left: 0,
  right: 0
};

// all environments
var app = express();
app.set('port', process.env.PORT || 3000);
app.use(express.compress());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 1000*60*60*24*14 }));

var server = http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {
  socket.on('poll', function (data) {
    currentTweet.histogram = movesHistogram;
    socket.emit('update', currentTweet);
  });
});

setInterval(getNextTweet, 2000);

function getNextTweet() {
  if (tweets.length > 0) {
    currentTweet = tweets.pop();
    updateHistogram();
    return;
  }

  twit.search('up OR down OR left OR right', function (data) {
    if (!data) return;

    tweets = data.statuses.map(function (t) {
      var info = findText(t.text);

      if (info === false) {
        return "false";
      }

      return {
        text: t.text,
        user: t.user.screen_name,
        dir: info.dir,
        start: info.start,
        id: t.id_str
      };
    });

    tweets.filter(function (t) {
      return t !== "false" && t.text && t.user && t.dir;
    });

    currentTweet = tweets.pop();
    updateHistogram();
  });
}

function updateHistogram() {
  if (!currentTweet.dir) return;

  movesHistogram[currentTweet.dir]++;
}

function findText(text) {
  var text = text.toLowerCase();
  var dir;
  var start;

  if (text.indexOf('up') !== -1) {
    dir = 'up';
    start = text.indexOf('up');
  } else if (text.indexOf('down') !== -1) {
    dir = 'down';
    start = text.indexOf('down');
  } else if (text.indexOf('left') !== -1) {
    dir = 'left';
    start = text.indexOf('left');
  } else if (text.indexOf('right') !== -1) {
    dir = 'right';
    start = text.indexOf('right');
  } else {
    return false;
  }

  return {dir: dir, start: start};
}
