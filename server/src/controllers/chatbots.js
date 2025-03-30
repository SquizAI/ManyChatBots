const Chatbot = require('../models/Chatbot');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all chatbots
// @route   GET /api/chatbots
// @access  Private
exports.getChatbots = asyncHandler(async (req, res, next) => {
  // For regular users, only return their own chatbots
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    res.advancedResults.data = res.advancedResults.data.filter(
      chatbot => chatbot.user.toString() === req.user.id
    );
    res.advancedResults.count = res.advancedResults.data.length;
  }
  
  res.status(200).json(res.advancedResults);
});

// @desc    Get single chatbot
// @route   GET /api/chatbots/:id
// @access  Private
exports.getChatbot = asyncHandler(async (req, res, next) => {
  const chatbot = await Chatbot.findById(req.params.id).populate({
    path: 'conversations',
    select: 'status messages createdAt lastMessageAt visitor.email'
  });

  if (!chatbot) {
    return next(new ErrorResponse(`Chatbot not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the chatbot or is admin
  if (chatbot.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this chatbot`, 403));
  }

  res.status(200).json({
    success: true,
    data: chatbot
  });
});

// @desc    Create new chatbot
// @route   POST /api/chatbots
// @access  Private
exports.createChatbot = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // Check for existing chatbots
  const userChatbots = await Chatbot.find({ user: req.user.id });

  // If the user is not an admin, check subscription limits
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    // Check if user subscription allows more chatbots
    const user = await User.findById(req.user.id);
    let chatbotLimit;

    switch (user.subscription) {
      case 'basic':
        chatbotLimit = 1;
        break;
      case 'professional':
        chatbotLimit = 3;
        break;
      case 'enterprise':
        chatbotLimit = 10;
        break;
      default:
        chatbotLimit = 0;
    }

    if (userChatbots.length >= chatbotLimit) {
      return next(
        new ErrorResponse(
          `User with ${user.subscription} subscription cannot create more than ${chatbotLimit} chatbots`,
          400
        )
      );
    }
  }

  const chatbot = await Chatbot.create(req.body);

  res.status(201).json({
    success: true,
    data: chatbot
  });
});

// @desc    Update chatbot
// @route   PUT /api/chatbots/:id
// @access  Private
exports.updateChatbot = asyncHandler(async (req, res, next) => {
  let chatbot = await Chatbot.findById(req.params.id);

  if (!chatbot) {
    return next(new ErrorResponse(`Chatbot not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the chatbot or is admin
  if (chatbot.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this chatbot`, 403));
  }

  // Update chatbot
  chatbot = await Chatbot.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: chatbot
  });
});

// @desc    Delete chatbot
// @route   DELETE /api/chatbots/:id
// @access  Private
exports.deleteChatbot = asyncHandler(async (req, res, next) => {
  const chatbot = await Chatbot.findById(req.params.id);

  if (!chatbot) {
    return next(new ErrorResponse(`Chatbot not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the chatbot or is admin
  if (chatbot.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this chatbot`, 403));
  }

  // Delete all associated conversations
  await Conversation.deleteMany({ chatbot: req.params.id });

  await chatbot.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get chatbot stats
// @route   GET /api/chatbots/:id/stats
// @access  Private
exports.getChatbotStats = asyncHandler(async (req, res, next) => {
  const chatbot = await Chatbot.findById(req.params.id);

  if (!chatbot) {
    return next(new ErrorResponse(`Chatbot not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the chatbot or is admin
  if (chatbot.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this chatbot`, 403));
  }

  // Get conversation statistics
  const totalConversations = await Conversation.countDocuments({ chatbot: req.params.id });
  const activeConversations = await Conversation.countDocuments({ 
    chatbot: req.params.id,
    status: 'active'
  });
  
  // Calculate engagement and lead capture metrics
  const conversationsWithLeads = await Conversation.countDocuments({
    chatbot: req.params.id,
    'visitor.email': { $exists: true, $ne: '' }
  });
  
  const leadCaptureRate = totalConversations > 0 
    ? (conversationsWithLeads / totalConversations) * 100 
    : 0;
  
  // Get message counts
  const messageStats = await Conversation.aggregate([
    { $match: { chatbot: chatbot._id } },
    { $unwind: '$messages' },
    { $group: {
        _id: '$messages.sender',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Format message stats
  const messageCountByType = {};
  messageStats.forEach(stat => {
    messageCountByType[stat._id] = stat.count;
  });
  
  // Get traffic sources
  const trafficSources = await Conversation.aggregate([
    { $match: { chatbot: chatbot._id } },
    { $group: {
        _id: '$source',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Format traffic sources
  const formattedTrafficSources = {};
  trafficSources.forEach(source => {
    formattedTrafficSources[source._id] = source.count;
  });

  res.status(200).json({
    success: true,
    data: {
      totalConversations,
      activeConversations,
      leadCaptureRate,
      messageCountByType,
      trafficSources: formattedTrafficSources,
      // Update the chatbot stats
      stats: chatbot.stats
    }
  });
});

// @desc    Generate embed code for chatbot
// @route   GET /api/chatbots/:id/embed
// @access  Private
exports.getEmbedCode = asyncHandler(async (req, res, next) => {
  const chatbot = await Chatbot.findById(req.params.id);

  if (!chatbot) {
    return next(new ErrorResponse(`Chatbot not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the chatbot or is admin
  if (chatbot.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this chatbot`, 403));
  }

  // Generate embed code
  const embedCode = `
<!-- ManyChatBot Widget -->
<script type="text/javascript">
  (function(m,a,n,y,c,h,a,t){
    m['ManyChatBotObject']=y;
    m[y]=m[y]||function(){(m[y].q=m[y].q||[]).push(arguments)};
    h=a.createElement('script');
    h.async=1;
    h.src=c;
    t=a.getElementsByTagName('script')[0];
    t.parentNode.insertBefore(h,t);
  })(window,document,'//static.manychatbot.com/js/widget.js','mcb');
  mcb('init', { botId: '${chatbot._id}' });
</script>
<!-- End ManyChatBot Widget -->
  `;

  res.status(200).json({
    success: true,
    data: {
      embedCode
    }
  });
});
