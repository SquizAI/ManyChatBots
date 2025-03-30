/**
 * OpenAI API Client for ManyChatBot
 * Implements structured output with JSON schema
 * 
 * Updated to use latest OpenAI API formats for structured outputs (2025)
 * 
 * Supported models for structured outputs with schema validation:
 * - gpt-4o-2024-08-06 (Best model for structured outputs - 100% accuracy)
 * - gpt-4o-mini (Efficient alternative)
 * 
 * Models that support structured outputs with function calling:
 * - All of the above
 * - gpt-4o
 * - gpt-4-turbo
 * - gpt-4
 * - gpt-3.5-turbo
 */

const { OpenAI } = require('openai');
const logger = require('../../utils/logger');

class OpenAIClient {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID || undefined,
    });
    
    // Latest model for structured outputs with schema (100% accuracy)
    this.defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-2024-08-06';
    
    // Efficient alternative for structured outputs
    this.miniModel = process.env.OPENAI_MINI_MODEL || 'gpt-4o-mini';
    
    // Standard model for general tasks
    this.standardModel = process.env.OPENAI_STANDARD_MODEL || 'gpt-4o';
    
    this.defaultMaxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '4096');
    this.defaultTemperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.7');
  }

  /**
   * Generate a structured response according to the provided JSON schema
   * 
   * @param {string} prompt - The user's message/prompt
   * @param {object} schema - JSON schema defining the response structure
   * @param {object} options - Additional options
   * @returns {Promise<object>} Structured response object conforming to schema
   */
  async generateStructuredOutput(prompt, schema, options = {}) {
    try {
      const model = options.model || this.defaultModel;
      const maxTokens = options.maxTokens || this.defaultMaxTokens;
      const temperature = options.temperature || this.defaultTemperature;
      const systemPrompt = options.systemPrompt || 'You are an AI assistant that helps with ManyChatBot integrations.';
      
      // Using the latest structured output format
      const response = await this.client.chat.completions.create({
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object", schema: schema },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        seed: options.seed || 42, // Optional deterministic results
        tools: options.tools || [] // Optional tools configuration
      });
      
      // Handle the response - OpenAI already validates against the schema
      // Parse the JSON response
      const responseContent = response.choices[0].message.content;
      
      // Check if the model refused to generate according to schema
      if (response.choices[0].finish_reason === 'content_filter') {
        throw new Error('Content was filtered due to safety concerns');
      }
      
      // If the response has a refusal message
      if (response.choices[0].message.tool_calls) {
        const refusalToolCall = response.choices[0].message.tool_calls.find(
          call => call.function.name === 'refusal'
        );
        
        if (refusalToolCall) {
          throw new Error(`Model refused to generate: ${JSON.parse(refusalToolCall.function.arguments).error}`);
        }
      }
      
      // Parse the content as JSON
      const parsedResponse = JSON.parse(responseContent);
      
      return {
        data: parsedResponse,
        meta: {
          usage: response.usage,
          model: response.model,
          finishReason: response.choices[0].finish_reason,
          system_fingerprint: response.system_fingerprint
        }
      };
    } catch (error) {
      logger.error('OpenAI API error:', { error: error.message, stack: error.stack });
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Generate a chat completion with the OpenAI API
   * 
   * @param {array} messages - Array of message objects with role and content
   * @param {object} options - Additional options for the API call
   * @returns {Promise<object>} Response from OpenAI
   */
  async generateChatCompletion(messages, options = {}) {
    try {
      const model = options.model || this.defaultModel;
      const maxTokens = options.maxTokens || this.defaultMaxTokens;
      const temperature = options.temperature || this.defaultTemperature;
      
      const response = await this.client.chat.completions.create({
        model,
        temperature,
        max_tokens: maxTokens,
        messages
      });
      
      return {
        content: response.choices[0].message.content,
        meta: {
          usage: response.usage,
          model: response.model,
          finishReason: response.choices[0].finish_reason
        }
      };
    } catch (error) {
      logger.error('OpenAI chat completion error:', { error: error.message, stack: error.stack });
      throw new Error(`OpenAI chat completion error: ${error.message}`);
    }
  }

  /**
   * Analyze sentiment of a text using OpenAI
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
   * @param {object} schema - JSON schema defining what to extract
   * @returns {Promise<object>} Extracted information
   */
  async extractInformation(text, schema) {
    const prompt = `Extract the requested information from the following text: "${text}"`;
    
    return this.generateStructuredOutput(prompt, schema, {
      systemPrompt: "You are a data extraction tool that pulls structured information from text."
    });
  }
}

module.exports = new OpenAIClient();
