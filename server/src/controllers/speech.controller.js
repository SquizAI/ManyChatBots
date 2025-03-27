/**
 * Speech Controller
 * Handles speech-to-text conversion using DeepGram API
 */
const DeepGramClient = require('../integrations/DeepGram/DeepGramClient');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// Initialize DeepGram client
const deepgramClient = new DeepGramClient();

/**
 * Process audio file and convert to text
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.processAudio = async (req, res) => {
  try {
    if (!req.files || !req.files.audio) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an audio file'
      });
    }

    const audioFile = req.files.audio;
    const options = req.body.options ? JSON.parse(req.body.options) : {};
    
    // Get mimetype from file or fallback to default
    options.mimetype = audioFile.mimetype || 'audio/webm';
    
    // Process with DeepGram
    const result = await deepgramClient.transcribeFile(audioFile.data, options);
    
    return res.status(200).json({
      success: true,
      data: {
        transcript: result.results?.channels[0]?.alternatives[0]?.transcript || '',
        confidence: result.results?.channels[0]?.alternatives[0]?.confidence || 0,
        words: result.results?.channels[0]?.alternatives[0]?.words || [],
        utterances: result.results?.utterances || []
      }
    });
  } catch (error) {
    console.error('Speech processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process speech',
      error: error.message
    });
  }
};

/**
 * Get available DeepGram models
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getModels = async (req, res) => {
  try {
    const models = await deepgramClient.getAvailableModels();
    
    return res.status(200).json({
      success: true,
      data: models
    });
  } catch (error) {
    console.error('Get models error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get available models',
      error: error.message
    });
  }
};

/**
 * Prepare for live transcription by creating a client token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getLiveTranscriptionToken = async (req, res) => {
  try {
    // Create a temporary API client with project ID
    const projectId = process.env.DEEPGRAM_PROJECT_ID;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'DeepGram project ID not configured'
      });
    }
    
    // Generate client-side connection parameters
    const connectionParams = {
      projectId,
      model: process.env.DEEPGRAM_MODEL || 'nova-2',
      language: process.env.DEEPGRAM_LANGUAGE || 'en-US',
      smart_format: process.env.DEEPGRAM_SMART_FORMAT === 'true',
      punctuate: process.env.DEEPGRAM_PUNCTUATE === 'true',
      diarize: process.env.DEEPGRAM_DIARIZE === 'true',
    };
    
    return res.status(200).json({
      success: true,
      data: {
        apiKey: process.env.DEEPGRAM_API_KEY,
        connectionParams
      }
    });
  } catch (error) {
    console.error('Live transcription setup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to set up live transcription',
      error: error.message
    });
  }
};
