const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
    index: true
  },
  busNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    // Example formats: ABC1234, KA01XX1234, TN-12-AB-5678
    match: [/^[A-Z0-9]{2,4}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{0,3}[-\s]?[0-9]{1,4}$/, 'Please enter a valid bus number']
  },
  type: {
    type: String,
    required: true,
    enum: ['AC', 'NON_AC', 'SLEEPER', 'SEATER', 'AC_SLEEPR', 'NON_AC_SEATER', 'DELUXE'],
    index: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 60
  },
  amenities: [{
    type: String,
    enum: [
      'WIFI', 'CHARGING_PORT', 'READING_LIGHT', 'AIR_CONDITIONING', 
      'SNACKS', 'NEWSPAPER', 'MOVIE', 'PILLow', 'BLANKET', 'USB_PORT',
      'EMERGENCY_EXIT', 'FIRE_EXTINGUISHER', 'FIRST_AID_KIT'
    ]
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  operationalStatus: {
    type: String,
    enum: ['OPERATIONAL', 'MAINTENANCE', 'OUT_OF_SERVICE', 'DECOMMISSIONED'],
    default: 'OPERATIONAL',
    required: true
  },
  registrationDetails: {
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    registrationState: {
      type: String,
      required: true
    },
    registrationYear: {
      type: Number,
      required: true,
      min: 1990,
      max: new Date().getFullYear() + 1
    },
    fitnessValidUpto: {
      type: Date,
      required: true
    },
    insuranceValidUpto: {
      type: Date,
      required: true
    }
  },
  // Seat layout configuration
  seatLayout: {
    type: Object,
    required: true,
    // Example structure: { layoutType: '2x2', seats: [{number: 'A1', type: 'window'}, ...] }
    default: {
      layoutType: '2x2',
      seats: [] // Will be populated based on capacity
    }
  },
  // Pricing information per route
  pricing: [{
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    pricingPerSeat: [{
      seatNumber: String,
      price: Number
    }]
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for agent and operational status
busSchema.index({ agentId: 1, operationalStatus: 1 });

// Index for bus number search
busSchema.index({ busNumber: 1 });

// Virtual to get available seats
busSchema.virtual('availableSeats').get(function() {
  // This would return available seats based on bookings
  // Implementation depends on how bookings are tracked
  return [];
});

// Pre-save middleware to normalize data
busSchema.pre('save', function(next) {
  if (this.busNumber) {
    // Normalize bus number (remove extra spaces, hyphens, etc.)
    this.busNumber = this.busNumber.replace(/[-\s]/g, '').toUpperCase();
  }
  next();
});

// Method to generate seat layout based on bus type and capacity
busSchema.methods.generateSeatLayout = function() {
  // Generate seats based on bus type and capacity
  const seats = [];
  const rows = Math.ceil(this.capacity / 4); // Assuming max 4 seats per row
  
  for (let i = 1; i <= this.capacity; i++) {
    const row = Math.ceil(i / 4);
    const positionInRow = (i - 1) % 4;
    
    let seatType = 'NORMAL';
    if (positionInRow === 0 || positionInRow === 3) {
      seatType = 'WINDOW';
    } else if (this.type.includes('SLEEPER')) {
      seatType = 'SLEEPER_LOWER';
      if (i % 2 === 0) {
        seatType = 'SLEEPER_UPPER';
      }
    }
    
    seats.push({
      number: `${String.fromCharCode(64 + row)}${i}`,
      type: seatType,
      position: {
        row: row,
        column: positionInRow
      },
      isAvailable: true
    });
  }
  
  this.seatLayout.seats = seats;
  return seats;
};

// Method to get seat by number
busSchema.methods.getSeatByNumber = function(seatNumber) {
  return this.seatLayout.seats.find(seat => seat.number === seatNumber);
};

// Method to update seat availability
busSchema.methods.updateSeatAvailability = function(seatNumber, isAvailable) {
  const seat = this.getSeatByNumber(seatNumber);
  if (seat) {
    seat.isAvailable = isAvailable;
    return true;
  }
  return false;
};

module.exports = mongoose.model('Bus', busSchema);