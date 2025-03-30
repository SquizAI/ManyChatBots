/**
 * Response Generator
 * Generates appropriate responses based on NLU results and context
 */

class ResponseGenerator {
    constructor() {
        this.templates = new Map();
        this.fallbackResponses = [
            "I'm not sure I understood that. Could you rephrase?",
            "I'm sorry, I didn't catch that. Can you say it differently?",
            "I'm having trouble understanding. Could you explain further?",
            "Could you provide more details about what you're looking for?"
        ];
    }

    /**
     * Generate a response based on intent, entities, and context
     * @param {Object} options - Generation options
     * @param {string} options.intent - Detected intent
     * @param {Object} options.entities - Extracted entities
     * @param {Object} options.context - Conversation context
     * @param {Object} options.personalityProfile - Personality profile to use
     * @returns {Object} Generated response
     */
    generateResponse(options) {
        const { intent, entities, context, personalityProfile } = options;
        
        // If we have a specific handler for this intent, use it
        if (intent && this[`handle${intent.charAt(0).toUpperCase() + intent.slice(1)}`]) {
            return this[`handle${intent.charAt(0).toUpperCase() + intent.slice(1)}`](entities, context, personalityProfile);
        }
        
        // Look for a matching template for this intent
        if (intent && this.templates.has(intent)) {
            const template = this.templates.get(intent);
            return this.fillTemplate(template, entities, context, personalityProfile);
        }
        
        // Use fallback response if no intent matched
        return {
            text: this.getFallbackResponse(personalityProfile),
            quickReplies: [
                { title: "Tell me about your services", payload: "services" },
                { title: "How does this work?", payload: "process" },
                { title: "Talk to a human", payload: "human" }
            ]
        };
    }

    /**
     * Fill a response template with entity values
     * @param {string} template - Response template
     * @param {Object} entities - Extracted entities
     * @param {Object} context - Conversation context
     * @param {Object} personalityProfile - Personality profile to use
     * @returns {Object} Filled response
     */
    fillTemplate(template, entities, context, personalityProfile) {
        let text = template;
        
        // Replace entity placeholders
        if (entities) {
            Object.entries(entities).forEach(([name, value]) => {
                text = text.replace(new RegExp(`{${name}}`, 'g'), value);
            });
        }
        
        // Replace context variables
        if (context && context.variables) {
            Object.entries(context.variables).forEach(([name, value]) => {
                text = text.replace(new RegExp(`{${name}}`, 'g'), value);
            });
        }
        
        // Apply personality modifiers
        if (personalityProfile) {
            text = this.applyPersonalityModifiers(text, personalityProfile);
        }
        
        return { text };
    }

    /**
     * Apply personality modifiers to response text
     * @param {string} text - Response text
     * @param {Object} personalityProfile - Personality profile
     * @returns {string} Modified text
     */
    applyPersonalityModifiers(text, personalityProfile) {
        let modified = text;
        
        if (personalityProfile.emoji && personalityProfile.emojiFrequency > Math.random()) {
            modified += ` ${personalityProfile.emoji[Math.floor(Math.random() * personalityProfile.emoji.length)]}`;
        }
        
        if (personalityProfile.signoff && Math.random() < 0.3) {
            modified += `\n\n${personalityProfile.signoff}`;
        }
        
        return modified;
    }

    /**
     * Get a random fallback response
     * @param {Object} personalityProfile - Personality profile
     * @returns {string} Fallback response
     */
    getFallbackResponse(personalityProfile) {
        const baseResponse = this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)];
        
        if (personalityProfile) {
            return this.applyPersonalityModifiers(baseResponse, personalityProfile);
        }
        
        return baseResponse;
    }

    /**
     * Register a response template for an intent
     * @param {string} intent - Intent name
     * @param {string} template - Response template
     */
    registerTemplate(intent, template) {
        this.templates.set(intent, template);
    }

    /**
     * Handle greeting intent
     * @param {Object} entities - Extracted entities
     * @param {Object} context - Conversation context
     * @param {Object} personalityProfile - Personality profile
     * @returns {Object} Response
     */
    handleGreeting(entities, context, personalityProfile) {
        const greetings = [
            "Hello! How can I help you today?",
            "Hi there! What can I assist you with?",
            "Greetings! How may I be of service?",
            "Hey! What brings you here today?"
        ];
        
        const text = greetings[Math.floor(Math.random() * greetings.length)];
        const modifiedText = personalityProfile ? this.applyPersonalityModifiers(text, personalityProfile) : text;
        
        return {
            text: modifiedText,
            quickReplies: [
                { title: "Tell me about your services", payload: "services" },
                { title: "How does it work?", payload: "process" },
                { title: "Pricing", payload: "pricing" }
            ]
        };
    }
}

module.exports = new ResponseGenerator();
