
var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

/*
 * Location data
 */
var Location = new Schema({
  lat: Number, // latitude
  lng: Number, // longitude
  timestamp: String, // timestamp of location
  coach: Number, // id of coach
  speed: String,
  altitudeAccuracy: String,
  altitude: String,
  accuracy: String,
  heading: String
});

/*
 * Point
 */
var Point = new Schema({
  0: Number, // latitude
  1: Number // longitude
});

var Coach = new Schema({
  id: Number, // id of coach
  route: Number, // route number
  description: String, // coach description [optional]
  stops: [Number] // array of stop ids that coach stops at
});

Coach.methods.getLocation = function getLocation(cb) {
  return models.Location.where('coach', this.id)
  .sort('timestamp', -1)
  .findOne(cb);
};

/*
 * Route data
 */
var Route = new Schema({
  id: Number, // route id
  description: String, // description of route
  coaches: [Coach], // list of coaches that operate on route
  points: [Point], // lat, lng coordinates along route
  stops: [Point] // lat, lng coordinates of stops
});

/*
 * Stop data
 */
var Stop = new Schema({
  id: Number,
  description: String,
  lat: Number, // latitude
  lng: Number, // longitude
  routes: [Number] // array of route id's
});

/*
 * Find stops around a position
 *
 * Recursively looks for stops around a position
 *
 * size: initial distance to look around
 * pos: position to look around
 * limit: minimum number of stops to find
 * step: step size
 * callback(stops): callback function to be run when stops found
 *
 */
Stop.statics.findStops = function(size, pos, limit, step, callback) {
  // get stops near a position
  // recursively increase box size until enough stops are found

  this
  .where('lat').gte(pos.coords.latitude - size)
  .where('lat').lte(parseFloat(pos.coords.latitude) + parseFloat(size))
  .where('lng').gte(pos.coords.longitude - size)
  .where('lng').lte(parseFloat(pos.coords.longitude) + parseFloat(size))
  .run(function(err, stops) {
    if(stops.length < limit) { // if there aren't enough stops
      models.Stop.findStops(parseFloat(size) + parseFloat(step), pos, limit, step, callback);
    } else {
      if(typeof callback == 'function') {
        callback(stops);
        return false;
      }
    }
  });
};

var models = {
  Location: mongoose.model('Location', Location),
  Route: mongoose.model('Route', Route),
  Coach: mongoose.model('Coach', Coach),
  Stop: mongoose.model('Stop', Stop)
}

module.exports = models;
