/**
 * Web Chat Routes
 * API endpoints for the website chat widget
 */

const express = require('express');
const router = express.Router();
const webChatController = require('../controllers/webChat.controller');
const { rateLimit } = require('../middleware/rateLimiter');

// Apply rate limiting to prevent abuse (50 requests per 10 minutes)
const chatRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 50, // 50 requests per window
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all chat routes
router.use(chatRateLimiter);

// Initialize a chat session
router.post('/initialize', webChatController.initializeChat);

// Process user message
router.post('/message', webChatController.processMessage);

// End chat session
router.post('/end', webChatController.endChat);

// Get chat history
router.get('/history', webChatController.getChatHistory);

module.exports = router;
