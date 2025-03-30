/**
 * ActionFramework.js
 * 
 * Unified framework for executing actions across all chatbots.
 * This provides a consistent, secure way to perform operations
 * while maintaining appropriate access controls.
 */

const ActionRegistry = require('./ActionRegistry');
const { validateActionRequest, validateActionResult } = require('./ActionValidator');

class ActionFramework {
    /**
     * Initialize the Action Framework
     * 
     * @param {Array} availableActions - Actions available to this chatbot instance
     * @param {Object} options - Configuration options
     */
    constructor(availableActions = [], options = {}) {
        this.registry = new ActionRegistry();
        this.availableActions = new Set(availableActions);
        this.options = {
            maxConcurrentActions: 5,
            timeoutMs: 10000, // 10 seconds default timeout
            ...options
        };
        
        // Register default system actions
        this.registerSystemActions();
        
        console.log(`Action Framework initialized with ${this.availableActions.size} available actions`);
    }
    
    /**
     * Register core system actions that all chatbots have access to
     * 
     * @private
     */
    registerSystemActions() {
        // These are available to all chatbots by default
        this.availableActions.add('search_knowledge_base');
        this.availableActions.add('get_current_time');
        this.availableActions.add('get_user_profile');
        this.availableActions.add('save_conversation_note');
        this.availableActions.add('set_reminder');
    }
    
    /**
     * Execute a list of action requests
     * 
     * @param {Array} actionRequests - List of actions to execute
     * @param {Object} context - Execution context (user, session, etc.)
     * @returns {Promise<Array>} - Action results
     */
    async executeActions(actionRequests, context) {
        if (!actionRequests.length) {
            return [];
        }
        
        // Filter to only include actions this bot has access to
        const authorizedRequests = actionRequests.filter(request => 
            this.availableActions.has(request.type));
        
        if (authorizedRequests.length === 0) {
            console.warn('None of the requested actions are authorized for this bot');
            return [];
        }
        
        // Limit concurrent actions to prevent abuse
        const actionsToExecute = authorizedRequests.slice(0, this.options.maxConcurrentActions);
        
        // Execute all actions in parallel with timeout
        const actionPromises = actionsToExecute.map(request => 
            this.executeAction(request, context));
        
        try {
            return await Promise.all(actionPromises);
        } catch (error) {
            console.error('Error executing actions:', error);
            return actionsToExecute.map(request => ({
                type: request.type,
                success: false,
                error: 'Action execution failed'
            }));
        }
    }
    
    /**
     * Execute a single action with timeout
     * 
     * @private
     * @param {Object} request - The action request
     * @param {Object} context - Execution context
     * @returns {Promise<Object>} - Action result
     */
    async executeAction(request, context) {
        try {
            // Validate the action request
            const validationResult = validateActionRequest(request);
            if (!validationResult.valid) {
                return {
                    type: request.type,
                    success: false,
                    error: validationResult.error
                };
            }
            
            // Get the action handler from the registry
            const actionHandler = this.registry.getAction(request.type);
            if (!actionHandler) {
                return {
                    type: request.type,
                    success: false,
                    error: `Action type '${request.type}' not found in registry`
                };
            }
            
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Action timeout')), this.options.timeoutMs)
            );
            
            // Execute the action with timeout
            const actionPromise = actionHandler.execute(request.parameters, context);
            
            // Race the action against timeout
            const result = await Promise.race([actionPromise, timeoutPromise]);
            
            // Validate the action result
            const resultValidation = validateActionResult(result);
            if (!resultValidation.valid) {
                return {
                    type: request.type,
                    success: false,
                    error: resultValidation.error,
                    originalResult: result
                };
            }
            
            return {
                type: request.type,
                success: true,
                result
            };
        } catch (error) {
            console.error(`Error executing action ${request.type}:`, error);
            return {
                type: request.type,
                success: false,
                error: error.message || 'Unknown error during action execution'
            };
        }
    }
    
    /**
     * Register a new action to the registry
     * 
     * @param {String} actionType - Type identifier for the action
     * @param {Function} handler - Action handler function
     * @param {Object} options - Action configuration
     * @returns {Boolean} - Success status
     */
    registerAction(actionType, handler, options = {}) {
        try {
            this.registry.registerAction(actionType, handler, options);
            console.log(`Registered action: ${actionType}`);
            return true;
        } catch (error) {
            console.error(`Failed to register action ${actionType}:`, error);
            return false;
        }
    }
    
    /**
     * Add an action to the available actions list for this chatbot
     * 
     * @param {String} actionType - Type of action to add
     * @returns {Boolean} - Success status
     */
    addAvailableAction(actionType) {
        if (!this.registry.hasAction(actionType)) {
            console.warn(`Action ${actionType} is not registered in the system`);
            return false;
        }
        
        this.availableActions.add(actionType);
        return true;
    }
    
    /**
     * Remove an action from the available actions list for this chatbot
     * 
     * @param {String} actionType - Type of action to remove
     * @returns {Boolean} - Success status
     */
    removeAvailableAction(actionType) {
        if (this.isSystemAction(actionType)) {
            console.warn(`Cannot remove system action: ${actionType}`);
            return false;
        }
        
        return this.availableActions.delete(actionType);
    }
    
    /**
     * Check if an action is a built-in system action
     * 
     * @param {String} actionType - Type of action to check
     * @returns {Boolean} - True if it's a system action
     */
    isSystemAction(actionType) {
        const systemActions = [
            'search_knowledge_base',
            'get_current_time',
            'get_user_profile',
            'save_conversation_note',
            'set_reminder'
        ];
        
        return systemActions.includes(actionType);
    }
    
    /**
     * Get analytics data about action usage
     * 
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Analytics data
     */
    async getAnalytics(options) {
        // In a real implementation, this would retrieve actual metrics
        return {
            actionsExecuted: 0,
            successRate: 0,
            averageExecutionTime: 0,
            mostUsedActions: []
        };
    }
}

module.exports = ActionFramework;
