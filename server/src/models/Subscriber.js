/**
 * Subscriber Model
 * Stores information about subscribers from ManyChat and other platforms
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubscriberSchema = new Schema({
    externalId: {
        type: String,
        required: [true, 'External subscriber ID is required'],
        index: true
    },
    platform: {
        type: String,
        required: [true, 'Platform is required'],
        enum: ['manychat', 'messenger', 'telegram', 'website', 'other'],
        default: 'manychat'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'blocked', 'deleted'],
        default: 'active'
    },
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    fullName: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    phone: {
        type: String,
        trim: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'unknown'],
        default: 'unknown'
    },
    locale: {
        type: String,
        default: 'en_US'
    },
    timezone: {
        type: String
    },
    profilePicture: {
        type: String
    },
    tags: [String],
    customFields: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {}
    },
    lastInteraction: {
        type: Date,
        default: Date.now
    },
    firstSeen: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {}
    },
    chatHistory: [{
        type: Schema.Types.ObjectId,
        ref: 'Conversation'
    }],
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound index for platform and externalId to ensure uniqueness
SubscriberSchema.index({ platform: 1, externalId: 1 }, { unique: true });

// Virtual for full name
SubscriberSchema.virtual('name').get(function() {
    if (this.fullName) return this.fullName;
    if (this.firstName && this.lastName) return `${this.firstName} ${this.lastName}`;
    if (this.firstName) return this.firstName;
    if (this.lastName) return this.lastName;
    return 'Unknown User';
});

// Static method to find or create subscriber from ManyChat data
SubscriberSchema.statics.findOrCreateFromManyChat = async function(subscriberData) {
    const Subscriber = this;
    
    const { id, status, first_name, last_name, name, gender, profile_pic, locale, timezone, custom_fields } = subscriberData;
    
    try {
        // Try to find existing subscriber
        let subscriber = await Subscriber.findOne({
            platform: 'manychat',
            externalId: id
        });
        
        // If no subscriber found, create new one
        if (!subscriber) {
            subscriber = new Subscriber({
                platform: 'manychat',
                externalId: id,
                status: status === 'active' ? 'active' : 'inactive',
                firstName: first_name,
                lastName: last_name,
                fullName: name,
                gender: gender || 'unknown',
                profilePicture: profile_pic,
                locale: locale,
                timezone: timezone
            });
        } else {
            // Update existing subscriber
            subscriber.status = status === 'active' ? 'active' : 'inactive';
            subscriber.firstName = first_name || subscriber.firstName;
            subscriber.lastName = last_name || subscriber.lastName;
            subscriber.fullName = name || subscriber.fullName;
            subscriber.profilePicture = profile_pic || subscriber.profilePicture;
            subscriber.locale = locale || subscriber.locale;
            subscriber.timezone = timezone || subscriber.timezone;
            subscriber.lastInteraction = new Date();
        }
        
        // Process custom fields if available
        if (custom_fields && custom_fields.length > 0) {
            custom_fields.forEach(field => {
                if (field.name && field.value !== undefined) {
                    subscriber.customFields.set(field.name, field.value);
                }
            });
        }
        
        await subscriber.save();
        return subscriber;
    } catch (error) {
        console.error('Error creating/updating subscriber from ManyChat:', error);
        throw error;
    }
};

// Pre-save middleware to ensure the subscriber has a full name
SubscriberSchema.pre('save', function(next) {
    if (!this.fullName && (this.firstName || this.lastName)) {
        this.fullName = this.get('name');
    }
    next();
});

const Subscriber = mongoose.model('Subscriber', SubscriberSchema);

module.exports = Subscriber;
