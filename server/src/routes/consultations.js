const express = require('express');
const {
  createConsultation,
  getConsultations,
  getConsultation,
  updateConsultation,
  deleteConsultation,
  addConsultationNote,
  getConsultationStats
} = require('../controllers/consultations');

// Include advanced results middleware
const advancedResults = require('../middleware/advancedResults');
const Consultation = require('../models/Consultation');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Public route for creating consultations from website
router.route('/').post(createConsultation);

// Protected routes for admin access
router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.route('/stats').get(getConsultationStats);

router.route('/')
  .get(advancedResults(Consultation, {
    path: 'assignedTo',
    select: 'name email'
  }), getConsultations);

router.route('/:id')
  .get(getConsultation)
  .put(updateConsultation)
  .delete(deleteConsultation);

router.route('/:id/notes')
  .post(addConsultationNote);

module.exports = router;
