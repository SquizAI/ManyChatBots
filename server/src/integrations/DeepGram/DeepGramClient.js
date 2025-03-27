/**
 * DeepGram API client for speech-to-text functionality
 * Using DeepGram SDK v3 for voice transcription
 */
const { Deepgram } = require('@deepgram/sdk');
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);

class DeepGramClient {
  constructor() {
    this.apiKey = process.env.DEEPGRAM_API_KEY;
    this.deepgram = new Deepgram(this.apiKey);
    
    // Default transcription options
    this.defaultOptions = {
      model: process.env.DEEPGRAM_MODEL || 'nova-2',
      language: process.env.DEEPGRAM_LANGUAGE || 'en-US',
      smart_format: process.env.DEEPGRAM_SMART_FORMAT === 'true',
      punctuate: process.env.DEEPGRAM_PUNCTUATE === 'true',
      diarize: process.env.DEEPGRAM_DIARIZE === 'true',
    };
  }

  /**
   * Transcribe audio file using DeepGram's API
   * @param {Buffer|String} audioFile - Buffer or path to audio file
   * @param {Object} options - Override default transcription options
   * @returns {Promise<Object>} - Transcription results
   */
  async transcribeFile(audioFile, options = {}) {
    try {
      let buffer;
      
      // Handle file path or buffer
      if (typeof audioFile === 'string') {
        buffer = await readFile(audioFile);
      } else if (Buffer.isBuffer(audioFile)) {
        buffer = audioFile;
      } else {
        throw new Error('Audio file must be a file path or Buffer');
      }

      // Merge default options with provided options
      const transcriptionOptions = {
        ...this.defaultOptions,
        ...options
      };

      // Send to DeepGram API
      const response = await this.deepgram.transcription.preRecorded({
        buffer,
        mimetype: options.mimetype || 'audio/webm',
      }, transcriptionOptions);

      return response;
    } catch (error) {
      console.error('DeepGram transcription error:', error);
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }

  /**
   * Create a WebSocket connection for real-time transcription
   * @param {Object} options - Override default transcription options
   * @returns {Promise<Object>} - WebSocket connection and methods
   */
  createLiveTranscription(options = {}) {
    try {
      // Merge default options with provided options
      const transcriptionOptions = {
        ...this.defaultOptions,
        ...options,
        interim_results: true
      };

      // Create WebSocket connection
      const connection = this.deepgram.transcription.live(transcriptionOptions);
      
      return connection;
    } catch (error) {
      console.error('DeepGram live transcription error:', error);
      throw new Error(`Failed to create live transcription: ${error.message}`);
    }
  }

  /**
   * Get available models from DeepGram API
   * @returns {Promise<Array>} - Available models
   */
  async getAvailableModels() {
    try {
      // Get project info including available models
      const project = await this.deepgram.projects.get(process.env.DEEPGRAM_PROJECT_ID);
      
      return project.models || [];
    } catch (error) {
      console.error('Failed to get DeepGram models:', error);
      return [];
    }
  }
}

module.exports = DeepGramClient;
