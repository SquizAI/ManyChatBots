/**
 * Webhook Routes
 * API endpoints for webhook management and handling
 */

const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const { protect, authorize } = require('../middleware/auth');

// Public webhook endpoint (no authentication required)
router.post('/:webhookId', webhookController.handleWebhook);

// Protected routes (authentication required)
router.use(protect);

// Create webhook - available to all authenticated users
router.post('/', webhookController.createWebhook);

// Get all webhooks for user
router.get('/', webhookController.getWebhooks);

// Routes for specific webhook
router.route('/:id')
    .get(webhookController.getWebhook)
    .put(webhookController.updateWebhook)
    .delete(webhookController.deleteWebhook);

// Test webhook
router.post('/:id/test', webhookController.testWebhook);

// Regenerate webhook secret
router.post('/:id/regenerate-secret', webhookController.regenerateSecret);

module.exports = router;
