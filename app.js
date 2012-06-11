/*
 * Pipe
 *
 * Generates data for coaches and posts to server
 */
var config = require('./config')
  , request = require('request');

var setVariableInterval = function(callbackFunc, timing) {
  var variableInterval = {
    interval: timing,
    callback: callbackFunc,
    stopped: false,
    runLoop: function() {
      if (variableInterval.stopped) return;
      var result = variableInterval.callback.call(variableInterval);
      if (typeof result == 'number') {
        if (result === 0) return;
        variableInterval.interval = result;
      }
      variableInterval.loop();
    },
    stop: function() {
      this.stopped = true;
      clearTimeout(this.timeout);
    },
    start: function() {
      this.stopped = false;
      return this.loop();
    },
    loop: function() {
      this.timeout = setTimeout(this.runLoop, this.interval);
      return this;
    }
  };
  return variableInterval.start();
};

/*
 * Publish loop
 */
var timer = setVariableInterval(function() {
  delete require.cache[require.resolve('./config')]; // delete config cache
  config = require('./config'); // reload config
  timer.interval = config.duration; // change timer duration
  request.post({
    url: config.url+'/coach',
    json: true,
    body: {
      location: 'test'
    }
  }, function(e, r, body) {
    console.log(body);
  });
}, config.duration);

