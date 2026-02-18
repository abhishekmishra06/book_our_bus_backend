const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['AC', 'NON_AC', 'SLEEPER', 'SEATER'],
    required: true
  },
  position: {
    type: String,
    enum: ['window', 'aisle', 'middle']
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'maintenance'],
    default: 'available'
  }
});

const busSchema = new mongoose.Schema({
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  busNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['AC', 'NON_AC', 'SLEEPER', 'SEATER', 'DELUXE', 'PREMIUM']
  },
  capacity: {
    type: Number,
    required: true
  },
  manufacturer: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  yearOfManufacture: {
    type: Number,
    required: true
  },
  amenities: [{
    type: String
  }],
  seatLayout: [seatSchema],
  routeIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  registrationNumber: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },
  insuranceDetails: {
    company: String,
    policyNumber: String,
    expiryDate: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
busSchema.index({ agentId: 1 });
busSchema.index({ busNumber: 1 });
busSchema.index({ type: 1 });
busSchema.index({ routeIds: 1 });

// Method to generate seat layout based on bus type
busSchema.methods.generateSeatLayout = function() {
  const seats = [];
  const rows = Math.ceil(this.capacity / 4);
  
  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= 4; col++) {
      if ((row - 1) * 4 + col > this.capacity) break;
      
      const seatNumber = `${row}${String.fromCharCode(64 + col)}`; // A, B, C, D
      const seatType = this.type.includes('SLEEPER') ? 'SLEEPER' : 'SEATER';
      const position = col === 1 || col === 4 ? 'window' : 'aisle';
      
      seats.push({
        number: seatNumber,
        type: seatType,
        position: position,
        price: this.calculateBasePrice(seatType, position),
        status: 'available'
      });
    }
  }
  
  this.seatLayout = seats;
  return seats;
};

// Helper method to calculate base price
busSchema.methods.calculateBasePrice = function(seatType, position) {
  let basePrice = 500; // Base price
  
  // Adjust based on seat type
  if (seatType === 'SLEEPER') basePrice *= 1.5;
  if (this.type === 'AC') basePrice *= 1.2;
  if (this.type === 'PREMIUM') basePrice *= 1.8;
  
  // Adjust based on position
  if (position === 'window') basePrice *= 1.1;
  
  return basePrice;
};

const Bus = mongoose.model('Bus', busSchema);

module.exports = Bus;