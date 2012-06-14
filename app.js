/*
 * Pipe
 *
 * Generates data for coaches and posts to server
 */
var config = require('./config')
  , gm = require('googlemaps')
  , mongoose = require('mongoose')
  , models = require('./schema')
  , _ = require('underscore')
  , logme = require('logme')
  , request = require('request');

/*
 * Connect to database
 */
mongoose.connect('mongodb://localhost:27017/coach');

/*
 * Get a route
 */
models.Route.findOne({ id: 69 }, function(err, route) {
  coach.points = route.points;
  // publish initial location
  coach.publish();

  // get first distance
  coach.getDistance(coach.currentPoint(), coach.nextPoint(), function(distance, duration, data) {
    coach.duration = duration;
    console.log(coach.getDuration());
    coach.startLoop();
  });
});

/*
 * Coach object
 */
var coach = {
  /*
   * Current point location
   */
  current: 0,

  /*
   * Array of points along route
   */
  points: [],

  /*
   * Get current point
   */
  currentPoint: function() {
    return this.points[this.current];
  },

  /*
   * Get next point in route
   */
  nextPoint: function() {
    return this.points[++this.current];
  },

  /*
   * Increment point
   */
  increment: function() {
    this.current = ++this.current;
    return this.currentPoint();
  },

  /*
   * Duration till next point
   */
  duration: 0,

  /*
   * Scale to speed up duration time by
   */
  scale: 10,

  /*
   * Get duration
   *
   * Wrapper function to get duration till next point
   */
  getDuration: function() {
    var milli = this.duration * 1000;
    return milli / this.scale;
  },

  /*
   * Get distance between two points using google maps
   *
   * Params:
   *    pointA: object representing the first point
   *    pointB: object representing the second point
   *    callback(distance, duration, data): distance[m], duration[seconds], data[full]
   */
  getDistance: function(pointA, pointB, callback) {
    gm.distance(
      pointA[0]+','+pointA[1],
      pointB[0]+','+pointB[1],
      function(err, data) {
        if(typeof callback == 'function') {
          callback(
            data.rows[0].elements[0].distance.value, // distance
            data.rows[0].elements[0].duration.value, // duration
            data // full data
          );
        }
      }
    );
  },

  /*
   * Publish location
   *
   * Post current location data to server
   */
  publish: function() {
    console.log(this.currentPoint());
    var time = new Date();
    request.post({
      url: config.url+'/coach/101',
      json: true,
      body: {
        lat: this.currentPoint()[0],
        lng: this.currentPoint()[1],
        timestamp: time.getTime()
      }
    }, function(e, r, body) {
      console.log(body);
    });
  },

  /*
   * Start journey route
   */
  startLoop: function() {
    var self = this;
    this.timer = setVariableInterval(function() {
      self.timer.stop();
      if(self.nextPoint()) {
        self.increment();
        self.publish();
        self.getDistance(self.currentPoint(), self.nextPoint(), function(distance, duration, data) {
          self.duration = duration;
          self.timer.interval = self.getDuration();
          console.log(self.timer.interval);
          self.timer.start();
        });
      } else {
        console.log('Finished!');
      }
    }, self.getDuration());
  },
};

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

