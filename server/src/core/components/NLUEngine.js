/**
 * NLUEngine.js
 * 
 * Natural Language Understanding engine that processes user messages
 * to extract intents, entities, sentiment, and other relevant information.
 * 
 * This is designed to be simple to configure while providing powerful capabilities.
 */

class NLUEngine {
    /**
     * Initialize the NLU Engine
     * 
     * @param {Object} options - Configuration options
     * @param {String} options.model - NLU model to use ('basic', 'standard', 'advanced')
     * @param {Array} options.customIntents - Custom intents to recognize
     * @param {Array} options.customEntities - Custom entity types to extract
     */
    constructor(options = {}) {
        this.options = {
            model: 'standard',
            confidenceThreshold: 0.6,
            ...options
        };
        
        this.customIntents = options.customIntents || [];
        this.customEntities = options.customEntities || [];
        
        console.log(`NLU Engine initialized with ${this.options.model} model`);
    }
    
    /**
     * Process a user message to extract understanding
     * 
     * @param {String} text - The message to process
     * @returns {Object} - Extracted information
     */
    async process(text) {
        // Here we would normally call an actual NLU service
        // For this example, we'll create a simplified simulation
        
        try {
            // Basic intent detection (simplified for demonstration)
            const intent = this.detectIntent(text);
            
            // Entity extraction
            const entities = this.extractEntities(text);
            
            // Sentiment analysis
            const sentiment = this.analyzeSentiment(text);
            
            return {
                text,
                intent,
                entities,
                sentiment,
                language: this.detectLanguage(text),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error processing text in NLU:', error);
            return {
                text,
                intent: { name: 'unknown', confidence: 0 },
                entities: [],
                sentiment: { score: 0, magnitude: 0 },
                error: true
            };
        }
    }
    
    /**
     * Detect the primary intent of a message
     * 
     * @private
     * @param {String} text - The message text
     * @returns {Object} - Detected intent
     */
    detectIntent(text) {
        const lowerText = text.toLowerCase();
        
        // Simple keyword-based intent detection for demonstration
        // In a real implementation, this would use a proper NLU model
        const basicIntents = [
            { name: 'greeting', keywords: ['hello', 'hi', 'hey', 'greetings'] },
            { name: 'farewell', keywords: ['bye', 'goodbye', 'see you', 'later'] },
            { name: 'thanks', keywords: ['thank', 'thanks', 'appreciate'] },
            { name: 'help', keywords: ['help', 'support', 'assist'] },
            { name: 'information', keywords: ['what', 'how', 'when', 'where', 'why', 'who', 'tell me about'] },
            { name: 'confirm', keywords: ['yes', 'yeah', 'correct', 'right', 'sure', 'ok'] },
            { name: 'decline', keywords: ['no', 'nope', 'not', "don't", 'disagree'] }
        ];
        
        // Add custom intents to the basic ones
        const allIntents = [...basicIntents, ...this.customIntents];
        
        // Find matching intents
        const matches = allIntents.map(intent => {
            const match = intent.keywords.some(keyword => lowerText.includes(keyword));
            return {
                name: intent.name,
                confidence: match ? 0.8 : 0, // Simplified confidence
                actionable: intent.actionable || false,
                action: intent.action || null
            };
        }).filter(intent => intent.confidence > this.options.confidenceThreshold);
        
        // Return the highest confidence intent or unknown
        if (matches.length > 0) {
            return matches.reduce((prev, current) => 
                (prev.confidence > current.confidence) ? prev : current);
        }
        
        return { name: 'unknown', confidence: 0.3 };
    }
    
    /**
     * Extract entities from a message
     * 
     * @private
     * @param {String} text - The message text
     * @returns {Array} - Extracted entities
     */
    extractEntities(text) {
        const entities = [];
        
        // Very simplified entity extraction for demonstration
        // A real implementation would use NER models
        
        // Extract dates
        const dateMatches = text.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/g);
        if (dateMatches) {
            dateMatches.forEach(match => {
                entities.push({
                    type: 'date',
                    value: match,
                    text: match
                });
            });
        }
        
        // Extract numbers
        const numberMatches = text.match(/\b\d+\b/g);
        if (numberMatches) {
            numberMatches.forEach(match => {
                entities.push({
                    type: 'number',
                    value: parseInt(match, 10),
                    text: match
                });
            });
        }
        
        // Extract emails
        const emailMatches = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
        if (emailMatches) {
            emailMatches.forEach(match => {
                entities.push({
                    type: 'email',
                    value: match,
                    text: match
                });
            });
        }
        
        // Process custom entity types
        this.customEntities.forEach(entityType => {
            if (entityType.pattern) {
                const regex = new RegExp(entityType.pattern, 'g');
                const matches = text.match(regex);
                if (matches) {
                    matches.forEach(match => {
                        entities.push({
                            type: entityType.name,
                            value: match,
                            text: match
                        });
                    });
                }
            }
        });
        
        return entities;
    }
    
    /**
     * Analyze the sentiment of a message
     * 
     * @private
     * @param {String} text - The message text
     * @returns {Object} - Sentiment analysis
     */
    analyzeSentiment(text) {
        // Simplified sentiment analysis
        const lowerText = text.toLowerCase();
        
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'like', 'happy', 'thanks'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'sorry'];
        
        let score = 0;
        
        // Count positive and negative words
        positiveWords.forEach(word => {
            if (lowerText.includes(word)) score += 0.2;
        });
        
        negativeWords.forEach(word => {
            if (lowerText.includes(word)) score -= 0.2;
        });
        
        // Clamp score between -1 and 1
        score = Math.max(-1, Math.min(1, score));
        
        // Calculate magnitude (strength of emotion)
        const magnitude = Math.abs(score);
        
        return { score, magnitude };
    }
    
    /**
     * Detect the language of a message
     * 
     * @private
     * @param {String} text - The message text
     * @returns {String} - Detected language code
     */
    detectLanguage(text) {
        // Simplified language detection
        // In a real implementation, we would use a language detection library
        return 'en'; // Default to English
    }
    
    /**
     * Get analytics data about NLU performance
     * 
     * @param {Object} options - Query options
     * @returns {Object} - Analytics data
     */
    async getAnalytics(options) {
        // In a real implementation, this would retrieve actual metrics
        return {
            intentsRecognized: 0,
            entitiesExtracted: 0,
            averageConfidence: 0,
            performanceMs: 0
        };
    }
}

module.exports = NLUEngine;
