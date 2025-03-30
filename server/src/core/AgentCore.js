/**
 * AgentCore.js
 * 
 * This is the central engine that powers all ManyChatBot instances.
 * It provides a unified architecture where all chatbots share the same
 * powerful capabilities but can be customized with different personalities
 * and knowledge bases.
 */

const NLUEngine = require('./components/NLUEngine');
const ContextManager = require('./components/ContextManager');
const ResponseGenerator = require('./components/ResponseGenerator');
const MemorySystem = require('./components/MemorySystem');
const LearningSystem = require('./components/LearningSystem');
const ActionFramework = require('./actions/ActionFramework');
const KnowledgeBase = require('./knowledge/KnowledgeBase');
const PersonalityProfile = require('./personality/PersonalityProfile');

class AgentCore {
    /**
     * Initialize a new agent with specified personality and knowledge
     * 
     * @param {Object} config - Configuration options
     * @param {String} config.botId - Unique identifier for this chatbot
     * @param {Object} config.personalityProfile - Personality settings
     * @param {Object} config.knowledgeConfig - Knowledge base configuration
     * @param {Array} config.actions - Available actions for this bot
     * @param {Object} config.options - Additional options
     */
    constructor(config) {
        this.botId = config.botId;
        this.userId = config.userId;
        
        // Initialize core components
        this.nlu = new NLUEngine(config.nluOptions);
        this.context = new ContextManager(config.contextOptions);
        this.responseGen = new ResponseGenerator(config.responseOptions);
        this.memory = new MemorySystem(config.memoryOptions);
        this.learning = new LearningSystem(config.learningOptions);
        
        // Initialize the action framework
        this.actions = new ActionFramework(config.actions);
        
        // Load personality and knowledge
        this.personality = new PersonalityProfile(config.personalityProfile);
        this.knowledge = new KnowledgeBase(config.knowledgeConfig);
        
        // Additional options
        this.options = config.options || {};
        
        console.log(`AgentCore initialized for bot: ${this.botId}`);
    }
    
    /**
     * Process an incoming message and generate a response
     * 
     * @param {Object} message - The user message
     * @param {String} message.text - The message content
     * @param {String} message.userId - ID of the user
     * @param {String} message.sessionId - Current session ID
     * @param {Object} message.metadata - Additional message metadata
     * @returns {Promise<Object>} - The agent's response
     */
    async processMessage(message) {
        try {
            // 1. Process the message with NLU
            const understanding = await this.nlu.process(message.text);
            
            // 2. Update the conversation context
            const context = await this.context.update({
                sessionId: message.sessionId,
                userId: message.userId,
                understanding,
                metadata: message.metadata
            });
            
            // 3. Retrieve relevant knowledge
            const knowledge = await this.knowledge.query({
                understanding,
                context,
                userId: message.userId
            });
            
            // 4. Determine needed actions (if any)
            const actionRequests = this.determineActions(understanding, context, knowledge);
            
            // 5. Execute any required actions
            const actionResults = await this.actions.executeActions(actionRequests, {
                userId: message.userId,
                sessionId: message.sessionId,
                botId: this.botId
            });
            
            // 6. Generate a response using the personality profile
            const responseOptions = this.personality.getResponseOptions(understanding, context);
            const response = await this.responseGen.generate({
                understanding,
                context,
                knowledge,
                actionResults,
                responseOptions
            });
            
            // 7. Update memory with this interaction
            await this.memory.store({
                sessionId: message.sessionId,
                userId: message.userId,
                message: message.text,
                understanding,
                response,
                actions: actionResults
            });
            
            // 8. Let the learning system analyze the interaction
            this.learning.learn({
                understanding,
                context,
                knowledge,
                response,
                actionResults
            });
            
            return {
                text: response.text,
                actions: response.actions,
                suggestions: response.suggestions,
                metadata: response.metadata
            };
        } catch (error) {
            console.error('Error processing message:', error);
            return {
                text: "I'm sorry, I encountered an error processing your message. Please try again.",
                error: true
            };
        }
    }
    
    /**
     * Determine what actions need to be taken based on understanding
     * 
     * @private
     */
    determineActions(understanding, context, knowledge) {
        // Use intent and entities to determine required actions
        const actionRequests = [];
        
        // Check for explicit action requests
        if (understanding.intent.actionable) {
            actionRequests.push({
                type: understanding.intent.action,
                parameters: understanding.entities
            });
        }
        
        // Check for knowledge-based action needs
        if (knowledge.requiresAction) {
            actionRequests.push(...knowledge.suggestedActions);
        }
        
        // Check personality-based proactive actions
        const proactiveActions = this.personality.suggestActions(understanding, context);
        if (proactiveActions.length > 0) {
            actionRequests.push(...proactiveActions);
        }
        
        return actionRequests;
    }
    
    /**
     * Update the agent's knowledge base
     * 
     * @param {Object} knowledgeUpdate - New knowledge content
     */
    async updateKnowledge(knowledgeUpdate) {
        return await this.knowledge.update(knowledgeUpdate);
    }
    
    /**
     * Update the agent's personality settings
     * 
     * @param {Object} personalityUpdate - New personality settings
     */
    updatePersonality(personalityUpdate) {
        return this.personality.update(personalityUpdate);
    }
    
    /**
     * Get analytics data about this agent's performance
     * 
     * @param {Object} options - Query options
     */
    async getAnalytics(options) {
        // Collect analytics from all components
        const analytics = {
            nlu: await this.nlu.getAnalytics(options),
            memory: await this.memory.getAnalytics(options),
            actions: await this.actions.getAnalytics(options),
            responses: await this.responseGen.getAnalytics(options),
            learning: await this.learning.getAnalytics(options)
        };
        
        return analytics;
    }
    
    /**
     * Reset the conversation context
     * 
     * @param {String} sessionId - The session to reset
     */
    async resetContext(sessionId) {
        return await this.context.reset(sessionId);
    }
}

module.exports = AgentCore;
