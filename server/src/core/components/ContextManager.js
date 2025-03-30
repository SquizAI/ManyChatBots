/**
 * Context Manager
 * Manages conversation context and state for each interaction
 */

class ContextManager {
    constructor() {
        this.contexts = new Map();
    }

    /**
     * Get context for a specific conversation
     * @param {string} conversationId - ID of the conversation
     * @returns {Object} Context object
     */
    getContext(conversationId) {
        if (!this.contexts.has(conversationId)) {
            this.contexts.set(conversationId, {
                sessionStarted: new Date(),
                lastUpdated: new Date(),
                turnCount: 0,
                entities: {},
                variables: {},
                intentHistory: [],
                previousMessages: [],
                currentState: 'initial'
            });
        }
        
        return this.contexts.get(conversationId);
    }

    /**
     * Update context with new information
     * @param {string} conversationId - ID of the conversation
     * @param {Object} updates - Context updates
     * @returns {Object} Updated context
     */
    updateContext(conversationId, updates) {
        const context = this.getContext(conversationId);
        
        // Merge updates with existing context
        Object.assign(context, updates);
        
        // Update metadata
        context.lastUpdated = new Date();
        context.turnCount += 1;
        
        return context;
    }

    /**
     * Add a message to context history
     * @param {string} conversationId - ID of the conversation
     * @param {string} role - Message role (user or bot)
     * @param {string} content - Message content
     * @param {Object} metadata - Additional message metadata
     */
    addMessageToHistory(conversationId, role, content, metadata = {}) {
        const context = this.getContext(conversationId);
        
        if (!context.previousMessages) {
            context.previousMessages = [];
        }
        
        context.previousMessages.push({
            role,
            content,
            timestamp: new Date(),
            ...metadata
        });
        
        // Limit history to last 10 messages to prevent context from growing too large
        if (context.previousMessages.length > 10) {
            context.previousMessages = context.previousMessages.slice(-10);
        }
    }

    /**
     * Add detected intent to history
     * @param {string} conversationId - ID of the conversation
     * @param {string} intent - Detected intent
     * @param {number} confidence - Intent confidence score
     */
    addIntentToHistory(conversationId, intent, confidence) {
        const context = this.getContext(conversationId);
        
        if (!context.intentHistory) {
            context.intentHistory = [];
        }
        
        context.intentHistory.push({
            intent,
            confidence,
            timestamp: new Date()
        });
    }

    /**
     * Clear context for a conversation
     * @param {string} conversationId - ID of the conversation
     */
    clearContext(conversationId) {
        this.contexts.delete(conversationId);
    }

    /**
     * Get summarized conversation history
     * @param {string} conversationId - ID of the conversation 
     * @returns {string} Summary of conversation
     */
    getConversationSummary(conversationId) {
        const context = this.getContext(conversationId);
        const messages = context.previousMessages || [];
        
        if (messages.length === 0) {
            return "No previous conversation history.";
        }
        
        return messages.map(msg => 
            `${msg.role}: ${msg.content}`
        ).join('\n');
    }
}

module.exports = new ContextManager();
