const Consultation = require('../models/Consultation');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');

// @desc    Create new consultation
// @route   POST /api/consultations
// @access  Public
exports.createConsultation = asyncHandler(async (req, res, next) => {
  // Create consultation
  const consultation = await Consultation.create(req.body);

  // Send email notification to admin
  try {
    const admins = await User.find({ role: 'admin' });
    
    if (admins.length > 0) {
      const adminEmails = admins.map(admin => admin.email);
      
      const message = `
        A new consultation request has been submitted:
        
        Name: ${req.body.name}
        Email: ${req.body.email}
        Phone: ${req.body.phone}
        Company: ${req.body.company}
        Industry: ${req.body.industry}
        Interest Level: ${req.body.interestLevel}
        Preferred Package: ${req.body.preferredPackage || 'Not specified'}
        
        Please log in to the admin panel to manage this consultation.
      `;
      
      await sendEmail({
        email: adminEmails,
        subject: 'New Consultation Request - ManyChatBot',
        message
      });
    }
  } catch (err) {
    console.error('Email notification failed:', err);
    // We don't want to fail the request if email sending fails
  }

  res.status(201).json({
    success: true,
    data: consultation
  });
});

// @desc    Get all consultations
// @route   GET /api/consultations
// @access  Private/Admin
exports.getConsultations = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single consultation
// @route   GET /api/consultations/:id
// @access  Private/Admin
exports.getConsultation = asyncHandler(async (req, res, next) => {
  const consultation = await Consultation.findById(req.params.id);

  if (!consultation) {
    return next(
      new ErrorResponse(`Consultation not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: consultation
  });
});

// @desc    Update consultation
// @route   PUT /api/consultations/:id
// @access  Private/Admin
exports.updateConsultation = asyncHandler(async (req, res, next) => {
  let consultation = await Consultation.findById(req.params.id);

  if (!consultation) {
    return next(
      new ErrorResponse(`Consultation not found with id of ${req.params.id}`, 404)
    );
  }

  consultation = await Consultation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: consultation
  });
});

// @desc    Add note to consultation
// @route   POST /api/consultations/:id/notes
// @access  Private/Admin
exports.addConsultationNote = asyncHandler(async (req, res, next) => {
  let consultation = await Consultation.findById(req.params.id);

  if (!consultation) {
    return next(
      new ErrorResponse(`Consultation not found with id of ${req.params.id}`, 404)
    );
  }

  const note = {
    content: req.body.content,
    createdBy: req.user.id
  };

  consultation.notes.push(note);
  await consultation.save();

  res.status(200).json({
    success: true,
    data: consultation
  });
});

// @desc    Delete consultation
// @route   DELETE /api/consultations/:id
// @access  Private/Admin
exports.deleteConsultation = asyncHandler(async (req, res, next) => {
  const consultation = await Consultation.findById(req.params.id);

  if (!consultation) {
    return next(
      new ErrorResponse(`Consultation not found with id of ${req.params.id}`, 404)
    );
  }

  await consultation.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get consultation stats
// @route   GET /api/consultations/stats
// @access  Private/Admin
exports.getConsultationStats = asyncHandler(async (req, res, next) => {
  // Get total count
  const totalConsultations = await Consultation.countDocuments();
  
  // Get consultations by status
  const consultationsByStatus = await Consultation.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get consultations by industry
  const consultationsByIndustry = await Consultation.aggregate([
    {
      $group: {
        _id: '$industry',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get consultations by source
  const consultationsBySource = await Consultation.aggregate([
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get recent consultations (last 30 days)
  const recentConsultations = await Consultation.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });
  
  // Get conversion rates (outcomes)
  const consultationsByOutcome = await Consultation.aggregate([
    {
      $match: { outcome: { $exists: true, $ne: null } }
    },
    {
      $group: {
        _id: '$outcome',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalConsultations,
      consultationsByStatus,
      consultationsByIndustry,
      consultationsBySource,
      recentConsultations,
      consultationsByOutcome
    }
  });
});
