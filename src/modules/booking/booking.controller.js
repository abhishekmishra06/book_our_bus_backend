const Booking = require('./booking.model');
const { sendSuccess, sendError } = require('../../shared/utils/responseFormatter');

/**
 * Create a new booking
 * POST /api/bookings
 */
const createBooking = async (req, res) => {
  try {
    const bookingData = req.body;

    // Validate required fields
    if (!bookingData.userId || !bookingData.busId || !bookingData.seats || !bookingData.routeId || !bookingData.passengers) {
      return sendError(res, 'Missing required fields', {
        code: 'VALIDATION_ERROR',
        details: 'userId, busId, seats, routeId, and passengers are required'
      }, 400);
    }

    // Validate passengers array
    if (!Array.isArray(bookingData.passengers) || bookingData.passengers.length === 0) {
      return sendError(res, 'Passenger information required', {
        code: 'VALIDATION_ERROR',
        details: 'At least one passenger is required'
      }, 400);
    }

    // Validate each passenger
    for (const passenger of bookingData.passengers) {
      if (!passenger.name || !passenger.age || !passenger.gender) {
        return sendError(res, 'Incomplete passenger information', {
          code: 'VALIDATION_ERROR',
          details: 'Each passenger must have name, age, and gender'
        }, 400);
      }

      // Validate age
      if (typeof passenger.age !== 'number' || passenger.age <= 0 || passenger.age > 120) {
        return sendError(res, 'Invalid passenger age', {
          code: 'VALIDATION_ERROR',
          details: 'Passenger age must be a number between 1 and 120'
        }, 400);
      }

      // Validate gender
      const validGenders = ['male', 'female', 'other'];
      if (!validGenders.includes(passenger.gender.toLowerCase())) {
        return sendError(res, 'Invalid passenger gender', {
          code: 'VALIDATION_ERROR',
          details: 'Gender must be male, female, or other'
        }, 400);
      }
    }

    // Validate seats array
    if (!Array.isArray(bookingData.seats) || bookingData.seats.length === 0) {
      return sendError(res, 'Seat information required', {
        code: 'VALIDATION_ERROR',
        details: 'At least one seat is required'
      }, 400);
    }

    // Ensure number of seats matches number of passengers
    if (bookingData.seats.length !== bookingData.passengers.length) {
      return sendError(res, 'Seat and passenger count mismatch', {
        code: 'VALIDATION_ERROR',
        details: 'Number of seats must match number of passengers'
      }, 400);
    }

    // Create booking reference
    const bookingReference = generateBookingReference();

    // Prepare booking object
    const bookingDataObj = {
      userId: bookingData.userId,
      busId: bookingData.busId,
      routeId: bookingData.routeId,
      seats: bookingData.seats,
      passengers: bookingData.passengers.map((passenger, index) => ({
        ...passenger,
        seatNumber: bookingData.seats[index]
      })),
      totalAmount: calculateTotalAmount(bookingData.seats, bookingData.pricePerSeat),
      journeyDate: bookingData.journeyDate || new Date(),
      bookingReference
    };

    // Create booking in database
    const booking = new Booking(bookingDataObj);
    const savedBooking = await booking.save();

    // Create booking confirmation notification
    try {
      const notificationController = require('../notification/notification.controller');
      await notificationController.createBookingNotification(
        savedBooking._id,
        'confirmed',
        savedBooking.userId,
        { passengers: savedBooking.passengers, totalAmount: savedBooking.totalAmount }
      );
    } catch (notificationError) {
      console.error('Error creating booking notification:', notificationError);
      // Don't fail the booking if notification fails
    }

    return sendSuccess(res, savedBooking, 'Booking created successfully');
  } catch (error) {
    console.error('Error creating booking:', error);
    return sendError(res, 'Failed to create booking', {
      code: 'BOOKING_CREATION_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Get all bookings with optional filtering
 * GET /api/bookings
 */
const getAllBookings = async (req, res) => {
  try {
    const { userId, busId, status, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (userId) filter.userId = userId;
    if (busId) filter.busId = busId;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.bookingDate = {};
      if (startDate) filter.bookingDate.$gte = new Date(startDate);
      if (endDate) filter.bookingDate.$lte = new Date(endDate);
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const bookings = await Booking.paginate(filter, options);

    return sendSuccess(res, bookings, 'Bookings retrieved successfully');
  } catch (error) {
    console.error('Error getting bookings:', error);
    return sendError(res, 'Failed to retrieve bookings', {
      code: 'BOOKING_FETCH_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Get a specific booking by ID
 * GET /api/bookings/:id
 */
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate('userId', 'name phone email')
      .populate('busId', 'busNumber type capacity')
      .populate('routeId', 'source destination');

    if (!booking) {
      return sendError(res, 'Booking not found', {
        code: 'BOOKING_NOT_FOUND',
        details: 'No booking found with the provided ID'
      }, 404);
    }

    return sendSuccess(res, booking, 'Booking retrieved successfully');
  } catch (error) {
    console.error('Error getting booking by ID:', error);
    return sendError(res, 'Failed to retrieve booking', {
      code: 'BOOKING_FETCH_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Update a booking by ID
 * PUT /api/bookings/:id
 */
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return sendError(res, 'Booking not found', {
        code: 'BOOKING_NOT_FOUND',
        details: 'No booking found with the provided ID'
      }, 404);
    }

    return sendSuccess(res, booking, 'Booking updated successfully');
  } catch (error) {
    console.error('Error updating booking:', error);
    return sendError(res, 'Failed to update booking', {
      code: 'BOOKING_UPDATE_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Cancel a booking by ID
 * DELETE /api/bookings/:id
 */
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status: 'cancelled', paymentStatus: 'refunded' },
      { new: true }
    );

    if (!booking) {
      return sendError(res, 'Booking not found', {
        code: 'BOOKING_NOT_FOUND',
        details: 'No booking found with the provided ID'
      }, 404);
    }

    // Create booking cancellation notification
    try {
      const notificationController = require('../notification/notification.controller');
      await notificationController.createBookingNotification(
        booking._id,
        'cancelled',
        booking.userId
      );
    } catch (notificationError) {
      console.error('Error creating cancellation notification:', notificationError);
      // Don't fail the cancellation if notification fails
    }

    return sendSuccess(res, booking, 'Booking cancelled successfully');
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return sendError(res, 'Failed to cancel booking', {
      code: 'BOOKING_CANCEL_ERROR',
      details: error.message
    }, 500);
  }
};

// Helper function to calculate total amount
const calculateTotalAmount = (seats, pricePerSeat) => {
  return seats.length * pricePerSeat;
};

// Helper function to generate booking reference
const generateBookingReference = () => {
  return `BK${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking
};