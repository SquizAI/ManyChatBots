/**
 * ManyChat Integration Controller
 * Handles webhook interactions with ManyChat platform
 * Connects to the unified agent architecture
 */

const AgentCore = require('../../core/AgentCore');
const KnowledgeBase = require('../../core/knowledge/KnowledgeBase');
const { handleError } = require('../../utils/errorHandler');
const logger = require('../../utils/logger');

// Configure response timeout (in milliseconds)
const RESPONSE_TIMEOUT = 10000;

/**
 * Process incoming ManyChat webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.processWebhook = async (req, res) => {
    try {
        logger.info('Processing ManyChat webhook', { data: req.body });
        
        const { 
            subscriber,
            flow_id: flowId, 
            message_type: messageType,
            message_content: messageContent,
            conversation_id: conversationId
        } = req.body;
        
        // Validate required webhook data
        if (!subscriber || !subscriber.id) {
            return res.status(400).json({
                success: false,
                error: 'Missing required subscriber information'
            });
        }
        
        // Create agent instance using our ChatbotFactory (indirectly through AgentCore)
        const agent = AgentCore.createAgentInstance({
            integration: 'manychat',
            subscriberId: subscriber.id,
            flowId: flowId || 'default',
            conversationId: conversationId || `manychat-${subscriber.id}-${Date.now()}`
        });
        
        // Set timeout for webhook response
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Response timeout')), RESPONSE_TIMEOUT)
        );
        
        // Process message through our unified agent architecture
        const responsePromise = processMessage(agent, {
            subscriber,
            messageType,
            messageContent,
            flowId
        });
        
        // Race between timeout and actual processing
        const response = await Promise.race([responsePromise, timeoutPromise]);
        
        // Send response back to ManyChat
        return res.status(200).json({
            success: true,
            data: response
        });
    } catch (error) {
        logger.error('Error processing ManyChat webhook', { error: error.message, stack: error.stack });
        return handleError(res, error);
    }
};

/**
 * Process message through unified agent architecture
 * @param {Object} agent - Agent instance
 * @param {Object} data - Webhook data
 * @returns {Promise<Object>} Agent response
 */
async function processMessage(agent, data) {
    try {
        const { subscriber, messageType, messageContent, flowId } = data;
        
        // Retrieve user data from ManyChat subscriber
        const userData = {
            id: subscriber.id,
            name: subscriber.name || 'ManyChat User',
            firstName: subscriber.first_name || 'User',
            phone: subscriber.phone_number,
            email: subscriber.email,
            externalPlatform: 'manychat',
            externalId: subscriber.id
        };
        
        // Add user data to knowledge base
        await KnowledgeBase.storeUserData(userData);
        
        // Process message through NLU and generate response
        const processedMessage = await agent.processUserMessage({
            userId: userData.id,
            text: messageContent?.text || '',
            messageType: messageType || 'text',
            attachments: messageContent?.attachments || [],
            metadata: {
                flowId,
                platform: 'manychat',
                subscriberData: subscriber
            }
        });
        
        // Format response for ManyChat
        const response = formatResponseForManyChat(processedMessage, flowId);
        
        logger.info('Processed message through agent', { 
            userId: userData.id,
            response: response 
        });
        
        return response;
    } catch (error) {
        logger.error('Error processing message through agent', { 
            error: error.message, 
            stack: error.stack 
        });
        
        // Return fallback response
        return {
            messages: [
                {
                    type: 'text',
                    text: 'I apologize, but I encountered an issue processing your request. Please try again later.'
                }
            ],
            actions: []
        };
    }
}

/**
 * Format agent response for ManyChat platform
 * @param {Object} processedMessage - Processed message from agent
 * @param {string} flowId - ManyChat flow ID
 * @returns {Object} Formatted response for ManyChat
 */
function formatResponseForManyChat(processedMessage, flowId) {
    // Default response structure for ManyChat
    const formattedResponse = {
        messages: [],
        actions: []
    };
    
    // Add text responses
    if (processedMessage.text) {
        formattedResponse.messages.push({
            type: 'text',
            text: processedMessage.text
        });
    }
    
    // Add quick replies if available
    if (processedMessage.quickReplies && processedMessage.quickReplies.length > 0) {
        formattedResponse.messages.push({
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
            formattedResponse.messages.push({
                type: 'image',
                url: image.url,
                caption: image.caption || ''
            });
        });
    }
    
    // Add custom flow trigger actions if needed
    if (processedMessage.triggerFlow) {
        formattedResponse.actions.push({
            type: 'trigger_flow',
            flow_id: processedMessage.triggerFlow
        });
    }
    
    return formattedResponse;
}

/**
 * Subscribe user to specific ManyChat tags or sequences
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.subscribeTags = async (req, res) => {
    try {
        const { subscriberId, tags, sequences } = req.body;
        
        if (!subscriberId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required subscriber ID'
            });
        }
        
        logger.info('Subscribing user to ManyChat tags/sequences', { 
            subscriberId, 
            tags, 
            sequences 
        });
        
        // Here we would call ManyChat API to subscribe user to tags/sequences
        // This is a placeholder for the actual API call
        
        return res.status(200).json({
            success: true,
            message: 'Subscription successful',
            data: { subscriberId, tags, sequences }
        });
    } catch (error) {
        logger.error('Error subscribing to ManyChat tags', { 
            error: error.message, 
            stack: error.stack 
        });
        return handleError(res, error);
    }
};

/**
 * Get subscriber information from ManyChat
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSubscriberInfo = async (req, res) => {
    try {
        const { subscriberId } = req.params;
        
        if (!subscriberId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required subscriber ID'
            });
        }
        
        logger.info('Getting ManyChat subscriber information', { subscriberId });
        
        // Here we would call ManyChat API to get subscriber info
        // This is a placeholder for the actual API call
        
        // Mock response for now
        const subscriberInfo = {
            id: subscriberId,
            name: 'John Doe',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            phone_number: '+1234567890',
            tags: ['interested', 'newsletter'],
            custom_fields: {
                last_purchase: '2023-05-15',
                loyalty_points: 250
            }
        };
        
        return res.status(200).json({
            success: true,
            data: subscriberInfo
        });
    } catch (error) {
        logger.error('Error getting ManyChat subscriber info', { 
            error: error.message, 
            stack: error.stack 
        });
        return handleError(res, error);
    }
};
