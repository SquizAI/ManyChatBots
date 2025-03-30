/**
 * AI API Routes
 * Provides endpoints for AI-powered functionality
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const aiController = require('../controllers/ai.controller');

const router = express.Router();

// Protected routes requiring authentication
router.use(protect);

// AI-powered text analysis
router.post('/analyze-sentiment', aiController.analyzeSentiment);
router.post('/extract-entities', aiController.extractEntities);
router.post('/answer-question', aiController.answerQuestion);
router.post('/generate-response', aiController.generateStructuredResponse);

// Content generation endpoints
router.post('/generate-message', aiController.generateMessage);
router.post('/improve-text', aiController.improveText);
router.post('/summarize', aiController.summarizeText);

module.exports = router;
