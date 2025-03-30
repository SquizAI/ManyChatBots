/**
 * Conversation Model
 * Handles conversations between chatbots and users across multiple platforms
 * Enhanced to support ManyChat integration and unified agent architecture
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConversationSchema = new Schema({
  chatbot: {
    type: mongoose.Schema.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  visitor: {
    name: String,
    email: String,
    phone: String,
    ipAddress: String,
    userAgent: String,
    location: {
      country: String,
      city: String
    },
    referrer: String,
    customData: Schema.Types.Mixed
  },
  subscriber: {
    type: Schema.Types.ObjectId,
    ref: 'Subscriber'
  },
  platform: {
    type: String,
    enum: ['website', 'facebook', 'manychat', 'whatsapp', 'telegram', 'api'],
    default: 'website'
  },
  externalIds: {
    manychatFlowId: String,
    manychatSubscriberId: String,
    manychatConversationId: String, 
    facebookPageId: String,
    facebookUserId: String,
    other: Schema.Types.Mixed
  },
  messages: [{
    sender: {
      type: String,
      enum: ['bot', 'user', 'agent'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    attachments: [{
      type: String,
      url: String,
      name: String
    }],
    buttons: [{
      text: String,
      value: String,
      clicked: {
        type: Boolean,
        default: false
      }
    }]
  }],
  status: {
    type: String,
    enum: ['active', 'closed', 'transferred'],
    default: 'active'
  },
  tags: [String],
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    timestamp: Date
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  transferredTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  source: {
    type: String,
    enum: ['website', 'facebook', 'whatsapp', 'api', 'manychat', 'telegram'],
    default: 'website'
  },
  agentData: {
    agentId: String,
    personalityProfile: String,
    actionLog: [{
      actionType: String,
      actionName: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      successful: Boolean,
      metadata: Schema.Types.Mixed
    }],
    contextData: Schema.Types.Mixed
  },
  pageUrl: String,
  goals: [{
    name: String,
    achieved: {
      type: Boolean,
      default: false
    },
    achievedAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for fast search
ConversationSchema.index({ 'chatbot': 1, 'lastMessageAt': -1 });
ConversationSchema.index({ 'status': 1 });
ConversationSchema.index({ 'externalIds.manychatSubscriberId': 1 });
ConversationSchema.index({ 'subscriber': 1 });
ConversationSchema.index({ 'platform': 1 });

// Methods to handle ManyChat specific operations
ConversationSchema.statics.findOrCreateFromManyChat = async function(manychatData, chatbotId) {
  const Conversation = this;
  const { subscriber, conversation_id, flow_id } = manychatData;
  
  try {
    // Try to find existing conversation
    let conversation = await Conversation.findOne({
      'externalIds.manychatSubscriberId': subscriber.id,
      'externalIds.manychatConversationId': conversation_id,
      status: 'active'
    });
    
    // If no active conversation, create a new one
    if (!conversation) {
      // Get or create subscriber first
      const Subscriber = mongoose.model('Subscriber');
      const subscriberDoc = await Subscriber.findOrCreateFromManyChat(subscriber);
      
      conversation = new Conversation({
        chatbot: chatbotId,
        subscriber: subscriberDoc._id,
        platform: 'manychat',
        source: 'manychat',
        externalIds: {
          manychatFlowId: flow_id,
          manychatSubscriberId: subscriber.id,
          manychatConversationId: conversation_id || `mc-${subscriber.id}-${Date.now()}`
        },
        visitor: {
          name: subscriber.name || 'ManyChat User',
          email: subscriber.email,
          phone: subscriber.phone_number,
          customData: subscriber.custom_fields
        },
        status: 'active'
      });
    } else {
      // Update flow ID if it's changed
      if (flow_id && conversation.externalIds.manychatFlowId !== flow_id) {
        conversation.externalIds.manychatFlowId = flow_id;
      }
      
      // Update lastMessageAt
      conversation.lastMessageAt = new Date();
    }
    
    await conversation.save();
    return conversation;
  } catch (error) {
    console.error('Error creating/finding conversation from ManyChat:', error);
    throw error;
  }
};

// Create index for fast search
ConversationSchema.index({ chatbot: 1, createdAt: -1 });
ConversationSchema.index({ 'visitor.email': 1 });

// Method to add message to conversation
ConversationSchema.methods.addMessage = function(message) {
  this.messages.push(message);
  this.lastMessageAt = Date.now();
  return this.save();
};

// Method to resolve a conversation
ConversationSchema.methods.resolve = function(userId) {
  this.status = 'closed';
  this.resolvedAt = Date.now();
  this.resolvedBy = userId;
  return this.save();
};

// Add virtual field for subscriber information
ConversationSchema.virtual('subscriberInfo', {
  ref: 'Subscriber',
  localField: 'subscriber',
  foreignField: '_id',
  justOne: true
});

// Method to record agent actions
ConversationSchema.methods.recordAgentAction = function(action) {
  if (!this.agentData) {
    this.agentData = {
      actionLog: []
    };
  }
  
  if (!this.agentData.actionLog) {
    this.agentData.actionLog = [];
  }
  
  this.agentData.actionLog.push({
    actionType: action.type,
    actionName: action.name,
    timestamp: new Date(),
    successful: action.successful,
    metadata: action.metadata
  });
  
  return this.save();
};

module.exports = mongoose.model('Conversation', ConversationSchema);
