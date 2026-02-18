const Bus = require('../models/Bus');
const Agent = require('../../agent-service/models/Agent');
const { sendSuccess, sendError } = require('../../shared-services/utils/responseFormatter');

/**
 * Creates a new bus for an agent
 */
const createBus = async (req, res) => {
  try {
    // Get agent ID from authenticated user
    const agentId = req.user.userId; // This comes from the JWT token
    
    const {
      busNumber,
      type,
      capacity,
      amenities,
      operationalStatus,
      registrationDetails,
      seatLayout,
      pricing
    } = req.body;

    // Validate required fields
    if (!busNumber || !type || !capacity) {
      return sendError(res, 'Missing required fields', {
        code: 'VALIDATION_ERROR',
        details: 'Bus number, type, and capacity are required'
      }, 400);
    }

    // Verify that the authenticated user is indeed an agent
    const agent = await Agent.findOne({ userId: agentId });
    if (!agent) {
      return sendError(res, 'Unauthorized: Only agents can create buses', {
        code: 'UNAUTHORIZED',
        details: 'Only verified agents can create buses'
      }, 403);
    }

    // Check if bus number already exists
    const existingBus = await Bus.findOne({ busNumber: busNumber.toUpperCase() });
    if (existingBus) {
      return sendError(res, 'Bus number already exists', {
        code: 'BUS_NUMBER_EXISTS',
        details: `A bus with number ${busNumber} already exists`
      }, 409);
    }

    // Create new bus
    const bus = new Bus({
      agentId: agent._id,
      busNumber,
      type,
      capacity,
      amenities: amenities || [],
      operationalStatus: operationalStatus || 'OPERATIONAL',
      registrationDetails,
      seatLayout: seatLayout || { layoutType: '2x2', seats: [] },
      pricing: pricing || [],
      isActive: true
    });

    // Generate seat layout based on capacity and type
    bus.generateSeatLayout();

    await bus.save();

    return sendSuccess(res, bus, 'Bus created successfully');
  } catch (error) {
    console.error('Error creating bus:', error);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return sendError(res, 'Validation failed', {
        code: 'VALIDATION_ERROR',
        details: errors.join(', ')
      }, 400);
    }

    return sendError(res, 'Failed to create bus', {
      code: 'BUS_CREATION_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Gets a bus by ID
 */
const getBusById = async (req, res) => {
  try {
    const { id } = req.params;

    const bus = await Bus.findById(id)
      .populate('agentId', 'companyName gst supportContact')
      .populate('pricing.routeId', 'source destination distance');

    if (!bus) {
      return sendError(res, 'Bus not found', {
        code: 'BUS_NOT_FOUND',
        details: `No bus found with ID: ${id}`
      }, 404);
    }

    // Check if user is owner of the bus or admin (for authorization)
    // This would be implemented based on the user's role in the JWT token

    return sendSuccess(res, bus, 'Bus retrieved successfully');
  } catch (error) {
    console.error('Error retrieving bus:', error);
    
    if (error.name === 'CastError') {
      return sendError(res, 'Invalid bus ID format', {
        code: 'INVALID_ID',
        details: 'The provided bus ID is not valid'
      }, 400);
    }

    return sendError(res, 'Failed to retrieve bus', {
      code: 'BUS_RETRIEVAL_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Updates a bus by ID
 */
const updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Don't allow updating agentId, busNumber, or ID
    delete updateData.agentId;
    delete updateData.busNumber;
    delete updateData._id;

    const bus = await Bus.findById(id);
    
    if (!bus) {
      return sendError(res, 'Bus not found', {
        code: 'BUS_NOT_FOUND',
        details: `No bus found with ID: ${id}`
      }, 404);
    }

    // Verify that the requesting user is the owner of the bus
    if (bus.agentId.toString() !== req.user.userId) {
      return sendError(res, 'Unauthorized: You can only update your own buses', {
        code: 'UNAUTHORIZED',
        details: 'You do not have permission to update this bus'
      }, 403);
    }

    // Update bus
    Object.assign(bus, updateData);
    await bus.save();

    return sendSuccess(res, bus, 'Bus updated successfully');
  } catch (error) {
    console.error('Error updating bus:', error);
    
    if (error.name === 'CastError') {
      return sendError(res, 'Invalid bus ID format', {
        code: 'INVALID_ID',
        details: 'The provided bus ID is not valid'
      }, 400);
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return sendError(res, 'Validation failed', {
        code: 'VALIDATION_ERROR',
        details: errors.join(', ')
      }, 400);
    }

    return sendError(res, 'Failed to update bus', {
      code: 'BUS_UPDATE_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Deletes a bus by ID
 */
const deleteBus = async (req, res) => {
  try {
    const { id } = req.params;

    const bus = await Bus.findById(id);
    
    if (!bus) {
      return sendError(res, 'Bus not found', {
        code: 'BUS_NOT_FOUND',
        details: `No bus found with ID: ${id}`
      }, 404);
    }

    // Verify that the requesting user is the owner of the bus
    if (bus.agentId.toString() !== req.user.userId) {
      return sendError(res, 'Unauthorized: You can only delete your own buses', {
        code: 'UNAUTHORIZED',
        details: 'You do not have permission to delete this bus'
      }, 403);
    }

    await Bus.findByIdAndDelete(id);

    return sendSuccess(res, null, 'Bus deleted successfully');
  } catch (error) {
    console.error('Error deleting bus:', error);
    
    if (error.name === 'CastError') {
      return sendError(res, 'Invalid bus ID format', {
        code: 'INVALID_ID',
        details: 'The provided bus ID is not valid'
      }, 400);
    }

    return sendError(res, 'Failed to delete bus', {
      code: 'BUS_DELETION_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Gets all buses for an agent
 */
const getBusesByAgent = async (req, res) => {
  try {
    // Get agent ID from authenticated user
    const agentId = req.user.userId;

    // Verify that the authenticated user is indeed an agent
    const agent = await Agent.findOne({ userId: agentId });
    if (!agent) {
      return sendError(res, 'Unauthorized: Only agents can view their buses', {
        code: 'UNAUTHORIZED',
        details: 'Only verified agents can view buses'
      }, 403);
    }

    const buses = await Bus.find({ 
      agentId: agent._id 
    })
    .populate('pricing.routeId', 'source destination distance')
    .select('-__v')
    .sort({ createdAt: -1 });

    return sendSuccess(res, buses, 'Buses retrieved successfully');
  } catch (error) {
    console.error('Error retrieving buses by agent:', error);
    return sendError(res, 'Failed to retrieve buses', {
      code: 'BUSES_RETRIEVAL_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Gets all buses with optional filtering
 */
const getAllBuses = async (req, res) => {
  try {
    const { 
      type, 
      operationalStatus, 
      capacityMin, 
      capacityMax, 
      amenities, 
      agentId, 
      isActive,
      limit = 20,
      page = 0 
    } = req.query;
    
    const filters = {};
    
    if (type) {
      filters.type = type;
    }
    
    if (operationalStatus) {
      filters.operationalStatus = operationalStatus;
    }
    
    if (capacityMin || capacityMax) {
      filters.capacity = {};
      if (capacityMin) filters.capacity.$gte = parseInt(capacityMin);
      if (capacityMax) filters.capacity.$lte = parseInt(capacityMax);
    }
    
    if (amenities) {
      // Filter buses that have all the specified amenities
      const amenitiesArray = Array.isArray(amenities) ? amenities : amenities.split(',');
      filters.amenities = { $all: amenitiesArray };
    }
    
    if (agentId) {
      filters.agentId = agentId;
    }
    
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    const skip = parseInt(page) * parseInt(limit);
    const limitNum = parseInt(limit);

    const buses = await Bus.find(filters)
      .populate('agentId', 'companyName gst supportContact')
      .populate('pricing.routeId', 'source destination distance')
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .exec();

    // Get total count for pagination info
    const totalCount = await Bus.countDocuments(filters);

    return sendSuccess(res, {
      buses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limitNum),
        totalResults: totalCount,
        hasNext: skip + buses.length < totalCount,
        hasPrev: parseInt(page) > 0
      }
    }, 'Buses retrieved successfully');
  } catch (error) {
    console.error('Error retrieving all buses:', error);
    return sendError(res, 'Failed to retrieve buses', {
      code: 'BUSES_RETRIEVAL_ERROR',
      details: error.message
    }, 500);
  }
};

module.exports = {
  createBus,
  getBusById,
  updateBus,
  deleteBus,
  getBusesByAgent,
  getAllBuses
};