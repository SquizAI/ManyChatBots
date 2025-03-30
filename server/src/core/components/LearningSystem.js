/**
 * Learning System
 * Improves agent responses over time based on user interactions
 */

class LearningSystem {
    constructor() {
        this.feedbackData = new Map();
        this.userPatterns = new Map();
        this.intents = new Map();
    }

    /**
     * Record user feedback for a response
     * @param {string} conversationId - Conversation ID
     * @param {string} userId - User ID
     * @param {Object} feedback - Feedback data
     * @param {string} feedback.responseId - ID of the response
     * @param {number} feedback.rating - Rating (1-5)
     * @param {string} feedback.comment - Optional comment
     */
    recordFeedback(conversationId, userId, feedback) {
        if (!this.feedbackData.has(conversationId)) {
            this.feedbackData.set(conversationId, []);
        }
        
        const feedbackList = this.feedbackData.get(conversationId);
        
        feedbackList.push({
            userId,
            responseId: feedback.responseId,
            rating: feedback.rating,
            comment: feedback.comment,
            timestamp: new Date()
        });
    }

    /**
     * Record user message pattern
     * @param {string} userId - User ID
     * @param {string} message - User message
     * @param {string} intent - Detected intent
     */
    recordUserPattern(userId, message, intent) {
        if (!this.userPatterns.has(userId)) {
            this.userPatterns.set(userId, []);
        }
        
        const patterns = this.userPatterns.get(userId);
        
        patterns.push({
            message,
            intent,
            timestamp: new Date()
        });
    }

    /**
     * Improve intent recognition by adding examples
     * @param {string} intent - Intent name
     * @param {string} example - Example phrase
     */
    addIntentExample(intent, example) {
        if (!this.intents.has(intent)) {
            this.intents.set(intent, []);
        }
        
        const examples = this.intents.get(intent);
        
        if (!examples.includes(example)) {
            examples.push(example);
        }
    }

    /**
     * Get examples for an intent
     * @param {string} intent - Intent name
     * @returns {Array} Examples for the intent
     */
    getIntentExamples(intent) {
        if (!this.intents.has(intent)) {
            return [];
        }
        
        return this.intents.get(intent);
    }

    /**
     * Get suggested responses based on feedback
     * @param {string} intent - Intent
     * @returns {Array} Suggested responses
     */
    getSuggestedResponses(intent) {
        // In a real implementation, this would analyze feedback data
        // to suggest the best responses for a given intent
        return [];
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        let totalRatings = 0;
        let ratingSum = 0;
        
        // Calculate average rating
        for (const feedbackList of this.feedbackData.values()) {
            for (const feedback of feedbackList) {
                if (feedback.rating) {
                    totalRatings++;
                    ratingSum += feedback.rating;
                }
            }
        }
        
        const averageRating = totalRatings > 0 ? ratingSum / totalRatings : 0;
        
        return {
            averageRating,
            totalFeedback: totalRatings,
            totalIntents: this.intents.size,
            totalUserPatterns: this.userPatterns.size
        };
    }

    /**
     * Clear all learning data
     */
    clearAllData() {
        this.feedbackData.clear();
        this.userPatterns.clear();
        this.intents.clear();
    }
}

module.exports = new LearningSystem();
