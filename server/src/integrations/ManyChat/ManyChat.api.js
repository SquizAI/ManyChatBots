/**
 * ManyChat API Client
 * Handles API calls to the ManyChat platform
 */

const axios = require('axios');
const logger = require('../../utils/logger');
const { MANYCHAT_API_URL, MANYCHAT_API_KEY } = process.env;

// Default API configuration
const API_CONFIG = {
    baseURL: MANYCHAT_API_URL || 'https://api.manychat.com',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MANYCHAT_API_KEY}`
    },
    timeout: 10000
};

// Create API client
const apiClient = axios.create(API_CONFIG);

// Add request interceptor for logging
apiClient.interceptors.request.use(
    config => {
        logger.debug('Making request to ManyChat API', {
            method: config.method.toUpperCase(),
            url: `${config.baseURL}${config.url}`
        });
        return config;
    },
    error => {
        logger.error('Error in ManyChat API request config', { error: error.message });
        return Promise.reject(error);
    }
);

// Add response interceptor for logging and error handling
apiClient.interceptors.response.use(
    response => {
        logger.debug('Received response from ManyChat API', {
            status: response.status,
            statusText: response.statusText
        });
        return response;
    },
    error => {
        if (error.response) {
            logger.error('ManyChat API error response', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        } else if (error.request) {
            logger.error('No response received from ManyChat API', {
                request: error.request
            });
        } else {
            logger.error('Error setting up ManyChat API request', {
                message: error.message
            });
        }
        return Promise.reject(error);
    }
);

/**
 * ManyChat API Client
 */
const ManyChat = {
    /**
     * Get subscriber information
     * @param {string} subscriberId - ManyChat subscriber ID
     * @returns {Promise<Object>} Subscriber data
     */
    getSubscriber: async (subscriberId) => {
        try {
            const response = await apiClient.get(`/subscriber/${subscriberId}`);
            return response.data;
        } catch (error) {
            logger.error('Error fetching subscriber from ManyChat', {
                subscriberId,
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Send text message to subscriber
     * @param {string} subscriberId - ManyChat subscriber ID
     * @param {string} text - Message text
     * @returns {Promise<Object>} Response data
     */
    sendTextMessage: async (subscriberId, text) => {
        try {
            const response = await apiClient.post('/sending/sendText', {
                subscriber_id: subscriberId,
                text
            });
            return response.data;
        } catch (error) {
            logger.error('Error sending text message via ManyChat', {
                subscriberId,
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Send flow to subscriber
     * @param {string} subscriberId - ManyChat subscriber ID
     * @param {string} flowId - ManyChat flow ID
     * @returns {Promise<Object>} Response data
     */
    sendFlow: async (subscriberId, flowId) => {
        try {
            const response = await apiClient.post('/sending/sendFlow', {
                subscriber_id: subscriberId,
                flow_id: flowId
            });
            return response.data;
        } catch (error) {
            logger.error('Error sending flow via ManyChat', {
                subscriberId,
                flowId,
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Add subscriber to tag
     * @param {string} subscriberId - ManyChat subscriber ID
     * @param {string} tagId - ManyChat tag ID
     * @returns {Promise<Object>} Response data
     */
    addTag: async (subscriberId, tagId) => {
        try {
            const response = await apiClient.post('/subscriber/addTag', {
                subscriber_id: subscriberId,
                tag_id: tagId
            });
            return response.data;
        } catch (error) {
            logger.error('Error adding tag to subscriber in ManyChat', {
                subscriberId,
                tagId,
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Remove subscriber from tag
     * @param {string} subscriberId - ManyChat subscriber ID
     * @param {string} tagId - ManyChat tag ID
     * @returns {Promise<Object>} Response data
     */
    removeTag: async (subscriberId, tagId) => {
        try {
            const response = await apiClient.post('/subscriber/removeTag', {
                subscriber_id: subscriberId,
                tag_id: tagId
            });
            return response.data;
        } catch (error) {
            logger.error('Error removing tag from subscriber in ManyChat', {
                subscriberId,
                tagId,
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Set custom field value for subscriber
     * @param {string} subscriberId - ManyChat subscriber ID
     * @param {string} fieldId - Custom field ID
     * @param {*} value - Field value
     * @returns {Promise<Object>} Response data
     */
    setCustomField: async (subscriberId, fieldId, value) => {
        try {
            const response = await apiClient.post('/subscriber/setCustomField', {
                subscriber_id: subscriberId,
                field_id: fieldId,
                field_value: value
            });
            return response.data;
        } catch (error) {
            logger.error('Error setting custom field in ManyChat', {
                subscriberId,
                fieldId,
                value,
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Get bot tags
     * @returns {Promise<Object>} Tag data
     */
    getTags: async () => {
        try {
            const response = await apiClient.get('/tags');
            return response.data;
        } catch (error) {
            logger.error('Error fetching tags from ManyChat', {
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Get custom fields
     * @returns {Promise<Object>} Custom fields data
     */
    getCustomFields: async () => {
        try {
            const response = await apiClient.get('/custom_fields');
            return response.data;
        } catch (error) {
            logger.error('Error fetching custom fields from ManyChat', {
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Create tag
     * @param {string} name - Tag name
     * @returns {Promise<Object>} Created tag data
     */
    createTag: async (name) => {
        try {
            const response = await apiClient.post('/tags', { name });
            return response.data;
        } catch (error) {
            logger.error('Error creating tag in ManyChat', {
                name,
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Create custom field
     * @param {string} name - Field name
     * @param {string} type - Field type (text, number, boolean, date)
     * @returns {Promise<Object>} Created field data
     */
    createCustomField: async (name, type = 'text') => {
        try {
            const response = await apiClient.post('/custom_fields', { 
                name, 
                type 
            });
            return response.data;
        } catch (error) {
            logger.error('Error creating custom field in ManyChat', {
                name,
                type,
                error: error.message
            });
            throw error;
        }
    }
};

module.exports = ManyChat;
