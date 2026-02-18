const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    trim: true,
    index: true // For faster queries
  },
  destination: {
    type: String,
    required: true,
    trim: true,
    index: true // For faster queries
  },
  distance: {
    type: Number, // Distance in kilometers
    required: true,
    min: 0
  },
  duration: {
    type: Number, // Duration in minutes
    required: false,
    min: 0
  },
  stops: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    arrivalTime: {
      type: String, // Format: HH:MM
      required: false
    },
    departureTime: {
      type: String, // Format: HH:MM
      required: false
    },
    distanceFromStart: {
      type: Number, // Kilometers from source
      required: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient source-destination queries
routeSchema.index({ source: 1, destination: 1 });
routeSchema.index({ destination: 1, source: 1 });

// Text index for search functionality
routeSchema.index({ 
  source: 'text', 
  destination: 'text' 
});

// Method to calculate estimated travel time
routeSchema.methods.getEstimatedTravelTime = function() {
  if (this.duration) {
    return this.duration;
  }
  
  // Estimate based on distance (assuming avg speed of 60 km/h)
  return Math.round((this.distance / 60) * 60); // Convert to minutes
};

// Method to check if a stop exists
routeSchema.methods.hasStop = function(stopName) {
  return this.stops.some(stop => 
    stop.name.toLowerCase() === stopName.toLowerCase()
  );
};

module.exports = mongoose.model('Route', routeSchema);