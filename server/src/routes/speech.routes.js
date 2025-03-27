/**
 * Speech-to-Text API Routes
 * Routes for handling speech recognition features
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const speechController = require('../controllers/speech.controller');

// Process audio file and convert to text
router.post('/process', speechController.processAudio);

// Get available DeepGram models
router.get('/models', speechController.getModels);

// Get token for live transcription
router.get('/live-token', speechController.getLiveTranscriptionToken);

module.exports = router;
