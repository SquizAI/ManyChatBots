/**
 * ActionRegistry.js
 * 
 * Registry of all available actions that can be performed by the chatbot.
 * This provides a central place to register, manage, and access actions.
 */

class ActionRegistry {
    /**
     * Initialize the action registry
     */
    constructor() {
        this.actions = new Map();
        this.categories = new Map();
        
        // Register built-in actions
        this._registerBuiltInActions();
    }
    
    /**
     * Register a new action
     * 
     * @param {String} name - Unique action identifier
     * @param {Object} actionConfig - Action configuration
     * @param {Function} actionConfig.handler - Function that executes the action
     * @param {String} actionConfig.description - Description of what the action does
     * @param {Array} actionConfig.requiredParams - Parameters required by the action
     * @param {String} actionConfig.category - Category this action belongs to
     * @param {String} actionConfig.permissionLevel - Required permission level ('user', 'admin', etc.)
     * @returns {Boolean} Success
     */
    registerAction(name, actionConfig) {
        if (this.actions.has(name)) {
            console.warn(`Action ${name} is already registered. Use updateAction to modify it.`);
            return false;
        }
        
        // Add to registry
        this.actions.set(name, {
            name,
            handler: actionConfig.handler,
            description: actionConfig.description || 'No description provided',
            requiredParams: actionConfig.requiredParams || [],
            category: actionConfig.category || 'general',
            permissionLevel: actionConfig.permissionLevel || 'user',
            enabled: true,
            registered: new Date()
        });
        
        // Update category index
        if (!this.categories.has(actionConfig.category)) {
            this.categories.set(actionConfig.category, new Set());
        }
        this.categories.get(actionConfig.category).add(name);
        
        return true;
    }
    
    /**
     * Get an action by name
     * 
     * @param {String} name - Action name
     * @returns {Object|null} Action configuration or null if not found
     */
    getAction(name) {
        return this.actions.get(name) || null;
    }
    
    /**
     * Update an existing action
     * 
     * @param {String} name - Action name
     * @param {Object} updates - Properties to update
     * @returns {Boolean} Success
     */
    updateAction(name, updates) {
        if (!this.actions.has(name)) {
            console.warn(`Action ${name} does not exist and cannot be updated.`);
            return false;
        }
        
        const action = this.actions.get(name);
        
        // Apply updates
        Object.assign(action, updates);
        
        // Update category index if category changed
        if (updates.category && updates.category !== action.category) {
            // Remove from old category
            if (this.categories.has(action.category)) {
                this.categories.get(action.category).delete(name);
            }
            
            // Add to new category
            if (!this.categories.has(updates.category)) {
                this.categories.set(updates.category, new Set());
            }
            this.categories.get(updates.category).add(name);
            
            // Update action category
            action.category = updates.category;
        }
        
        return true;
    }
    
    /**
     * Remove an action from the registry
     * 
     * @param {String} name - Action name
     * @returns {Boolean} Success
     */
    unregisterAction(name) {
        if (!this.actions.has(name)) {
            console.warn(`Action ${name} does not exist and cannot be unregistered.`);
            return false;
        }
        
        const action = this.actions.get(name);
        
        // Remove from category index
        if (this.categories.has(action.category)) {
            this.categories.get(action.category).delete(name);
        }
        
        // Remove from actions map
        this.actions.delete(name);
        
        return true;
    }
    
    /**
     * Get all actions in a specific category
     * 
     * @param {String} category - Category name
     * @returns {Array} Array of action configurations
     */
    getActionsByCategory(category) {
        if (!this.categories.has(category)) {
            return [];
        }
        
        const actionNames = Array.from(this.categories.get(category));
        return actionNames.map(name => this.actions.get(name));
    }
    
    /**
     * Get all registered actions
     * 
     * @returns {Array} Array of all action configurations
     */
    getAllActions() {
        return Array.from(this.actions.values());
    }
    
    /**
     * Check if an action is registered
     * 
     * @param {String} name - Action name
     * @returns {Boolean} Whether the action exists
     */
    hasAction(name) {
        return this.actions.has(name);
    }
    
    /**
     * Enable an action
     * 
     * @param {String} name - Action name
     * @returns {Boolean} Success
     */
    enableAction(name) {
        if (!this.actions.has(name)) {
            return false;
        }
        
        this.actions.get(name).enabled = true;
        return true;
    }
    
    /**
     * Disable an action
     * 
     * @param {String} name - Action name
     * @returns {Boolean} Success
     */
    disableAction(name) {
        if (!this.actions.has(name)) {
            return false;
        }
        
        this.actions.get(name).enabled = false;
        return true;
    }
    
    /**
     * Register built-in actions
     * @private
     */
    _registerBuiltInActions() {
        // Register basic utility actions
        this.registerAction('getTime', {
            handler: () => ({ success: true, result: new Date().toISOString() }),
            description: 'Get the current server time',
            category: 'utilities'
        });
        
        this.registerAction('echo', {
            handler: (params) => ({ success: true, result: params.message }),
            description: 'Echo back the input message',
            requiredParams: ['message'],
            category: 'utilities'
        });
    }
}

module.exports = ActionRegistry;
