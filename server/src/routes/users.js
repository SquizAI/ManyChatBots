const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controllers/users');

// Include advanced results middleware
const advancedResults = require('../middleware/advancedResults');
const User = require('../models/User');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);
// Apply authorization to all routes (admin only)
router.use(authorize('admin', 'superadmin'));

router.route('/stats').get(getUserStats);

router.route('/')
  .get(advancedResults(User), getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
