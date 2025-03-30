/**
 * AI Controller
 * Handles AI-powered functionality through the unified AI client
 */

const unifiedAI = require('../integrations/AI/UnifiedAIClient');
const { asyncHandler } = require('../utils/errorHandler');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');

/**
 * @desc    Analyze sentiment of text
 * @route   POST /api/ai/analyze-sentiment
 * @access  Private
 */
exports.analyzeSentiment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({
      success: false,
      error: 'Please provide text to analyze'
    });
  }
  
  const result = await unifiedAI.analyzeSentiment(text);
  
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta
  });
});

/**
 * @desc    Extract entities from text
 * @route   POST /api/ai/extract-entities
 * @access  Private
 */
exports.extractEntities = asyncHandler(async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({
      success: false,
      error: 'Please provide text to analyze'
    });
  }
  
  const schema = {
    type: "object",
    properties: {
      entities: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: { type: "string" },
            relevance: { type: "number" }
          },
          required: ["name", "type", "relevance"]
        }
      }
    },
    required: ["entities"]
  };
  
  const result = await unifiedAI.extractInformation(text, schema);
  
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta
  });
});

/**
 * @desc    Answer a question using AI
 * @route   POST /api/ai/answer-question
 * @access  Private
 */
exports.answerQuestion = asyncHandler(async (req, res) => {
  const { question, context } = req.body;
  
  if (!question) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a question'
    });
  }
  
  const messages = [
    { role: 'system', content: 'You are a helpful AI assistant for the ManyChatBot platform.' }
  ];
  
  // Add context if provided
  if (context) {
    messages.push({ role: 'system', content: `Context: ${context}` });
  }
  
  messages.push({ role: 'user', content: question });
  
  const result = await unifiedAI.generateChatCompletion(messages);
  
  res.status(200).json({
    success: true,
    data: {
      answer: result.content
    },
    meta: result.meta
  });
});

/**
 * @desc    Generate a structured response
 * @route   POST /api/ai/generate-structured-response
 * @access  Private
 */
exports.generateStructuredResponse = asyncHandler(async (req, res) => {
  const { prompt, schema, options } = req.body;
  
  if (!prompt || !schema) {
    return res.status(400).json({
      success: false,
      error: 'Please provide both prompt and schema'
    });
  }
  
  const result = await unifiedAI.generateStructuredOutput(prompt, schema, options);
  
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta
  });
});

/**
 * @desc    Generate a message for a chatbot
 * @route   POST /api/ai/generate-message
 * @access  Private
 */
exports.generateMessage = asyncHandler(async (req, res) => {
  const { userMessage, conversationHistory, botPersonality, knowledgeBase } = req.body;
  
  if (!userMessage) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a user message'
    });
  }
  
  // Construct prompt with conversation history and personality
  let systemPrompt = 'You are a helpful AI assistant for the ManyChatBot platform.';
  
  if (botPersonality) {
    systemPrompt += ` Your personality is: ${botPersonality}`;
  }
  
  const messages = [
    { role: 'system', content: systemPrompt }
  ];
  
  // Add knowledge base info if available
  if (knowledgeBase && knowledgeBase.length > 0) {
    const knowledgeBaseText = knowledgeBase.join('\n\n');
    messages.push({
      role: 'system',
      content: `Here is some relevant information that you can use to answer the user's question:\n${knowledgeBaseText}`
    });
  }
  
  // Add conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    messages.push(...conversationHistory);
  }
  
  // Add current user message
  messages.push({ role: 'user', content: userMessage });
  
  const result = await unifiedAI.generateChatCompletion(messages);
  
  res.status(200).json({
    success: true,
    data: {
      message: result.content
    },
    meta: result.meta
  });
});

/**
 * @desc    Improve text (grammar, clarity, etc.)
 * @route   POST /api/ai/improve-text
 * @access  Private
 */
exports.improveText = asyncHandler(async (req, res) => {
  const { text, improvements } = req.body;
  
  if (!text) {
    return res.status(400).json({
      success: false,
      error: 'Please provide text to improve'
    });
  }
  
  // Default improvements if not specified
  const improvementTypes = improvements || ['grammar', 'clarity', 'conciseness'];
  
  const prompt = `Improve the following text focusing on ${improvementTypes.join(', ')}:\n\n${text}`;
  
  const schema = {
    type: "object",
    properties: {
      improved_text: {
        type: "string",
        description: "The improved version of the original text"
      },
      changes_made: {
        type: "array",
        items: {
          type: "string",
          description: "Description of a change that was made"
        }
      }
    },
    required: ["improved_text", "changes_made"]
  };
  
  const result = await unifiedAI.generateStructuredOutput(prompt, schema);
  
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta
  });
});

/**
 * @desc    Summarize text
 * @route   POST /api/ai/summarize
 * @access  Private
 */
exports.summarizeText = asyncHandler(async (req, res) => {
  const { text, length } = req.body;
  
  if (!text) {
    return res.status(400).json({
      success: false,
      error: 'Please provide text to summarize'
    });
  }
  
  // Length can be short, medium, or long
  const summaryLength = length || 'medium';
  
  const prompt = `Please summarize the following text. Create a ${summaryLength} summary:\n\n${text}`;
  
  const schema = {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "Summary of the original text"
      },
      key_points: {
        type: "array",
        items: {
          type: "string",
          description: "A key point from the text"
        }
      }
    },
    required: ["summary", "key_points"]
  };
  
  const result = await unifiedAI.generateStructuredOutput(prompt, schema);
  
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta
  });
});
