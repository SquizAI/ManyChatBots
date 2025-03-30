/**
 * Error Handler Utilities
 * Provides consistent error handling across the application
 */

const ErrorResponse = require('./errorResponse');
const logger = require('./logger');

/**
 * Handle errors in controllers and send appropriate response
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 */
exports.handleError = (res, error) => {
    let statusCode = 500;
    let message = 'Server Error';
    let errorObj = {
        success: false
    };

    // Handle custom ErrorResponse instances
    if (error instanceof ErrorResponse) {
        statusCode = error.statusCode;
        message = error.message;
    } 
    // Handle Mongoose validation errors
    else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(error.errors).map(val => val.message).join(', ');
        errorObj.errors = Object.keys(error.errors).reduce((acc, key) => {
            acc[key] = error.errors[key].message;
            return acc;
        }, {});
    } 
    // Handle Mongoose duplicate key errors
    else if (error.code === 11000) {
        statusCode = 400;
        message = `Duplicate field value entered: ${Object.keys(error.keyValue).join(', ')}`;
        errorObj.field = Object.keys(error.keyValue)[0];
    } 
    // Handle Mongoose cast errors
    else if (error.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${error.path}: ${error.value}`;
    } 
    // Handle JWT errors
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Not authorized to access this route';
    }
    // Handle generic errors
    else {
        message = error.message || 'Server Error';
    }

    // Construct error response
    errorObj.error = message;
    errorObj.stack = process.env.NODE_ENV === 'production' ? undefined : error.stack;

    // Log the error
    logger.error(message, {
        statusCode,
        stack: error.stack,
        path: res.req ? res.req.originalUrl : 'unknown'
    });

    // Send response
    return res.status(statusCode).json(errorObj);
};

/**
 * Async error handler wrapper for controller functions
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware function
 */
exports.asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
