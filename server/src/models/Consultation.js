const mongoose = require('mongoose');

const ConsultationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number']
  },
  company: {
    type: String,
    required: [true, 'Please add a company name']
  },
  website: {
    type: String
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
  interestLevel: {
    type: String,
    required: [true, 'Please specify interest level'],
    enum: [
      'Just exploring',
      'Interested in learning more',
      'Ready to implement soon',
      'Urgent need'
    ]
  },
  source: {
    type: String,
    enum: [
      'Google',
      'Social Media',
      'Referral',
      'Advertisement',
      'Blog Post',
      'Event',
      'Other'
    ],
    default: 'Other'
  },
  message: {
    type: String
  },
  preferredPackage: {
    type: String,
    enum: ['Basic', 'Professional', 'Enterprise', 'Not Sure'],
    default: 'Not Sure'
  },
  status: {
    type: String,
    enum: ['New', 'Scheduled', 'Completed', 'Canceled', 'No-Show'],
    default: 'New'
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  scheduledDate: {
    type: Date
  },
  notes: [{
    content: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  outcome: {
    type: String,
    enum: ['Not Interested', 'Future Follow-up', 'Proposal Sent', 'Converted to Client', 'Lost'],
  },
  followUpDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for fast search by createdAt
ConsultationSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Consultation', ConsultationSchema);
