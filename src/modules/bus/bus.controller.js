const Bus = require('./bus.model');
const { sendSuccess, sendError } = require('../../shared/utils/responseFormatter');

/**
 * Create a new bus
 * POST /api/buses
 */
const createBus = async (req, res) => {
  try {
    const busData = req.body;

    // Validate required fields
    if (!busData.agentId || !busData.busNumber || !busData.type) {
      return sendError(res, 'Missing required fields', {
        code: 'VALIDATION_ERROR',
        details: 'agentId, busNumber, and type are required'
      }, 400);
    }

    const bus = new Bus(busData);
    const savedBus = await bus.save();

    return sendSuccess(res, savedBus, 'Bus created successfully');
  } catch (error) {
    console.error('Error creating bus:', error);
    return sendError(res, 'Failed to create bus', {
      code: 'BUS_CREATION_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Get all buses with optional filtering
 * GET /api/buses
 */
const getAllBuses = async (req, res) => {
  try {
    const { agentId, type, capacity, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (agentId) filter.agentId = agentId;
    if (type) filter.type = type;
    if (capacity) filter.capacity = { $gte: parseInt(capacity) };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const buses = await Bus.paginate(filter, options);

    return sendSuccess(res, buses, 'Buses retrieved successfully');
  } catch (error) {
    console.error('Error getting buses:', error);
    return sendError(res, 'Failed to retrieve buses', {
      code: 'BUS_FETCH_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Get a specific bus by ID
 * GET /api/buses/:id
 */
const getBusById = async (req, res) => {
  try {
    const { id } = req.params;

    const bus = await Bus.findById(id);

    if (!bus) {
      return sendError(res, 'Bus not found', {
        code: 'BUS_NOT_FOUND',
        details: 'No bus found with the provided ID'
      }, 404);
    }

    return sendSuccess(res, bus, 'Bus retrieved successfully');
  } catch (error) {
    console.error('Error getting bus by ID:', error);
    return sendError(res, 'Failed to retrieve bus', {
      code: 'BUS_FETCH_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Update a bus by ID
 * PUT /api/buses/:id
 */
const updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const bus = await Bus.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!bus) {
      return sendError(res, 'Bus not found', {
        code: 'BUS_NOT_FOUND',
        details: 'No bus found with the provided ID'
      }, 404);
    }

    return sendSuccess(res, bus, 'Bus updated successfully');
  } catch (error) {
    console.error('Error updating bus:', error);
    return sendError(res, 'Failed to update bus', {
      code: 'BUS_UPDATE_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Delete a bus by ID
 * DELETE /api/buses/:id
 */
const deleteBus = async (req, res) => {
  try {
    const { id } = req.params;

    const bus = await Bus.findByIdAndDelete(id);

    if (!bus) {
      return sendError(res, 'Bus not found', {
        code: 'BUS_NOT_FOUND',
        details: 'No bus found with the provided ID'
      }, 404);
    }

    return sendSuccess(res, null, 'Bus deleted successfully');
  } catch (error) {
    console.error('Error deleting bus:', error);
    return sendError(res, 'Failed to delete bus', {
      code: 'BUS_DELETE_ERROR',
      details: error.message
    }, 500);
  }
};

module.exports = {
  createBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus
};