const Route = require('../models/Route');
const { sendSuccess, sendError } = require('../../shared-services/utils/responseFormatter');
const { authorizeRoles } = require('../../shared-services/utils/authUtils/authMiddleware');

/**
 * Creates a new route
 */
const createRoute = async (req, res) => {
  try {
    const { source, destination, distance, duration, stops, isActive } = req.body;

    // Validate required fields
    if (!source || !destination || distance === undefined || distance === null) {
      return sendError(res, 'Missing required fields', {
        code: 'VALIDATION_ERROR',
        details: 'Source, destination, and distance are required'
      }, 400);
    }

    // Check if route already exists
    const existingRoute = await Route.findOne({ 
      source: new RegExp(`^${source}$`, 'i'), 
      destination: new RegExp(`^${destination}$`, 'i') 
    });
    
    if (existingRoute) {
      return sendError(res, 'Route already exists', {
        code: 'ROUTE_EXISTS',
        details: `A route from ${source} to ${destination} already exists`
      }, 409);
    }

    // Create new route
    const route = new Route({
      source: source.trim(),
      destination: destination.trim(),
      distance,
      duration,
      stops: stops || [],
      isActive: isActive !== undefined ? isActive : true
    });

    await route.save();

    return sendSuccess(res, route, 'Route created successfully');
  } catch (error) {
    console.error('Error creating route:', error);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return sendError(res, 'Validation failed', {
        code: 'VALIDATION_ERROR',
        details: errors.join(', ')
      }, 400);
    }

    return sendError(res, 'Failed to create route', {
      code: 'ROUTE_CREATION_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Gets a route by ID
 */
const getRouteById = async (req, res) => {
  try {
    const { id } = req.params;

    const route = await Route.findById(id);

    if (!route) {
      return sendError(res, 'Route not found', {
        code: 'ROUTE_NOT_FOUND',
        details: `No route found with ID: ${id}`
      }, 404);
    }

    return sendSuccess(res, route, 'Route retrieved successfully');
  } catch (error) {
    console.error('Error retrieving route:', error);
    
    if (error.name === 'CastError') {
      return sendError(res, 'Invalid route ID format', {
        code: 'INVALID_ID',
        details: 'The provided route ID is not valid'
      }, 400);
    }

    return sendError(res, 'Failed to retrieve route', {
      code: 'ROUTE_RETRIEVAL_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Updates a route by ID
 */
const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Don't allow updating ID
    delete updateData._id;

    const route = await Route.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!route) {
      return sendError(res, 'Route not found', {
        code: 'ROUTE_NOT_FOUND',
        details: `No route found with ID: ${id}`
      }, 404);
    }

    return sendSuccess(res, route, 'Route updated successfully');
  } catch (error) {
    console.error('Error updating route:', error);
    
    if (error.name === 'CastError') {
      return sendError(res, 'Invalid route ID format', {
        code: 'INVALID_ID',
        details: 'The provided route ID is not valid'
      }, 400);
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return sendError(res, 'Validation failed', {
        code: 'VALIDATION_ERROR',
        details: errors.join(', ')
      }, 400);
    }

    return sendError(res, 'Failed to update route', {
      code: 'ROUTE_UPDATE_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Deletes a route by ID
 */
const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;

    const route = await Route.findByIdAndDelete(id);

    if (!route) {
      return sendError(res, 'Route not found', {
        code: 'ROUTE_NOT_FOUND',
        details: `No route found with ID: ${id}`
      }, 404);
    }

    return sendSuccess(res, null, 'Route deleted successfully');
  } catch (error) {
    console.error('Error deleting route:', error);
    
    if (error.name === 'CastError') {
      return sendError(res, 'Invalid route ID format', {
        code: 'INVALID_ID',
        details: 'The provided route ID is not valid'
      }, 400);
    }

    return sendError(res, 'Failed to delete route', {
      code: 'ROUTE_DELETION_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Advanced route search functionality
 */
const searchRoutes = async (req, res) => {
  try {
    const {
      source,
      destination,
      date, // For future date-based filtering
      isActive,
      limit = 20,
      page = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query
    let query = {};
    
    // Case-insensitive search for source and destination
    if (source) {
      query.source = new RegExp(source.trim(), 'i');
    }
    
    if (destination) {
      query.destination = new RegExp(destination.trim(), 'i');
    }
    
    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // If both source and destination are provided, ensure exact match pattern
    if (source && destination) {
      query.$and = [
        { source: new RegExp(`^${source.trim()}$`, 'i') },
        { destination: new RegExp(`^${destination.trim()}$`, 'i') }
      ];
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Calculate pagination
    const skip = parseInt(page) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Execute query with pagination
    const routes = await Route.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select('-__v')
      .exec();
      
    // Get total count for pagination info
    const totalCount = await Route.countDocuments(query);
    
    return sendSuccess(res, {
      routes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limitNum),
        totalResults: totalCount,
        hasNext: skip + routes.length < totalCount,
        hasPrev: parseInt(page) > 0
      }
    }, 'Routes retrieved successfully');
  } catch (error) {
    console.error('Error searching routes:', error);
    return sendError(res, 'Failed to search routes', {
      code: 'ROUTE_SEARCH_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Gets all routes with optional filtering
 */
const getAllRoutes = async (req, res) => {
  try {
    const { source, destination, isActive, limit, page } = req.query;
    
    const filters = {};
    
    if (source) {
      filters.source = new RegExp(source, 'i');
    }
    
    if (destination) {
      filters.destination = new RegExp(destination, 'i');
    }
    
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    const options = {
      sort: { createdAt: -1 }
    };
    
    if (limit) {
      options.limit = parseInt(limit);
      options.skip = parseInt(page) * parseInt(limit) || 0;
    }

    const routes = await Route.find(filters).select('-__v').exec();

    return sendSuccess(res, routes, 'Routes retrieved successfully');
  } catch (error) {
    console.error('Error retrieving routes:', error);
    return sendError(res, 'Failed to retrieve routes', {
      code: 'ROUTES_RETRIEVAL_ERROR',
      details: error.message
    }, 500);
  }
};

module.exports = {
  createRoute,
  getRouteById,
  updateRoute,
  deleteRoute,
  getAllRoutes,
  searchRoutes // Export the new function
};