/**
 * ResponseGenerator.js
 * 
 * Generates responses based on NLU results, conversation context, and personality profile.
 * This is a core component of the unified architecture that ensures consistent,
 * high-quality responses across all integration channels.
 */

const logger = require('../../utils/logger');

class ResponseGenerator {
    /**
     * Initialize the response generator
     * 
     * @param {Object} options - Configuration options
     * @param {Object} options.personalityProfile - Personality profile for this bot
     * @param {Object} options.knowledgeBase - Knowledge base to pull information from
     */
    constructor(options = {}) {
        this.personalityProfile = options.personalityProfile || null;
        this.knowledgeBase = options.knowledgeBase || null;
        this.fallbackResponses = [
            "I'm not sure I understand. Could you rephrase that?",
            "I didn't quite catch that. Can you say it another way?",
            "I'm having trouble understanding. Could you try again?",
            "Sorry, I'm not following. Can you clarify what you mean?"
        ];
    }

    /**
     * Generate a response based on the NLU result and conversation context
     * 
     * @param {Object} nluResult - Result from NLU processing
     * @param {Object} context - Conversation context
     * @returns {Object} Generated response object
     */
    generateResponse(nluResult, context) {
        try {
            // Handle different types of NLU results
            if (!nluResult || !nluResult.intent) {
                return this._generateFallbackResponse(context);
            }

            // Handle based on intent type
            switch (nluResult.intent.type) {
                case 'question':
                    return this._handleQuestionIntent(nluResult, context);
                case 'command':
                    return this._handleCommandIntent(nluResult, context);
                case 'statement':
                    return this._handleStatementIntent(nluResult, context);
                case 'greeting':
                    return this._handleGreetingIntent(nluResult, context);
                case 'farewell':
                    return this._handleFarewellIntent(nluResult, context);
                default:
                    return this._generateFallbackResponse(context);
            }
        } catch (error) {
            logger.error('Error generating response', { error: error.message });
            return {
                type: 'text',
                content: "I'm having some trouble right now. Please try again later.",
                fallback: true
            };
        }
    }

    /**
     * Generate a fallback response
     * 
     * @param {Object} context - Conversation context
     * @returns {Object} Fallback response
     * @private
     */
    _generateFallbackResponse(context) {
        // Choose a random fallback response
        const randomIndex = Math.floor(Math.random() * this.fallbackResponses.length);
        
        return {
            type: 'text',
            content: this.fallbackResponses[randomIndex],
            fallback: true
        };
    }

    /**
     * Handle question intent
     * 
     * @param {Object} nluResult - NLU result
     * @param {Object} context - Conversation context
     * @returns {Object} Response object
     * @private
     */
    _handleQuestionIntent(nluResult, context) {
        // If we have a knowledge base, try to find relevant information
        if (this.knowledgeBase) {
            const query = nluResult.query || nluResult.text;
            const knowledgeResults = this.knowledgeBase.search(query);
            
            if (knowledgeResults && knowledgeResults.length > 0) {
                // Use knowledge base result as response
                return {
                    type: 'text',
                    content: knowledgeResults[0].excerpt,
                    source: knowledgeResults[0].source,
                    confidence: knowledgeResults[0].confidence
                };
            }
        }
        
        // If no relevant knowledge found, use a template response
        if (this.personalityProfile && this.personalityProfile.getResponseTemplate('question_fallback')) {
            const template = this.personalityProfile.getResponseTemplate('question_fallback');
            return {
                type: 'text',
                content: this._fillTemplate(template, { query: nluResult.text }),
                fallback: true
            };
        }
        
        // Last resort fallback
        return {
            type: 'text',
            content: "I don't have information about that yet. I'll make a note to learn more about it.",
            fallback: true
        };
    }

    /**
     * Handle command intent
     * 
     * @param {Object} nluResult - NLU result
     * @param {Object} context - Conversation context
     * @returns {Object} Response object
     * @private
     */
    _handleCommandIntent(nluResult, context) {
        // Check if we can handle this command
        const command = nluResult.intent.command;
        
        if (command === 'help') {
            return {
                type: 'text',
                content: "I can answer questions, provide information, and help you with various tasks. What would you like to know?",
                suggestions: ["Tell me about your features", "How do I create a chatbot?", "What integrations do you support?"]
            };
        }
        
        // For other commands, return appropriate response
        return {
            type: 'text',
            content: `I'll try to ${command} for you, but this functionality is still being developed.`,
            actionNeeded: command
        };
    }

    /**
     * Handle statement intent
     * 
     * @param {Object} nluResult - NLU result
     * @param {Object} context - Conversation context
     * @returns {Object} Response object
     * @private
     */
    _handleStatementIntent(nluResult, context) {
        // Analyze sentiment if available
        if (nluResult.sentiment) {
            if (nluResult.sentiment.score < -0.3) {
                // Negative sentiment
                return {
                    type: 'text',
                    content: "I'm sorry to hear that. Is there anything I can help with?",
                    sentiment: 'empathetic'
                };
            } else if (nluResult.sentiment.score > 0.3) {
                // Positive sentiment
                return {
                    type: 'text',
                    content: "That's great to hear! Is there anything else you'd like to chat about?",
                    sentiment: 'positive'
                };
            }
        }
        
        // Neutral or no sentiment detected
        return {
            type: 'text',
            content: "I see. Is there anything specific you'd like to know more about?",
            sentiment: 'neutral'
        };
    }

    /**
     * Handle greeting intent
     * 
     * @param {Object} nluResult - NLU result
     * @param {Object} context - Conversation context
     * @returns {Object} Response object
     * @private
     */
    _handleGreetingIntent(nluResult, context) {
        // Check if this is the first message in conversation
        const isFirstMessage = !context.messageCount || context.messageCount === 1;
        
        if (isFirstMessage) {
            return {
                type: 'text',
                content: `Hello! Welcome to ManyChatBot. I'm here to help you with all your chatbot needs. How can I assist you today?`,
                suggestions: ["Tell me about your features", "How do I get started?", "What can you do?"]
            };
        }
        
        // Not first message
        return {
            type: 'text',
            content: `Hi there! What can I help you with?`,
            sentiment: 'friendly'
        };
    }

    /**
     * Handle farewell intent
     * 
     * @param {Object} nluResult - NLU result
     * @param {Object} context - Conversation context
     * @returns {Object} Response object
     * @private
     */
    _handleFarewellIntent(nluResult, context) {
        return {
            type: 'text',
            content: `Thank you for chatting with ManyChatBot today! If you have any more questions, feel free to ask anytime.`,
            sentiment: 'friendly',
            endConversation: true
        };
    }

    /**
     * Fill a template with variables
     * 
     * @param {String} template - Template string with placeholders
     * @param {Object} variables - Variables to inject into template
     * @returns {String} Filled template
     * @private
     */
    _fillTemplate(template, variables) {
        let result = template;
        
        for (const [key, value] of Object.entries(variables)) {
            result = result.replace(new RegExp(`{${key}}`, 'g'), value);
        }
        
        return result;
    }
}

module.exports = ResponseGenerator;
