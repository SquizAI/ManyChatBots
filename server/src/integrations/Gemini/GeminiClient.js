/**
 * Google Gemini API Client for ManyChatBot
 * Implements structured output with response schema
 * 
 * Updated to use latest Gemini API formats for structured outputs from official Google documentation
 * Supported models for structured outputs (as of 2025):
 * - gemini-2.5-pro-exp-03-25 (State-of-the-art thinking model)
 * - gemini-2.0-flash-001 (Latest stable version)
 * - gemini-2.0-flash-lite-001 (Cost-efficient version)
 * - gemini-1.5-pro-002 (Previous generation)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../../utils/logger');

class GeminiClient {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Latest model that supports structured outputs
    // Default to the latest stable model for general use
    this.defaultModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001';
    
    // Advanced thinking model for complex reasoning tasks (optional)
    this.thinkingModel = process.env.GEMINI_THINKING_MODEL || 'gemini-2.5-pro-exp-03-25';
    
    // Cost-efficient model for simpler tasks (optional)
    this.liteModel = process.env.GEMINI_LITE_MODEL || 'gemini-2.0-flash-lite-001';
    
    this.defaultMaxOutputTokens = parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '8192');
    this.defaultTemperature = parseFloat(process.env.GEMINI_TEMPERATURE || '0.7');
  }

  /**
   * Get a model instance for the specified model
   * 
   * @param {string} modelName - Name of the Gemini model to use
   * @returns {Model} Gemini model instance
   * @private
   */
  _getModel(modelName) {
    return this.genAI.getGenerativeModel({ model: modelName });
  }

  /**
   * Generate a structured response according to the provided JSON schema
   * 
   * @param {string} prompt - The user's message/prompt
   * @param {object} schema - Response schema defining the structure
   * @param {object} options - Additional options
   * @returns {Promise<object>} Structured response object conforming to schema
   */
  async generateStructuredOutput(prompt, schema, options = {}) {
    try {
      const modelName = options.model || this.defaultModel;
      const maxOutputTokens = options.maxOutputTokens || this.defaultMaxOutputTokens;
      const temperature = options.temperature || this.defaultTemperature;
      const systemPrompt = options.systemPrompt || 'You are an AI assistant that helps with ManyChatBot integrations.';
      
      const model = this._getModel(modelName);
      
      // Create generative config with schema for structured output
      // Updated to use latest Gemini API parameters for structured outputs
      const generationConfig = {
        temperature,
        maxOutputTokens,
        responseMimeType: 'application/json',
        responseSchema: schema,
        candidateCount: 1,
        stopSequences: options.stopSequences || [],
      };
      
      // Add safety settings if provided
      if (options.safetySettings) {
        generationConfig.safetySettings = options.safetySettings;
      }
      
      // Properly format system and user messages
      const contents = [];
      
      // Add system message if provided
      if (systemPrompt) {
        contents.push({ role: 'system', parts: [{ text: systemPrompt }] });
      }
      
      // Add current user prompt
      contents.push({ role: 'user', parts: [{ text: prompt }] });
      
      const result = await model.generateContent({
        contents,
        generationConfig
      });

      const response = result.response;
      
      // Check for safety issues or content blocking
      if (response.promptFeedback && response.promptFeedback.blockReason) {
        throw new Error(`Content was blocked due to: ${response.promptFeedback.blockReason}`);
      }
      
      // Attempt to parse the JSON response
      try {
        const responseJson = JSON.parse(response.text());
        
        return {
          data: responseJson,
          meta: {
            model: modelName,
            finishReason: response.promptFeedback?.blockReason || 'STOP',
            usageMetadata: response.usageMetadata,
            modelVersion: response.modelId || modelName
          }
        };
      } catch (parseError) {
        logger.error('Failed to parse JSON response from Gemini:', { 
          error: parseError.message, 
          response: response.text().substring(0, 200) 
        });
        throw new Error(`Failed to parse Gemini response as JSON: ${parseError.message}`);
      }
    } catch (error) {
      logger.error('Gemini API error:', { error: error.message, stack: error.stack });
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  /**
   * Generate a chat completion with the Gemini API
   * 
   * @param {array} messages - Array of message objects with role and parts
   * @param {object} options - Additional options for the API call
   * @returns {Promise<object>} Response from Gemini
   */
  async generateChatCompletion(messages, options = {}) {
    try {
      const modelName = options.model || this.defaultModel;
      const maxOutputTokens = options.maxOutputTokens || this.defaultMaxOutputTokens;
      const temperature = options.temperature || this.defaultTemperature;
      
      const model = this._getModel(modelName);
      
      // Create chat session
      const chat = model.startChat({
        generationConfig: {
          temperature,
          maxOutputTokens,
        },
        history: messages.slice(0, -1) // Add all but the latest message to history
      });
      
      // Send the latest message
      const latestMessage = messages[messages.length - 1];
      const result = await chat.sendMessage(latestMessage.parts);
      
      const response = result.response;
      
      return {
        content: response.text(),
        meta: {
          model: modelName,
          finishReason: response.promptFeedback?.blockReason || 'STOP',
          usageMetadata: response.usageMetadata
        }
      };
    } catch (error) {
      logger.error('Gemini chat completion error:', { error: error.message, stack: error.stack });
      throw new Error(`Gemini chat completion error: ${error.message}`);
    }
  }

  /**
   * Analyze sentiment of a text using Gemini
   * 
   * @param {string} text - Text to analyze
   * @returns {Promise<object>} Sentiment analysis result
   */
  async analyzeSentiment(text) {
    const schema = {
      type: "object",
      properties: {
        sentiment: {
          type: "string",
          enum: ["positive", "negative", "neutral"]
        },
        score: {
          type: "number",
          description: "Sentiment score from -1 (negative) to 1 (positive)"
        },
        confidence: {
          type: "number",
          description: "Confidence score from 0 to 1"
        }
      },
      required: ["sentiment", "score", "confidence"]
    };
    
    const prompt = `Analyze the sentiment of the following text: "${text}"`;
    
    return this.generateStructuredOutput(prompt, schema, {
      systemPrompt: "You are a sentiment analysis tool that evaluates text sentiment."
    });
  }

  /**
   * Extract structured information from unstructured text
   * 
   * @param {string} text - Text to extract info from
   * @param {object} schema - Schema defining what to extract
   * @returns {Promise<object>} Extracted information
   */
  async extractInformation(text, schema) {
    const prompt = `Extract the requested information from the following text: "${text}"`;
    
    return this.generateStructuredOutput(prompt, schema, {
      systemPrompt: "You are a data extraction tool that pulls structured information from text."
    });
  }

  /**
   * Generate a multimodal response with text and image input
   * 
   * @param {string} text - Text prompt
   * @param {string} imageBase64 - Base64 encoded image
   * @param {object} options - Additional options
   * @returns {Promise<object>} Response from Gemini
   */
  async generateMultimodalResponse(text, imageBase64, options = {}) {
    try {
      // Use the latest vision-capable model
      const modelName = options.model || 'gemini-1.5-pro-vision';
      const maxOutputTokens = options.maxOutputTokens || this.defaultMaxOutputTokens;
      const temperature = options.temperature || this.defaultTemperature;
      const systemPrompt = options.systemPrompt || 'Analyze the following image.';
      
      const model = this._getModel(modelName);
      
      // Determine MIME type from options or default to jpeg
      const mimeType = options.mimeType || 'image/jpeg';
      
      // Format request with system message
      const contents = [];
      
      // Add system message if provided
      if (systemPrompt) {
        contents.push({ role: 'system', parts: [{ text: systemPrompt }] });
      }
      
      // Add user message with text and image
      contents.push({
        role: 'user',
        parts: [
          { text },
          { inlineData: { data: imageBase64, mimeType } }
        ]
      });
      
      const result = await model.generateContent({
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens,
          topP: options.topP || 0.95,
          topK: options.topK || 64,
        },
      });

      const response = result.response;
      
      return {
        content: response.text(),
        meta: {
          model: modelName,
          finishReason: response.promptFeedback?.blockReason || 'STOP',
          usageMetadata: response.usageMetadata
        }
      };
    } catch (error) {
      logger.error('Gemini multimodal error:', { error: error.message, stack: error.stack });
      throw new Error(`Gemini multimodal error: ${error.message}`);
    }
  }
}

module.exports = new GeminiClient();
