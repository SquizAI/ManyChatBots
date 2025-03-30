const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  chatbot: {
    type: mongoose.Schema.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  // Daily metrics
  metrics: {
    conversations: {
      total: {
        type: Number,
        default: 0
      },
      unique: {
        type: Number,
        default: 0
      }
    },
    messages: {
      sent: {
        type: Number,
        default: 0
      },
      received: {
        type: Number,
        default: 0
      }
    },
    engagementRate: {
      type: Number,
      default: 0
    },
    leadsCaptured: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    averageConversationLength: {
      type: Number,
      default: 0
    },
    chatbotEffectiveness: {
      rate: {
        type: Number,
        default: 0
      },
      humanTransfers: {
        type: Number,
        default: 0
      }
    },
    userSatisfaction: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },
  // Time-based analytics
  hourlyDistribution: [{
    hour: {
      type: Number,
      min: 0,
      max: 23
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  // Popular questions/intents
  topIntents: [{
    intent: String,
    count: {
      type: Number,
      default: 0
    }
  }],
  // Traffic sources
  sources: [{
    name: String,
    count: {
      type: Number,
      default: 0
    }
  }],
  // Device analytics
  devices: [{
    type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet']
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  // Geographic distribution
  locations: [{
    country: String,
    count: {
      type: Number,
      default: 0
    }
  }],
  // Fallback tracking (unanswered questions)
  fallbacks: [{
    query: String,
    count: {
      type: Number,
      default: 0
    }
  }]
});

// Create compound index for unique chatbot+date combinations
AnalyticsSchema.index({ chatbot: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', AnalyticsSchema);
