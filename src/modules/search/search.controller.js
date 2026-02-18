const mongoose = require('mongoose');
const { sendSuccess, sendError } = require('../../shared/utils/responseFormatter');

// Dummy bus data for demonstration
const dummyBuses = [
  {
    _id: new mongoose.Types.ObjectId(),
    agentId: new mongoose.Types.ObjectId(),
    busNumber: 'MH12AB1234',
    type: 'AC',
    capacity: 40,
    manufacturer: 'Volvo',
    model: '9400',
    yearOfManufacture: 2022,
    amenities: ['WiFi', 'Water', 'Charging Point', 'Movie'],
    seatLayout: generateSeatLayout(40, 'AC'),
    routeIds: [new mongoose.Types.ObjectId()],
    status: 'active',
    registrationNumber: 'MH12AB1234',
    insuranceDetails: {
      company: 'ICICI Lombard',
      policyNumber: 'IC123456789',
      expiryDate: new Date('2025-12-31')
    },
    departureTime: '06:00',
    arrivalTime: '12:00',
    price: 800,
    rating: 4.5,
    availableSeats: 25
  },
  {
    _id: new mongoose.Types.ObjectId(),
    agentId: new mongoose.Types.ObjectId(),
    busNumber: 'DL01CD5678',
    type: 'NON_AC',
    capacity: 32,
    manufacturer: 'Tata',
    model: 'Marcopolo',
    yearOfManufacture: 2021,
    amenities: ['Water', 'Charging Point'],
    seatLayout: generateSeatLayout(32, 'NON_AC'),
    routeIds: [new mongoose.Types.ObjectId()],
    status: 'active',
    registrationNumber: 'DL01CD5678',
    insuranceDetails: {
      company: 'HDFC ERGO',
      policyNumber: 'HD987654321',
      expiryDate: new Date('2025-06-30')
    },
    departureTime: '08:30',
    arrivalTime: '14:30',
    price: 500,
    rating: 4.2,
    availableSeats: 18
  },
  {
    _id: new mongoose.Types.ObjectId(),
    agentId: new mongoose.Types.ObjectId(),
    busNumber: 'KA05EF9012',
    type: 'SLEEPER',
    capacity: 24,
    manufacturer: 'Ashok Leyland',
    model: 'Space',
    yearOfManufacture: 2023,
    amenities: ['WiFi', 'Water', 'Blanket', 'Movie', 'Charging Point'],
    seatLayout: generateSeatLayout(24, 'SLEEPER'),
    routeIds: [new mongoose.Types.ObjectId()],
    status: 'active',
    registrationNumber: 'KA05EF9012',
    insuranceDetails: {
      company: 'Bajaj Allianz',
      policyNumber: 'BA456789123',
      expiryDate: new Date('2026-01-15')
    },
    departureTime: '21:00',
    arrivalTime: '05:00',
    price: 1200,
    rating: 4.8,
    availableSeats: 12
  },
  {
    _id: new mongoose.Types.ObjectId(),
    agentId: new mongoose.Types.ObjectId(),
    busNumber: 'TN10GH3456',
    type: 'DELUXE',
    capacity: 45,
    manufacturer: 'Scania',
    model: 'Touring',
    yearOfManufacture: 2022,
    amenities: ['WiFi', 'Water', 'Snacks', 'Movie', 'Charging Point', 'Toilet'],
    seatLayout: generateSeatLayout(45, 'DELUXE'),
    routeIds: [new mongoose.Types.ObjectId()],
    status: 'active',
    registrationNumber: 'TN10GH3456',
    insuranceDetails: {
      company: 'Reliance General',
      policyNumber: 'RG789123456',
      expiryDate: new Date('2025-09-20')
    },
    departureTime: '19:30',
    arrivalTime: '04:30',
    price: 1500,
    rating: 4.9,
    availableSeats: 30
  },
  {
    _id: new mongoose.Types.ObjectId(),
    agentId: new mongoose.Types.ObjectId(),
    busNumber: 'WB07IJ7890',
    type: 'PREMIUM',
    capacity: 35,
    manufacturer: 'Mercedes-Benz',
    model: 'Tourismo',
    yearOfManufacture: 2023,
    amenities: ['WiFi', 'Water', 'Gourmet Meal', 'Movie', 'Charging Point', 'Toilet', 'Personal TV'],
    seatLayout: generateSeatLayout(35, 'PREMIUM'),
    routeIds: [new mongoose.Types.ObjectId()],
    status: 'active',
    registrationNumber: 'WB07IJ7890',
    insuranceDetails: {
      company: 'New India Assurance',
      policyNumber: 'NI321654987',
      expiryDate: new Date('2026-03-10')
    },
    departureTime: '15:00',
    arrivalTime: '22:00',
    price: 2000,
    rating: 4.7,
    availableSeats: 8
  }
];

// Helper function to generate seat layout
function generateSeatLayout(capacity, busType) {
  const seats = [];
  const rows = Math.ceil(capacity / 4);
  
  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= 4; col++) {
      if ((row - 1) * 4 + col > capacity) break;
      
      const seatNumber = `${row}${String.fromCharCode(64 + col)}`; // A, B, C, D
      const seatType = busType.includes('SLEEPER') ? 'SLEEPER' : 'SEATER';
      const position = col === 1 || col === 4 ? 'window' : 'aisle';
      const isBooked = Math.random() > 0.6; // 40% chance of being booked
      
      seats.push({
        number: seatNumber,
        type: seatType,
        position: position,
        price: calculateBasePrice(busType, seatType, position),
        status: isBooked ? 'booked' : 'available'
      });
    }
  }
  
  return seats;
}

// Helper function to calculate base price
function calculateBasePrice(busType, seatType, position) {
  let basePrice = 500; // Base price
  
  // Adjust based on bus type
  if (busType === 'AC') basePrice *= 1.2;
  if (busType === 'SLEEPER') basePrice *= 1.5;
  if (busType === 'DELUXE') basePrice *= 1.8;
  if (busType === 'PREMIUM') basePrice *= 2.2;
  
  // Adjust based on seat type
  if (seatType === 'SLEEPER') basePrice *= 1.3;
  
  // Adjust based on position
  if (position === 'window') basePrice *= 1.1;
  
  return Math.round(basePrice);
}

/**
 * Search buses between cities on a specific date
 * GET /api/search/buses
 */
const searchBuses = async (req, res) => {
  try {
    const { from, to, date, womenOnly, page = 1, limit = 10 } = req.query;

    // Validate required parameters
    if (!from || !to || !date) {
      return sendError(res, 'Missing required search parameters', {
        code: 'VALIDATION_ERROR',
        details: 'from, to, and date are required for bus search'
      }, 400);
    }

    // Parse date
    const searchDate = new Date(date);
    if (isNaN(searchDate.getTime())) {
      return sendError(res, 'Invalid date format', {
        code: 'INVALID_DATE',
        details: 'Please provide a valid date in YYYY-MM-DD format'
      }, 400);
    }

    // Filter dummy buses based on criteria
    let filteredBuses = [...dummyBuses];

    // Apply women-only filter
    if (womenOnly === 'true') {
      // In a real implementation, you would filter by women-only buses
      // For demo, we'll just return all buses
      console.log('Women-only filter applied');
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedBuses = filteredBuses.slice(startIndex, endIndex);

    // Add search metadata
    const searchMetadata = {
      from: from,
      to: to,
      date: searchDate.toISOString().split('T')[0],
      womenOnly: womenOnly === 'true',
      totalResults: filteredBuses.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(filteredBuses.length / limit),
      resultsPerPage: parseInt(limit)
    };

    const responseData = {
      buses: paginatedBuses,
      searchMetadata: searchMetadata
    };

    return sendSuccess(res, responseData, 'Buses found successfully');
  } catch (error) {
    console.error('Error searching buses:', error);
    return sendError(res, 'Failed to search buses', {
      code: 'SEARCH_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Get bus details by ID
 * GET /api/search/buses/:id
 */
const getBusDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const bus = dummyBuses.find(b => b._id.toString() === id);

    if (!bus) {
      return sendError(res, 'Bus not found', {
        code: 'BUS_NOT_FOUND',
        details: 'No bus found with the provided ID'
      }, 404);
    }

    return sendSuccess(res, bus, 'Bus details retrieved successfully');
  } catch (error) {
    console.error('Error getting bus details:', error);
    return sendError(res, 'Failed to retrieve bus details', {
      code: 'BUS_FETCH_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Apply filters to search results
 * GET /api/search/filter
 */
const filterBuses = async (req, res) => {
  try {
    const {
      busType,
      minPrice,
      maxPrice,
      minRating,
      amenities,
      departureTime,
      arrivalTime
    } = req.query;

    let filteredBuses = [...dummyBuses];

    // Apply bus type filter
    if (busType) {
      filteredBuses = filteredBuses.filter(bus => bus.type === busType);
    }

    // Apply price range filter
    if (minPrice || maxPrice) {
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : Infinity;
      filteredBuses = filteredBuses.filter(bus => bus.price >= min && bus.price <= max);
    }

    // Apply rating filter
    if (minRating) {
      const min = parseFloat(minRating);
      filteredBuses = filteredBuses.filter(bus => bus.rating >= min);
    }

    // Apply amenities filter
    if (amenities) {
      const amenityList = amenities.split(',').map(a => a.trim());
      filteredBuses = filteredBuses.filter(bus => 
        amenityList.every(amenity => bus.amenities.includes(amenity))
      );
    }

    // Apply departure time filter
    if (departureTime) {
      // In a real implementation, you would filter by departure time
      console.log('Departure time filter:', departureTime);
    }

    // Apply arrival time filter
    if (arrivalTime) {
      // In a real implementation, you would filter by arrival time
      console.log('Arrival time filter:', arrivalTime);
    }

    return sendSuccess(res, {
      buses: filteredBuses,
      totalResults: filteredBuses.length,
      appliedFilters: {
        busType: busType || null,
        priceRange: minPrice || maxPrice ? { min: minPrice, max: maxPrice } : null,
        minRating: minRating || null,
        amenities: amenities ? amenities.split(',').map(a => a.trim()) : null,
        departureTime: departureTime || null,
        arrivalTime: arrivalTime || null
      }
    }, 'Filtered buses retrieved successfully');
  } catch (error) {
    console.error('Error filtering buses:', error);
    return sendError(res, 'Failed to filter buses', {
      code: 'FILTER_ERROR',
      details: error.message
    }, 500);
  }
};

module.exports = {
  searchBuses,
  getBusDetails,
  filterBuses
};