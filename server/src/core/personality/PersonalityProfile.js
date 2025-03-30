/**
 * PersonalityProfile.js
 * 
 * Defines the personality, tone, and behavior characteristics of a chatbot.
 * This is the primary way to customize how a chatbot interacts with users
 * while still using the same unified core architecture.
 */

class PersonalityProfile {
    /**
     * Create a new personality profile
     * 
     * @param {Object} profile - Personality configuration
     * @param {String} profile.name - Name of this personality profile
     * @param {Object} profile.tone - Tone settings (formality, friendliness, etc.)
     * @param {Object} profile.behavior - Behavior settings (proactivity, verbosity, etc.)
     * @param {Object} profile.voice - Voice characteristics (if using speech)
     * @param {Array} profile.templates - Response templates
     */
    constructor(profile = {}) {
        this.name = profile.name || 'Default';
        
        // Tone settings with defaults
        this.tone = {
            formality: 0.5,       // 0 = casual, 1 = formal
            friendliness: 0.7,    // 0 = neutral, 1 = very friendly
            humor: 0.3,           // 0 = serious, 1 = humorous
            empathy: 0.8,         // 0 = matter-of-fact, 1 = highly empathetic
            ...profile.tone
        };
        
        // Behavior settings with defaults
        this.behavior = {
            proactivity: 0.5,     // 0 = reactive only, 1 = highly proactive
            verbosity: 0.5,       // 0 = concise, 1 = verbose
            persistence: 0.3,     // 0 = easily drops topics, 1 = highly persistent
            creativity: 0.5,      // 0 = strictly factual, 1 = highly creative
            ...profile.behavior
        };
        
        // Voice settings (for speech synthesis)
        this.voice = {
            gender: 'neutral',
            pitch: 1.0,
            rate: 1.0,
            ...profile.voice
        };
        
        // Response templates
        this.templates = profile.templates || {};
        
        // Industry-specific settings
        this.industry = profile.industry || null;
        
        // Character traits
        this.traits = profile.traits || [];
        
        // Special day responses (holidays, etc.)
        this.specialDays = profile.specialDays || {};
        
        console.log(`Personality profile "${this.name}" initialized`);
    }
    
    /**
     * Get response options based on the current context
     * 
     * @param {Object} understanding - NLU understanding of user message
     * @param {Object} context - Current conversation context
     * @returns {Object} - Response options
     */
    getResponseOptions(understanding, context) {
        const responseOptions = {
            tone: this.getContextualTone(understanding, context),
            templates: this.getRelevantTemplates(understanding, context),
            suggestedActions: this.suggestActions(understanding, context),
            specialResponses: this.checkSpecialResponses(context)
        };
        
        return responseOptions;
    }
    
    /**
     * Get tone adjustments based on context
     * 
     * @private
     * @param {Object} understanding - NLU understanding of user message
     * @param {Object} context - Current conversation context
     * @returns {Object} - Adjusted tone settings
     */
    getContextualTone(understanding, context) {
        const adjustedTone = { ...this.tone };
        
        // Adjust empathy based on user sentiment
        if (understanding.sentiment && understanding.sentiment.score < -0.3) {
            // Increase empathy for negative sentiment
            adjustedTone.empathy = Math.min(1, adjustedTone.empathy + 0.2);
            adjustedTone.formality = Math.max(0, adjustedTone.formality - 0.1);
        }
        
        // Adjust formality based on conversation history
        if (context.conversationTurns > 5) {
            // Gradually become less formal as conversation progresses
            const formalityAdjustment = Math.min(0.3, context.conversationTurns * 0.02);
            adjustedTone.formality = Math.max(0, adjustedTone.formality - formalityAdjustment);
        }
        
        // Adjust humor based on user receptiveness
        if (context.userReceptiveness && context.userReceptiveness.humor) {
            adjustedTone.humor = context.userReceptiveness.humor;
        }
        
        return adjustedTone;
    }
    
    /**
     * Get templates relevant to the current conversation
     * 
     * @private
     * @param {Object} understanding - NLU understanding of user message
     * @param {Object} context - Current conversation context
     * @returns {Object} - Relevant templates
     */
    getRelevantTemplates(understanding, context) {
        const relevantTemplates = {};
        
        // Add intent-specific templates
        if (understanding.intent && this.templates[understanding.intent.name]) {
            relevantTemplates[understanding.intent.name] = this.templates[understanding.intent.name];
        }
        
        // Add general templates
        if (this.templates.general) {
            relevantTemplates.general = this.templates.general;
        }
        
        // Add error templates
        if (this.templates.error) {
            relevantTemplates.error = this.templates.error;
        }
        
        return relevantTemplates;
    }
    
    /**
     * Suggest proactive actions based on personality
     * 
     * @param {Object} understanding - NLU understanding of user message
     * @param {Object} context - Current conversation context
     * @returns {Array} - Suggested actions
     */
    suggestActions(understanding, context) {
        const suggestions = [];
        
        // Only suggest proactive actions if this personality is proactive
        if (this.behavior.proactivity < 0.3) {
            return suggestions;
        }
        
        // Example: Suggest collecting contact info for sales-focused chatbots
        if (this.industry === 'sales' && 
            understanding.intent.name === 'information' && 
            !context.hasUserContact) {
            
            suggestions.push({
                type: 'collect_user_info',
                parameters: {
                    fields: ['email', 'name'],
                    reason: 'follow_up'
                }
            });
        }
        
        // Example: Suggest showing product recommendations
        if (this.industry === 'ecommerce' && 
            (understanding.intent.name === 'product_info' || 
             understanding.intent.name === 'browse_products')) {
            
            suggestions.push({
                type: 'show_recommendations',
                parameters: {
                    basedOn: 'user_interests'
                }
            });
        }
        
        // Example: Suggest scheduling a follow-up for support chatbots
        if (this.industry === 'support' && 
            understanding.intent.name === 'problem_reported' && 
            !context.hasScheduledFollowUp) {
            
            suggestions.push({
                type: 'schedule_follow_up',
                parameters: {
                    reason: 'check_issue_resolution',
                    timeframe: '24h'
                }
            });
        }
        
        return suggestions;
    }
    
    /**
     * Check for special day responses
     * 
     * @private
     * @param {Object} context - Current conversation context
     * @returns {Object|null} - Special response if applicable
     */
    checkSpecialResponses(context) {
        // Check if today is a special day
        const today = new Date();
        const dateKey = `${today.getMonth() + 1}-${today.getDate()}`;
        
        if (this.specialDays[dateKey]) {
            return this.specialDays[dateKey];
        }
        
        // Check for time-of-day specific responses
        const hour = today.getHours();
        let timeOfDay = null;
        
        if (hour >= 5 && hour < 12) {
            timeOfDay = 'morning';
        } else if (hour >= 12 && hour < 17) {
            timeOfDay = 'afternoon';
        } else if (hour >= 17 && hour < 22) {
            timeOfDay = 'evening';
        } else {
            timeOfDay = 'night';
        }
        
        if (this.specialDays[timeOfDay]) {
            return this.specialDays[timeOfDay];
        }
        
        return null;
    }
    
    /**
     * Update the personality profile with new settings
     * 
     * @param {Object} updates - New settings to apply
     * @returns {Boolean} - Success status
     */
    update(updates) {
        try {
            // Update tone settings
            if (updates.tone) {
                this.tone = {
                    ...this.tone,
                    ...updates.tone
                };
            }
            
            // Update behavior settings
            if (updates.behavior) {
                this.behavior = {
                    ...this.behavior,
                    ...updates.behavior
                };
            }
            
            // Update voice settings
            if (updates.voice) {
                this.voice = {
                    ...this.voice,
                    ...updates.voice
                };
            }
            
            // Update templates
            if (updates.templates) {
                this.templates = {
                    ...this.templates,
                    ...updates.templates
                };
            }
            
            // Update industry
            if (updates.industry) {
                this.industry = updates.industry;
            }
            
            // Update traits
            if (updates.traits) {
                this.traits = updates.traits;
            }
            
            // Update special days
            if (updates.specialDays) {
                this.specialDays = {
                    ...this.specialDays,
                    ...updates.specialDays
                };
            }
            
            console.log(`Personality profile "${this.name}" updated`);
            return true;
        } catch (error) {
            console.error('Error updating personality profile:', error);
            return false;
        }
    }
    
    /**
     * Export the personality profile as a serializable object
     * 
     * @returns {Object} - Serialized profile
     */
    export() {
        return {
            name: this.name,
            tone: { ...this.tone },
            behavior: { ...this.behavior },
            voice: { ...this.voice },
            templates: { ...this.templates },
            industry: this.industry,
            traits: [...this.traits],
            specialDays: { ...this.specialDays }
        };
    }
}

module.exports = PersonalityProfile;
