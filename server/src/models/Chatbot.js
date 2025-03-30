const mongoose = require('mongoose');

const ChatbotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for your chatbot'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  industry: {
    type: String,
    required: [true, 'Please specify the industry'],
    enum: [
      'E-commerce',
      'Real Estate',
      'Healthcare',
      'Education',
      'Finance',
      'Legal',
      'Hospitality',
      'Technology',
      'Manufacturing',
      'Retail',
      'Other'
    ]
  },
  language: {
    type: String,
    default: 'English'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft', 'archived'],
    default: 'draft'
  },
  settings: {
    welcomeMessage: {
      type: String,
      default: 'Hello! How can I help you today?'
    },
    brandColor: {
      type: String,
      default: '#0071e3'
    },
    chatPosition: {
      type: String,
      enum: ['left', 'right'],
      default: 'right'
    },
    autoOpen: {
      type: Boolean,
      default: false
    },
    openDelay: {
      type: Number,
      default: 5
    },
    collectEmail: {
      type: Boolean,
      default: true
    },
    offlineMessage: {
      type: String,
      default: 'We\'re not available right now, but please leave a message and we\'ll get back to you soon!'
    }
  },
  flows: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    triggers: [{
      type: {
        type: String,
        enum: ['keyword', 'button', 'intent', 'custom'],
        required: true
      },
      value: {
        type: String,
        required: true
      }
    }],
    steps: [{
      type: {
        type: String,
        enum: ['message', 'question', 'condition', 'action'],
        required: true
      },
      content: {
        type: String
      },
      buttons: [{
        text: String,
        action: String,
        value: String
      }],
      timeout: Number,
      jumpTo: String,
      conditions: [{
        variable: String,
        operator: String,
        value: String,
        jumpTo: String
      }]
    }]
  }],
  websiteUrl: String,
  integrations: {
    manyChat: {
      connected: {
        type: Boolean,
        default: false
      },
      apiKey: String,
      botId: String
    },
    make: {
      connected: {
        type: Boolean,
        default: false
      },
      webhookUrl: String
    },
    zapier: {
      connected: {
        type: Boolean,
        default: false
      },
      webhookUrl: String
    },
    email: {
      connected: {
        type: Boolean,
        default: false
      },
      address: String
    }
  },
  stats: {
    conversations: {
      type: Number,
      default: 0
    },
    messages: {
      type: Number,
      default: 0
    },
    leadsCaptured: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting conversations
ChatbotSchema.virtual('conversations', {
  ref: 'Conversation',
  localField: '_id',
  foreignField: 'chatbot',
  justOne: false
});

// Update the updatedAt timestamp before saving
ChatbotSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Chatbot', ChatbotSchema);
