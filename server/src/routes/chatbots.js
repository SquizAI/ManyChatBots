const express = require('express');
const {
  getChatbots,
  getChatbot,
  createChatbot,
  updateChatbot,
  deleteChatbot,
  getChatbotStats,
  getEmbedCode
} = require('../controllers/chatbots');

// Include advanced results middleware
const advancedResults = require('../middleware/advancedResults');
const Chatbot = require('../models/Chatbot');

const router = express.Router();

const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

router.route('/')
  .get(advancedResults(Chatbot, 'user'), getChatbots)
  .post(createChatbot);

router.route('/:id')
  .get(getChatbot)
  .put(updateChatbot)
  .delete(deleteChatbot);

router.route('/:id/stats')
  .get(getChatbotStats);

router.route('/:id/embed')
  .get(getEmbedCode);

module.exports = router;
