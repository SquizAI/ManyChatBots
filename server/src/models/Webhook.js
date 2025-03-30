/**
 * Webhook Model
 * Manages webhook connections between ManyChatBot and external platforms
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const Schema = mongoose.Schema;

const WebhookSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Webhook name is required'],
        trim: true
    },
    platform: {
        type: String,
        required: [true, 'Platform is required'],
        enum: ['manychat', 'facebook', 'telegram', 'whatsapp', 'website', 'api', 'other'],
        default: 'manychat'
    },
    endpointUrl: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'testing', 'error'],
        default: 'inactive'
    },
    secret: {
        type: String,
        default: () => crypto.randomBytes(32).toString('hex')
    },
    webhookId: {
        type: String,
        unique: true,
        default: () => `wh_${crypto.randomBytes(10).toString('hex')}`
    },
    chatbot: {
        type: Schema.Types.ObjectId,
        ref: 'Chatbot',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    config: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {}
    },
    lastCalled: {
        type: Date
    },
    callCount: {
        type: Number,
        default: 0
    },
    errorCount: {
        type: Number,
        default: 0
    },
    lastError: {
        message: String,
        timestamp: Date,
        code: String
    },
    metadata: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Index for fast lookups
WebhookSchema.index({ webhookId: 1 }, { unique: true });
WebhookSchema.index({ chatbot: 1, platform: 1 });
WebhookSchema.index({ user: 1 });

/**
 * Generate webhook URL
 * @returns {string} Webhook URL
 */
WebhookSchema.methods.getWebhookUrl = function() {
    const baseUrl = process.env.API_URL || 'https://api.manychatbot.com';
    return `${baseUrl}/webhooks/${this.webhookId}`;
};

/**
 * Update call statistics
 * @param {boolean} success - Whether the call was successful
 * @param {Object} error - Error object if call failed
 */
WebhookSchema.methods.updateCallStats = async function(success, error = null) {
    this.callCount += 1;
    this.lastCalled = new Date();
    
    if (!success) {
        this.errorCount += 1;
        if (error) {
            this.lastError = {
                message: error.message || 'Unknown error',
                timestamp: new Date(),
                code: error.code || 'UNKNOWN'
            };
        }
    }
    
    return this.save();
};

/**
 * Verify webhook signature
 * @param {string} signature - Signature from request headers
 * @param {string} payload - Request body as string
 * @returns {boolean} Whether signature is valid
 */
WebhookSchema.methods.verifySignature = function(signature, payload) {
    const hmac = crypto.createHmac('sha256', this.secret);
    const computedSignature = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(computedSignature, 'hex')
    );
};

/**
 * Regenerate webhook secret
 * @returns {string} New secret
 */
WebhookSchema.methods.regenerateSecret = async function() {
    this.secret = crypto.randomBytes(32).toString('hex');
    await this.save();
    return this.secret;
};

const Webhook = mongoose.model('Webhook', WebhookSchema);

module.exports = Webhook;
