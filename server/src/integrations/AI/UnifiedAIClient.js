/**
 * UnifiedAIClient.js
 * 
 * A unified client that can switch between OpenAI and Gemini APIs
 * based on configuration and availability.
 */

const logger = require('../../utils/logger');
const openai = require('../OpenAI/OpenAIClient');
const gemini = require('../Gemini/GeminiClient');

class UnifiedAIClient {
  constructor() {
    this.useOpenAI = process.env.USE_OPENAI === 'true';
    this.useGemini = process.env.USE_GEMINI === 'true';
    
    // Set default provider
    this.defaultProvider = this.useOpenAI ? 'openai' : (this.useGemini ? 'gemini' : 'openai');
    
    if (!this.useOpenAI && !this.useGemini) {
      logger.warn('Neither OpenAI nor Gemini API is enabled. Defaulting to OpenAI.');
      this.useOpenAI = true;
    }
    
    // Task complexity thresholds for model selection
    this.complexityThresholds = {
      low: 0.3,   // Simple tasks (use lite/mini models)
      medium: 0.7, // Moderate complexity (use standard models)
      high: 0.9    // Complex reasoning tasks (use advanced models)
    };
  }

  /**
   * Get the appropriate client based on provider
   * 
   * @param {string} provider - The AI provider to use ('openai' or 'gemini')
   * @returns {Object} The client instance
   * @private
   */
  _getClient(provider) {
    provider = provider || this.defaultProvider;
    
    switch (provider.toLowerCase()) {
      case 'openai':
        if (!this.useOpenAI) {
          throw new Error('OpenAI API is disabled in configuration');
        }
        return openai;
      case 'gemini':
        if (!this.useGemini) {
          throw new Error('Gemini API is disabled in configuration');
        }
        return gemini;
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  }
  
  /**
   * Determine the best model to use based on task complexity and provider
   * 
   * @param {string} provider - The AI provider ('openai' or 'gemini')
   * @param {number} complexity - Task complexity score (0-1)
   * @param {object} options - Additional options for model selection
   * @returns {string} The model name to use
   * @private
   */
  _selectModel(provider, complexity = 0.5, options = {}) {
    provider = provider || this.defaultProvider;
    const client = this._getClient(provider);
    
    // If a specific model is requested in options, use that
    if (options.model) {
      return options.model;
    }
    
    if (provider === 'openai') {
      // OpenAI model selection based on complexity
      if (complexity >= this.complexityThresholds.high) {
        // Complex reasoning tasks (structured outputs with perfect accuracy)
        return client.defaultModel; // gpt-4o-2024-08-06
      } else if (complexity >= this.complexityThresholds.medium) {
        // Medium complexity tasks (good balance of capabilities)
        return client.standardModel; // gpt-4o
      } else {
        // Simple tasks (cost-efficient)
        return client.miniModel; // gpt-4o-mini
      }
    } else if (provider === 'gemini') {
      // Gemini model selection based on complexity
      if (complexity >= this.complexityThresholds.high) {
        // Complex reasoning tasks (thinking model)
        return client.thinkingModel; // gemini-2.5-pro-exp-03-25
      } else if (complexity >= this.complexityThresholds.medium) {
        // Medium complexity tasks (good balance)
        return client.defaultModel; // gemini-2.0-flash-001
      } else {
        // Simple tasks (cost-efficient)
        return client.liteModel; // gemini-2.0-flash-lite-001
      }
    }
    
    // Fallback to default model if provider is not recognized
    return 'gpt-4o';
  }
  
  /**
   * Estimate the complexity of a task based on schema and prompt
   * 
   * @param {object} schema - JSON schema for structured output
   * @param {string} prompt - User prompt
   * @returns {number} Complexity score between 0 and 1
   * @private
   */
  _estimateTaskComplexity(schema, prompt) {
    // Start with a base complexity
    let complexity = 0.5;
    
    // Analyze schema complexity
    if (schema) {
      // Count required properties and nested objects to gauge complexity
      const requiredCount = schema.required ? schema.required.length : 0;
      const propertyCount = schema.properties ? Object.keys(schema.properties).length : 0;
      
      // Calculate schema depth (nested objects increase complexity)
      const schemaDepth = this._calculateSchemaDepth(schema);
      
      // Calculate schema complexity (0-1)
      const schemaComplexity = Math.min(
        1.0, 
        ((requiredCount * 0.05) + (propertyCount * 0.03) + (schemaDepth * 0.1))
      );
      
      // Factor schema complexity into overall complexity (60% weight)
      complexity = (complexity * 0.4) + (schemaComplexity * 0.6);
    }
    
    // Analyze prompt complexity if available
    if (prompt) {
      // Token count approximation (longer prompts tend to be more complex)
      const wordCount = prompt.split(/\s+/).length;
      const promptLength = Math.min(1.0, wordCount / 500); // Normalize to 0-1
      
      // Check for complex reasoning markers in the prompt
      const complexityMarkers = [
        'analyze', 'reasoning', 'complex', 'compare', 'evaluate',
        'synthesize', 'recommendation', 'explanation', 'detailed',
        'comprehensive', 'in-depth', 'multiple', 'relationship'
      ];
      
      // Count complexity markers
      const promptText = prompt.toLowerCase();
      const markerCount = complexityMarkers.filter(marker => 
        promptText.includes(marker)
      ).length;
      
      // Calculate prompt complexity based on length and markers
      const promptComplexity = Math.min(
        1.0,
        (promptLength * 0.4) + (markerCount * 0.06)
      );
      
      // Factor prompt complexity into overall complexity (40% weight)
      complexity = (complexity * 0.6) + (promptComplexity * 0.4);
    }
    
    return Math.max(0, Math.min(1, complexity));
  }
  
  /**
   * Calculate the depth of a JSON schema (measure of nesting)
   * 
   * @param {object} schema - JSON schema object
   * @param {number} currentDepth - Current depth in recursion
   * @returns {number} Maximum depth of schema
   * @private
   */
  _calculateSchemaDepth(schema, currentDepth = 0) {
    if (!schema || typeof schema !== 'object') {
      return currentDepth;
    }
    
    let maxDepth = currentDepth;
    
    // Check properties for nested objects
    if (schema.properties) {
      for (const key in schema.properties) {
        const property = schema.properties[key];
        
        if (property.type === 'object') {
          // Recursive call for nested objects
          const depth = this._calculateSchemaDepth(property, currentDepth + 1);
          maxDepth = Math.max(maxDepth, depth);
        } else if (property.type === 'array' && property.items) {
          // Check array items for objects
          if (property.items.type === 'object') {
            const depth = this._calculateSchemaDepth(property.items, currentDepth + 1);
            maxDepth = Math.max(maxDepth, depth);
          }
        }
      }
    }
    
    // Check for arrays with object items
    if (schema.type === 'array' && schema.items && schema.items.type === 'object') {
      const depth = this._calculateSchemaDepth(schema.items, currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
    
    return maxDepth;
  }

  /**
   * Generate a structured response according to the provided schema
   * 
   * @param {string} prompt - The user's message/prompt
   * @param {object} schema - Schema defining the response structure
   * @param {object} options - Additional options
   * @param {string} options.provider - The AI provider to use ('openai' or 'gemini')
   * @param {number} options.complexity - Task complexity score (0-1) for model selection
   * @returns {Promise<object>} Structured response object conforming to schema
   */
  async generateStructuredOutput(prompt, schema, options = {}) {
    try {
      const provider = options.provider || this.defaultProvider;
      const client = this._getClient(provider);
      
      // Analyze schema complexity if not explicitly provided
      const complexity = options.complexity || this._estimateTaskComplexity(schema, prompt);
      
      // Select appropriate model based on task complexity
      const model = this._selectModel(provider, complexity, options);
      
      // Add the selected model to options
      const updatedOptions = { ...options, model };
      
      logger.info(`Using ${model} for structured output generation (complexity: ${complexity.toFixed(2)})`);
      
      return await client.generateStructuredOutput(prompt, schema, updatedOptions);
    } catch (error) {
      // If primary provider fails, try fallback if available
      if (error.message.includes('API is disabled') || error.message.includes('API error')) {
        if (this.useOpenAI && provider !== 'openai') {
          logger.info(`Falling back to OpenAI API from ${provider}`);
          // Estimate complexity for the fallback provider
          const complexity = options.complexity || this._estimateTaskComplexity(schema, prompt);
          const model = this._selectModel('openai', complexity, options);
          return await openai.generateStructuredOutput(prompt, schema, { ...options, model });
        } else if (this.useGemini && provider !== 'gemini') {
          logger.info(`Falling back to Gemini API from ${provider}`);
          // Estimate complexity for the fallback provider
          const complexity = options.complexity || this._estimateTaskComplexity(schema, prompt);
          const model = this._selectModel('gemini', complexity, options);
          return await gemini.generateStructuredOutput(prompt, schema, { ...options, model });
        }
      }
      
      // If no fallback is available or fallback also failed
      logger.error('AI structured output error:', { error: error.message, stack: error.stack });
      throw new Error(`AI structured output error: ${error.message}`);
    }
  }

  /**
   * Generate a chat completion
   * 
   * @param {array} messages - Array of message objects
   * @param {object} options - Additional options for the API call
   * @returns {Promise<object>} Response from the AI provider
   */
  async generateChatCompletion(messages, options = {}) {
    try {
      const provider = options.provider || this.defaultProvider;
      const client = this._getClient(provider);
      
      return await client.generateChatCompletion(messages, options);
    } catch (error) {
      // If primary provider fails, try fallback if available
      if (error.message.includes('API is disabled') || error.message.includes('API error')) {
        if (this.useOpenAI && provider !== 'openai') {
          logger.info(`Falling back to OpenAI API from ${provider}`);
          return await openai.generateChatCompletion(messages, options);
        } else if (this.useGemini && provider !== 'gemini') {
          logger.info(`Falling back to Gemini API from ${provider}`);
          return await gemini.generateChatCompletion(messages, options);
        }
      }
      
      // If no fallback is available or fallback also failed
      logger.error('AI chat completion error:', { error: error.message, stack: error.stack });
      throw new Error(`AI chat completion error: ${error.message}`);
    }
  }

  /**
   * Analyze sentiment of a text
   * 
   * @param {string} text - Text to analyze
   * @param {object} options - Additional options
   * @returns {Promise<object>} Sentiment analysis result
   */
  async analyzeSentiment(text, options = {}) {
    try {
      const provider = options.provider || this.defaultProvider;
      const client = this._getClient(provider);
      
      return await client.analyzeSentiment(text, options);
    } catch (error) {
      // If primary provider fails, try fallback if available
      if (error.message.includes('API is disabled') || error.message.includes('API error')) {
        if (this.useOpenAI && provider !== 'openai') {
          logger.info(`Falling back to OpenAI API from ${provider}`);
          return await openai.analyzeSentiment(text, options);
        } else if (this.useGemini && provider !== 'gemini') {
          logger.info(`Falling back to Gemini API from ${provider}`);
          return await gemini.analyzeSentiment(text, options);
        }
      }
      
      // If no fallback is available or fallback also failed
      logger.error('AI sentiment analysis error:', { error: error.message, stack: error.stack });
      throw new Error(`AI sentiment analysis error: ${error.message}`);
    }
  }

  /**
   * Extract structured information from unstructured text
   * 
   * @param {string} text - Text to extract info from
   * @param {object} schema - Schema defining what to extract
   * @param {object} options - Additional options
   * @returns {Promise<object>} Extracted information
   */
  async extractInformation(text, schema, options = {}) {
    try {
      const provider = options.provider || this.defaultProvider;
      const client = this._getClient(provider);
      
      return await client.extractInformation(text, schema, options);
    } catch (error) {
      // If primary provider fails, try fallback if available
      if (error.message.includes('API is disabled') || error.message.includes('API error')) {
        if (this.useOpenAI && provider !== 'openai') {
          logger.info(`Falling back to OpenAI API from ${provider}`);
          return await openai.extractInformation(text, schema, options);
        } else if (this.useGemini && provider !== 'gemini') {
          logger.info(`Falling back to Gemini API from ${provider}`);
          return await gemini.extractInformation(text, schema, options);
        }
      }
      
      // If no fallback is available or fallback also failed
      logger.error('AI information extraction error:', { error: error.message, stack: error.stack });
      throw new Error(`AI information extraction error: ${error.message}`);
    }
  }

  /**
   * Handle multimodal content (text + image)
   * Currently only supported by Gemini
   * 
   * @param {string} text - Text prompt
   * @param {string} imageBase64 - Base64 encoded image
   * @param {object} options - Additional options
   * @returns {Promise<object>} Response
   */
  async handleMultimodal(text, imageBase64, options = {}) {
    // Only Gemini supports multimodal inputs in our implementation
    if (!this.useGemini) {
      throw new Error('Multimodal inputs require Gemini API to be enabled');
    }
    
    try {
      return await gemini.generateMultimodalResponse(text, imageBase64, options);
    } catch (error) {
      logger.error('AI multimodal error:', { error: error.message, stack: error.stack });
      throw new Error(`AI multimodal error: ${error.message}`);
    }
  }
}

module.exports = new UnifiedAIClient();
