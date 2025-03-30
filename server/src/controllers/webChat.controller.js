/**
 * Web Chat Controller
 * Handles API interactions for the website chat widget
 */

const AgentCore = require('../core/AgentCore');
const Conversation = require('../models/Conversation');
const Chatbot = require('../models/Chatbot');
const { handleError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Initialize a new chat session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.initializeChat = async (req, res) => {
    try {
        const { sessionId, metadata = {} } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
        }
        
        // Get default chatbot for website
        const defaultChatbot = await Chatbot.findOne({ isDefault: true, status: 'active' });
        
        if (!defaultChatbot) {
            return res.status(404).json({
                success: false,
                error: 'No default chatbot configured'
            });
        }
        
        // Check for existing conversation
        let conversation = await Conversation.findOne({
            'externalIds.webSessionId': sessionId,
            status: 'active'
        });
        
        // Create new conversation if none exists
        if (!conversation) {
            conversation = new Conversation({
                chatbot: defaultChatbot._id,
                platform: 'website',
                source: 'website',
                externalIds: {
                    webSessionId: sessionId
                },
                visitor: {
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                    referrer: req.headers.referer || req.headers.referrer,
                    pageUrl: metadata.url
                },
                status: 'active'
            });
            
            await conversation.save();
        }
        
        // Create agent instance
        const agent = AgentCore.createAgentInstance({
            integration: 'website',
            sessionId: sessionId,
            conversationId: conversation._id.toString()
        });
        
        return res.status(200).json({
            success: true,
            data: {
                sessionId,
                conversationId: conversation._id,
                chatbotId: defaultChatbot._id,
                chatbotName: defaultChatbot.name,
                welcomeMessage: defaultChatbot.welcomeMessage || "Hello! How can I assist you today?"
            }
        });
    } catch (error) {
        logger.error('Error initializing web chat', {
            error: error.message,
            stack: error.stack
        });
        return handleError(res, error);
    }
};

/**
 * Process message from web chat
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.processMessage = async (req, res) => {
    try {
        const { sessionId, message, conversationId, metadata = {} } = req.body;
        
        if (!sessionId || !message) {
            return res.status(400).json({
                success: false,
                error: 'Session ID and message are required'
            });
        }
        
        // Get conversation
        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        } else {
            conversation = await Conversation.findOne({
                'externalIds.webSessionId': sessionId,
                status: 'active'
            });
        }
        
        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }
        
        // Add user message to conversation
        conversation.addMessage({
            sender: 'user',
            content: message
        });
        
        // Create agent instance
        const agent = AgentCore.createAgentInstance({
            integration: 'website',
            sessionId: sessionId,
            conversationId: conversation._id.toString()
        });
        
        // Process message through unified agent architecture
        const response = await agent.processUserMessage({
            userId: sessionId,
            text: message,
            messageType: 'text',
            metadata: {
                platform: 'website',
                ...metadata
            }
        });
        
        // Add bot response to conversation
        conversation.addMessage({
            sender: 'bot',
            content: response.text
        });
        
        // Record agent actions
        if (response.actions && response.actions.length > 0) {
            for (const action of response.actions) {
                conversation.recordAgentAction(action);
            }
        }
        
        // Format response for web chat
        const formattedResponse = {
            message: response.text,
            conversationId: conversation._id.toString(),
            sessionId: sessionId
        };
        
        // Add quick replies if available
        if (response.quickReplies && response.quickReplies.length > 0) {
            formattedResponse.quickReplies = response.quickReplies.map(qr => qr.title);
        }
        
        return res.status(200).json({
            success: true,
            data: formattedResponse
        });
    } catch (error) {
        logger.error('Error processing web chat message', {
            error: error.message,
            stack: error.stack
        });
        return handleError(res, error);
    }
};

/**
 * End chat session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.endChat = async (req, res) => {
    try {
        const { sessionId, conversationId, feedback } = req.body;
        
        if (!sessionId && !conversationId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID or conversation ID is required'
            });
        }
        
        // Find conversation
        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        } else {
            conversation = await Conversation.findOne({
                'externalIds.webSessionId': sessionId,
                status: 'active'
            });
        }
        
        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }
        
        // Update conversation status
        conversation.status = 'closed';
        conversation.resolvedAt = new Date();
        
        // Add feedback if provided
        if (feedback) {
            conversation.rating = {
                score: feedback.rating,
                feedback: feedback.comment,
                timestamp: new Date()
            };
        }
        
        await conversation.save();
        
        return res.status(200).json({
            success: true,
            data: {
                message: 'Chat session ended successfully',
                conversationId: conversation._id.toString()
            }
        });
    } catch (error) {
        logger.error('Error ending web chat session', {
            error: error.message,
            stack: error.stack
        });
        return handleError(res, error);
    }
};

/**
 * Get chat history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getChatHistory = async (req, res) => {
    try {
        const { sessionId, conversationId } = req.query;
        
        if (!sessionId && !conversationId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID or conversation ID is required'
            });
        }
        
        // Find conversation
        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        } else {
            conversation = await Conversation.findOne({
                'externalIds.webSessionId': sessionId
            });
        }
        
        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }
        
        // Format messages for the chat widget
        const messages = conversation.messages.map(msg => ({
            text: msg.content,
            sender: msg.sender,
            timestamp: msg.timestamp
        }));
        
        return res.status(200).json({
            success: true,
            data: {
                conversationId: conversation._id.toString(),
                status: conversation.status,
                messages
            }
        });
    } catch (error) {
        logger.error('Error fetching web chat history', {
            error: error.message,
            stack: error.stack
        });
        return handleError(res, error);
    }
};
