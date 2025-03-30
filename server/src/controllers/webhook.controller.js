/**
 * Webhook Controller
 * Manages webhook creation, testing, and handling for all integrations
 */

const Webhook = require('../models/Webhook');
const Chatbot = require('../models/Chatbot');
const Conversation = require('../models/Conversation');
const Subscriber = require('../models/Subscriber');
const AgentCore = require('../core/AgentCore');
const ManyChat = require('../integrations/ManyChat/ManyChat.api');
const { handleError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Create a new webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createWebhook = async (req, res) => {
    try {
        const { name, platform, chatbotId, config } = req.body;
        
        if (!name || !platform || !chatbotId) {
            return res.status(400).json({
                success: false,
                error: 'Name, platform, and chatbotId are required'
            });
        }
        
        // Check if chatbot exists
        const chatbot = await Chatbot.findById(chatbotId);
        if (!chatbot) {
            return res.status(404).json({
                success: false,
                error: 'Chatbot not found'
            });
        }
        
        // Create webhook
        const webhook = new Webhook({
            name,
            platform,
            chatbot: chatbotId,
            user: req.user.id,
            config: config || {}
        });
        
        await webhook.save();
        
        // Generate webhook URL
        const webhookUrl = webhook.getWebhookUrl();
        
        return res.status(201).json({
            success: true,
            data: {
                webhook: {
                    id: webhook._id,
                    webhookId: webhook.webhookId,
                    name: webhook.name,
                    platform: webhook.platform,
                    status: webhook.status,
                    url: webhookUrl,
                    secret: webhook.secret,
                    createdAt: webhook.createdAt
                }
            }
        });
    } catch (error) {
        logger.error('Error creating webhook', {
            error: error.message,
            stack: error.stack
        });
        return handleError(res, error);
    }
};

/**
 * Get all webhooks for user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getWebhooks = async (req, res) => {
    try {
        const { chatbotId, platform } = req.query;
        
        // Build query
        const query = { user: req.user.id };
        
        if (chatbotId) {
            query.chatbot = chatbotId;
        }
        
        if (platform) {
            query.platform = platform;
        }
        
        // Get webhooks
        const webhooks = await Webhook.find(query)
            .populate('chatbot', 'name')
            .sort('-createdAt');
        
        // Format response
        const formattedWebhooks = webhooks.map(webhook => ({
            id: webhook._id,
            webhookId: webhook.webhookId,
            name: webhook.name,
            platform: webhook.platform,
            status: webhook.status,
            url: webhook.getWebhookUrl(),
            chatbot: webhook.chatbot,
            callCount: webhook.callCount,
            lastCalled: webhook.lastCalled,
            createdAt: webhook.createdAt
        }));
        
        return res.status(200).json({
            success: true,
            count: formattedWebhooks.length,
            data: {
                webhooks: formattedWebhooks
            }
        });
    } catch (error) {
        logger.error('Error getting webhooks', {
            error: error.message,
            stack: error.stack
        });
        return handleError(res, error);
    }
};

/**
 * Get a single webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getWebhook = async (req, res) => {
    try {
        const webhook = await Webhook.findById(req.params.id)
            .populate('chatbot', 'name');
        
        if (!webhook) {
            return res.status(404).json({
                success: false,
                error: 'Webhook not found'
            });
        }
        
        // Check if user owns the webhook
        if (webhook.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to access this webhook'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: {
                webhook: {
                    id: webhook._id,
                    webhookId: webhook.webhookId,
                    name: webhook.name,
                    platform: webhook.platform,
                    status: webhook.status,
                    url: webhook.getWebhookUrl(),
                    secret: webhook.secret,
                    chatbot: webhook.chatbot,
                    config: webhook.config,
                    callCount: webhook.callCount,
                    errorCount: webhook.errorCount,
                    lastCalled: webhook.lastCalled,
                    lastError: webhook.lastError,
                    createdAt: webhook.createdAt,
                    updatedAt: webhook.updatedAt
                }
            }
        });
    } catch (error) {
        logger.error('Error getting webhook', {
            error: error.message,
            stack: error.stack
        });
        return handleError(res, error);
    }
};

/**
 * Update webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateWebhook = async (req, res) => {
    try {
        const { name, status, config } = req.body;
        
        const webhook = await Webhook.findById(req.params.id);
        
        if (!webhook) {
            return res.status(404).json({
                success: false,
                error: 'Webhook not found'
            });
        }
        
        // Check if user owns the webhook
        if (webhook.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to update this webhook'
            });
        }
        
        // Update fields
        if (name) webhook.name = name;
        if (status) webhook.status = status;
        
        // Update config if provided
        if (config) {
            for (const [key, value] of Object.entries(config)) {
                webhook.config.set(key, value);
            }
        }
        
        await webhook.save();
        
        return res.status(200).json({
            success: true,
            data: {
                webhook: {
                    id: webhook._id,
                    webhookId: webhook.webhookId,
                    name: webhook.name,
                    platform: webhook.platform,
                    status: webhook.status,
                    url: webhook.getWebhookUrl(),
                    updatedAt: webhook.updatedAt
                }
            }
        });
    } catch (error) {
        logger.error('Error updating webhook', {
            error: error.message,
            stack: error.stack
        });
        return handleError(res, error);
    }
};

/**
 * Delete webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteWebhook = async (req, res) => {
    try {
        const webhook = await Webhook.findById(req.params.id);
        
        if (!webhook) {
            return res.status(404).json({
                success: false,
                error: 'Webhook not found'
            });
        }
        
        // Check if user owns the webhook
        if (webhook.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to delete this webhook'
            });
        }
        
        await webhook.remove();
        
        return res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        logger.error('Error deleting webhook', {
            error: error.message,
            stack: error.stack
        });
        return handleError(res, error);
    }
};

/**
 * Regenerate webhook secret
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.regenerateSecret = async (req, res) => {
    try {
        const webhook = await Webhook.findById(req.params.id);
        
        if (!webhook) {
            return res.status(404).json({
                success: false,
                error: 'Webhook not found'
            });
        }
        
        // Check if user owns the webhook
        if (webhook.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to update this webhook'
            });
        }
        
        // Regenerate secret
        const newSecret = await webhook.regenerateSecret();
        
        return res.status(200).json({
            success: true,
            data: {
                webhook: {
                    id: webhook._id,
                    secret: newSecret
                }
            }
        });
    } catch (error) {
        logger.error('Error regenerating webhook secret', {
            error: error.message,
            stack: error.stack
        });
        return handleError(res, error);
    }
};

/**
 * Handle incoming webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handleWebhook = async (req, res) => {
    try {
        const { webhookId } = req.params;
        
        // Find webhook
        const webhook = await Webhook.findOne({ webhookId });
        
        if (!webhook) {
            return res.status(404).json({
                success: false,
                error: 'Webhook not found'
            });
        }
        
        // Check if webhook is active
        if (webhook.status !== 'active') {
            return res.status(403).json({
                success: false,
                error: 'Webhook is not active'
            });
        }
        
        // Verify signature for production environments
        if (process.env.NODE_ENV === 'production') {
            const signature = req.headers['x-manychatbot-signature'];
            
            if (!signature) {
                return res.status(401).json({
                    success: false,
                    error: 'Missing signature'
                });
            }
            
            const payload = JSON.stringify(req.body);
            const isValid = webhook.verifySignature(signature, payload);
            
            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid signature'
                });
            }
        }
        
        // Update call stats
        webhook.updateCallStats(true);
        
        // Handle webhook based on platform
        if (webhook.platform === 'manychat') {
            // Process ManyChat webhook
            await handleManyChatWebhook(req, res, webhook);
        } else {
            // Generic response for other platforms
            return res.status(200).json({
                success: true,
                data: {
                    message: 'Webhook received',
                    platform: webhook.platform
                }
            });
        }
    } catch (error) {
        logger.error('Error handling webhook', {
            error: error.message,
            stack: error.stack
        });
        
        // Try to update webhook stats if possible
        try {
            if (req.params.webhookId) {
                const webhook = await Webhook.findOne({ webhookId: req.params.webhookId });
                if (webhook) {
                    await webhook.updateCallStats(false, error);
                }
            }
        } catch (statsError) {
            logger.error('Error updating webhook stats', {
                error: statsError.message
            });
        }
        
        return handleError(res, error);
    }
};

/**
 * Handle ManyChat webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} webhook - Webhook document
 */
const handleManyChatWebhook = async (req, res, webhook) => {
    const { subscriber, flow_id, message_type, message_content, conversation_id } = req.body;
    
    // Validate required webhook data
    if (!subscriber || !subscriber.id) {
        return res.status(400).json({
            success: false,
            error: 'Missing required subscriber information'
        });
    }
    
    try {
        // Find or create conversation from ManyChat data
        const conversation = await Conversation.findOrCreateFromManyChat(
            req.body,
            webhook.chatbot
        );
        
        // Create agent instance
        const agent = AgentCore.createAgentInstance({
            integration: 'manychat',
            subscriberId: subscriber.id,
            flowId: flow_id || 'default',
            conversationId: conversation._id.toString()
        });
        
        // Get or create subscriber
        const subscriberDoc = await Subscriber.findOrCreateFromManyChat(subscriber);
        
        // Process message through our unified agent architecture
        const userMessage = message_content?.text || '';
        
        // Add user message to conversation if it exists
        if (userMessage) {
            conversation.addMessage({
                sender: 'user',
                content: userMessage
            });
        }
        
        // Process message
        const processedMessage = await agent.processUserMessage({
            userId: subscriberDoc._id.toString(),
            text: userMessage,
            messageType: message_type || 'text',
            attachments: message_content?.attachments || [],
            metadata: {
                flowId: flow_id,
                platform: 'manychat',
                subscriberData: subscriber,
                webhook: webhook._id.toString()
            }
        });
        
        // Add bot response to conversation
        conversation.addMessage({
            sender: 'bot',
            content: processedMessage.text
        });
        
        // Format response for ManyChat
        const response = {
            messages: [],
            actions: []
        };
        
        // Add text responses
        if (processedMessage.text) {
            response.messages.push({
                type: 'text',
                text: processedMessage.text
            });
        }
        
        // Add quick replies if available
        if (processedMessage.quickReplies && processedMessage.quickReplies.length > 0) {
            response.messages.push({
                type: 'quick_replies',
                text: processedMessage.quickRepliesPrompt || 'Select an option:',
                quick_replies: processedMessage.quickReplies.map(qr => ({
                    title: qr.title,
                    payload: qr.payload,
                    content_type: 'text'
                }))
            });
        }
        
        // Add images if available
        if (processedMessage.images && processedMessage.images.length > 0) {
            processedMessage.images.forEach(image => {
                response.messages.push({
                    type: 'image',
                    url: image.url,
                    caption: image.caption || ''
                });
            });
        }
        
        // Add custom flow trigger actions if needed
        if (processedMessage.triggerFlow) {
            response.actions.push({
                type: 'trigger_flow',
                flow_id: processedMessage.triggerFlow
            });
        }
        
        return res.status(200).json(response);
    } catch (error) {
        logger.error('Error processing ManyChat webhook', {
            error: error.message,
            stack: error.stack
        });
        
        // Return fallback response to avoid breaking ManyChat flow
        return res.status(200).json({
            messages: [{
                type: 'text',
                text: 'I apologize, but I encountered an issue processing your request. Please try again later.'
            }],
            actions: []
        });
    }
};

/**
 * Test webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.testWebhook = async (req, res) => {
    try {
        const webhook = await Webhook.findById(req.params.id)
            .populate('chatbot', 'name');
        
        if (!webhook) {
            return res.status(404).json({
                success: false,
                error: 'Webhook not found'
            });
        }
        
        // Check if user owns the webhook
        if (webhook.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to test this webhook'
            });
        }
        
        // Update status to testing
        webhook.status = 'testing';
        await webhook.save();
        
        let testResult = {
            success: true,
            message: 'Test completed successfully',
            details: {}
        };
        
        // Perform platform-specific tests
        if (webhook.platform === 'manychat') {
            // Test ManyChat integration
            try {
                // Simple validation test only
                testResult.details = {
                    url: webhook.getWebhookUrl(),
                    webhookId: webhook.webhookId,
                    instructions: `
                        To connect this webhook to ManyChat:
                        1. Go to your ManyChat account
                        2. Navigate to Settings > Integration > API Webhooks
                        3. Create a new webhook with this URL: ${webhook.getWebhookUrl()}
                        4. Use this webhook in your ManyChat flow
                    `
                };
            } catch (testError) {
                testResult = {
                    success: false,
                    message: 'Test failed',
                    details: {
                        error: testError.message
                    }
                };
                
                webhook.status = 'error';
                webhook.lastError = {
                    message: testError.message,
                    timestamp: new Date(),
                    code: 'TEST_FAILED'
                };
            }
        }
        
        // Update webhook status based on test result
        if (testResult.success) {
            webhook.status = 'active';
        }
        
        await webhook.save();
        
        return res.status(200).json({
            success: true,
            data: {
                test: testResult,
                webhook: {
                    id: webhook._id,
                    status: webhook.status
                }
            }
        });
    } catch (error) {
        logger.error('Error testing webhook', {
            error: error.message,
            stack: error.stack
        });
        return handleError(res, error);
    }
};
