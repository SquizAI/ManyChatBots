/**
 * ManyChat Integration Routes
 * Defines API endpoints for ManyChat integration
 */

const express = require('express');
const router = express.Router();
const manyChatController = require('./ManyChat.controller');
const { protect, restrictTo } = require('../../middleware/auth');

// Public webhook endpoint for ManyChat to send data
router.post('/webhook', manyChatController.processWebhook);

// Protected routes (require authentication)
router.use(protect);

// Get subscriber information - restricted to admin and manager roles
router.get('/subscriber/:subscriberId', 
    restrictTo('admin', 'manager'), 
    manyChatController.getSubscriberInfo
);

// Subscribe user to tags - restricted to admin and manager roles
router.post('/subscribe-tags', 
    restrictTo('admin', 'manager'), 
    manyChatController.subscribeTags
);

module.exports = router;
