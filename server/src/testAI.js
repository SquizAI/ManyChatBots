/**
 * Test script for AI integration
 * This will test both OpenAI and Gemini structured outputs
 */

// Load environment variables
require('dotenv').config();

// Import the OpenAI and Gemini clients
const openaiClient = require('./integrations/OpenAI/OpenAIClient');
const geminiClient = require('./integrations/Gemini/GeminiClient');
const unifiedClient = require('./integrations/AI/UnifiedAIClient');

// Simple schema for testing
const schema = {
  type: "object",
  properties: {
    company_name: { type: "string" },
    headquarters: { type: "string" },
    founding_year: { type: "integer" },
    founders: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["company_name", "headquarters", "founding_year", "founders"]
};

// Test prompt
const prompt = "Extract information about Apple Inc. from this text: Apple Inc. is an American multinational technology company headquartered in Cupertino, California. It was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne in 1976.";

console.log('Testing AI integrations...');
console.log('------------------------');

// Test function
async function testAI() {
  try {
    // Test OpenAI integration
    console.log('Testing OpenAI structured outputs:');
    try {
      const openaiResult = await openaiClient.generateStructuredOutput(prompt, schema);
      console.log('OpenAI Result:');
      console.log(JSON.stringify(openaiResult.data, null, 2));
      console.log('Model used:', openaiResult.meta.model);
      console.log('------------------------');
    } catch (err) {
      console.error('OpenAI test failed:', err.message);
    }

    // Test Gemini integration
    console.log('Testing Gemini structured outputs:');
    try {
      const geminiResult = await geminiClient.generateStructuredOutput(prompt, schema);
      console.log('Gemini Result:');
      console.log(JSON.stringify(geminiResult.data, null, 2));
      console.log('Model used:', geminiResult.meta.model);
      console.log('------------------------');
    } catch (err) {
      console.error('Gemini test failed:', err.message);
    }

    // Test Unified client with automatic model selection
    console.log('Testing Unified client with complexity analysis:');
    try {
      // Simple test to demonstrate provider selection and model complexity analysis
      const simplePrompt = "Summarize information about Apple Inc.";
      const simpleSchema = {
        type: "object",
        properties: {
          company_name: { type: "string" },
          description: { type: "string" },
          founded: { type: "string" }
        },
        required: ["company_name", "description"]
      };
      
      // Explicitly set provider to test both OpenAI and Gemini
      // Note: This will use the environment variables defined in .env
      console.log('Testing with explicit OpenAI provider:');
      try {
        const openaiOptions = { provider: 'openai' };
        const openaiResult = await unifiedClient.generateStructuredOutput(simplePrompt, simpleSchema, openaiOptions);
        console.log('OpenAI Provider Result:');
        console.log(JSON.stringify(openaiResult.data, null, 2));
        console.log('Model used:', openaiResult.meta.model);
      } catch (providerErr) {
        console.error('OpenAI provider test failed:', providerErr.message);
        
        // If OpenAI fails, check if the error is due to an invalid API key
        if (providerErr.message.includes('401') || providerErr.message.includes('API key')) {
          console.log('\nNote: The OpenAI API key appears to be invalid. The key format should be:');
          console.log('- Standard OpenAI keys start with "sk-" but do not contain "proj-"');
          console.log('- If you have a Project key, you may need to generate a different type of API key');
          console.log('- Check your API key at https://platform.openai.com/account/api-keys\n');
        }
      }
      
      console.log('------------------------');
      
      console.log('Testing with explicit Gemini provider:');
      try {
        const geminiOptions = { provider: 'gemini' };
        const geminiResult = await unifiedClient.generateStructuredOutput(simplePrompt, simpleSchema, geminiOptions);
        console.log('Gemini Provider Result:');
        console.log(JSON.stringify(geminiResult.data, null, 2));
        console.log('Model used:', geminiResult.meta.model);
      } catch (providerErr) {
        console.error('Gemini provider test failed:', providerErr.message);
        
        // If Gemini fails, check if the error is due to an expired API key
        if (providerErr.message.includes('expired') || providerErr.message.includes('API key')) {
          console.log('\nNote: The Gemini API key appears to be expired or invalid. Please:');
          console.log('- Get a new API key at https://ai.google.dev/');
          console.log('- API keys typically expire after some time');
          console.log('- Make sure you have enabled the Gemini API in your Google Cloud project\n');
        }
      }
      
      console.log('------------------------');
    } catch (err) {
      console.error('Unified client test failed:', err);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run tests
testAI();
