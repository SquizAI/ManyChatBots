/**
 * ActionValidator.js
 * 
 * Validates action requests and results to ensure security and data integrity.
 * This provides a consistent way to check that actions are properly structured
 * and that required parameters are provided.
 */

/**
 * Validate an action request
 * 
 * @param {Object} action - Action configuration from registry
 * @param {Object} request - Request to execute the action
 * @param {Object} context - Execution context
 * @returns {Object} Validation result { valid: boolean, errors: array }
 */
exports.validateActionRequest = (action, request, context) => {
    const errors = [];
    
    // Check if action is enabled
    if (!action.enabled) {
        errors.push('This action is currently disabled');
        return { valid: false, errors };
    }
    
    // Check permission level
    if (!hasPermission(context.user, action.permissionLevel)) {
        errors.push(`Insufficient permissions to execute ${action.name}`);
        return { valid: false, errors };
    }
    
    // Check required parameters
    if (action.requiredParams && action.requiredParams.length > 0) {
        for (const param of action.requiredParams) {
            if (request.params === undefined || request.params[param] === undefined) {
                errors.push(`Missing required parameter: ${param}`);
            }
        }
    }
    
    // Check request format
    if (!request.id) {
        errors.push('Missing request ID');
    }
    
    // Check if action has a handler
    if (typeof action.handler !== 'function') {
        errors.push('Action has no handler function');
    }
    
    return { 
        valid: errors.length === 0, 
        errors 
    };
};

/**
 * Validate an action result
 * 
 * @param {Object} action - Action configuration from registry
 * @param {Object} result - Result of the action execution
 * @returns {Object} Validation result { valid: boolean, errors: array }
 */
exports.validateActionResult = (action, result) => {
    const errors = [];
    
    // Check that result has success property
    if (result.success === undefined) {
        errors.push('Result must include a success property');
    }
    
    // If error, check that error message is provided
    if (result.success === false && !result.error) {
        errors.push('Failed result must include an error message');
    }
    
    // If success, ensure result data is provided if needed
    if (result.success === true && action.returnsData && result.result === undefined) {
        errors.push('Successful result must include result data');
    }
    
    return { 
        valid: errors.length === 0, 
        errors 
    };
};

/**
 * Check if user has required permission level
 * 
 * @param {Object} user - User object
 * @param {String} requiredLevel - Required permission level
 * @returns {Boolean} Whether user has permission
 * @private
 */
function hasPermission(user, requiredLevel) {
    if (!user) {
        return requiredLevel === 'public';
    }
    
    const permissionLevels = {
        'public': 0,
        'user': 1,
        'premium': 2,
        'manager': 3,
        'admin': 4
    };
    
    const userLevel = permissionLevels[user.role] || 0;
    const required = permissionLevels[requiredLevel] || 0;
    
    return userLevel >= required;
}

/**
 * Sanitize action parameters to prevent malicious input
 * 
 * @param {Object} params - Action parameters
 * @returns {Object} Sanitized parameters
 */
exports.sanitizeParams = (params) => {
    if (!params || typeof params !== 'object') {
        return {};
    }
    
    const sanitized = {};
    
    // Basic sanitization (more sophisticated methods would be used in production)
    for (const [key, value] of Object.entries(params)) {
        if (typeof value === 'string') {
            // Remove potential script tags and HTML
            sanitized[key] = value
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<[^>]*>/g, '');
        } else if (value !== null && typeof value === 'object') {
            // Recursively sanitize nested objects
            sanitized[key] = exports.sanitizeParams(value);
        } else {
            // Primitive values pass through
            sanitized[key] = value;
        }
    }
    
    return sanitized;
};
