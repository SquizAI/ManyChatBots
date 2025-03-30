/**
 * Analytics Routes
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Demo response for now as we haven't implemented the controller yet
router.get('/', protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Analytics API is working',
      demoData: {
        visitors: 1254,
        conversations: 431,
        conversionRate: '34%',
        averageResponseTime: '1.2s'
      }
    }
  });
});

module.exports = router;
