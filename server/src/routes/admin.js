/**
 * Admin Routes
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Protect all admin routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Demo response for now as we haven't implemented the controller yet
router.get('/dashboard', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Admin API is working',
      demoData: {
        totalUsers: 156,
        totalChatbots: 32,
        pendingConsultations: 5,
        systemStatus: 'healthy'
      }
    }
  });
});

module.exports = router;
