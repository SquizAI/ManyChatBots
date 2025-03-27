/**
 * Speech-to-Text Component for ManyChatBot
 * 
 * Integrates with DeepGram's SDK to provide voice input capabilities
 * for the chat widget and other components.
 */

class SpeechToTextInput {
  constructor(options = {}) {
    this.options = {
      language: 'en-US',
      serverEndpoint: '/api/speech/process',
      liveEndpoint: '/api/speech/live-token',
      useWebsocket: true,
      microphoneButtonSelector: null,
      outputElementSelector: null,
      onTranscriptComplete: null,
      onTranscriptInterim: null,
      debug: false,
      ...options
    };

    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.deepgramSocket = null;
    this.connectionParams = null;

    // Initialize component
    this._init();
  }

  /**
   * Initialize the speech-to-text component
   * @private
   */
  _init() {
    // Check for browser compatibility
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('Speech-to-text input not supported in this browser');
      return;
    }

    // Set up microphone button if provided
    if (this.options.microphoneButtonSelector) {
      const micButton = document.querySelector(this.options.microphoneButtonSelector);
      if (micButton) {
        micButton.addEventListener('click', () => this.toggleRecording());
        // Add a data attribute to show it's ready
        micButton.setAttribute('data-speech-ready', 'true');
      }
    }

    this._log('Speech-to-text component initialized');
  }

  /**
   * Toggle recording state
   */
  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  /**
   * Start recording audio
   */
  async startRecording() {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.audioChunks = [];
      this.isRecording = true;
      
      // Update UI to show recording state
      this._updateRecordingState(true);

      // Handle live transcription via WebSocket if enabled
      if (this.options.useWebsocket) {
        await this._initializeDeepgramSocket();
        
        // Set up MediaRecorder for WebSocket streaming
        this.mediaRecorder = new MediaRecorder(stream);
        
        this.mediaRecorder.addEventListener('dataavailable', event => {
          if (event.data.size > 0 && this.deepgramSocket) {
            if (this.deepgramSocket.readyState === WebSocket.OPEN) {
              this.deepgramSocket.send(event.data);
            }
          }
        });
        
        this.mediaRecorder.addEventListener('stop', () => {
          // Close WebSocket connection when recording stops
          if (this.deepgramSocket) {
            this.deepgramSocket.close();
            this.deepgramSocket = null;
          }
          
          this.isRecording = false;
          this._updateRecordingState(false);
        });
        
        // Start recording with small time slices for real-time processing
        this.mediaRecorder.start(250);
      } else {
        // Standard recording for batch processing
        this.mediaRecorder = new MediaRecorder(stream);
        
        this.mediaRecorder.addEventListener('dataavailable', event => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        });
        
        this.mediaRecorder.addEventListener('stop', () => {
          this._processRecording();
          this.isRecording = false;
          this._updateRecordingState(false);
        });
        
        // Start recording
        this.mediaRecorder.start();
      }
      
      this._log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      this._updateRecordingState(false);
      
      // Show error to user
      if (this.options.outputElementSelector) {
        const outputElement = document.querySelector(this.options.outputElementSelector);
        if (outputElement) {
          outputElement.textContent = 'Error accessing microphone. Please check permissions.';
        }
      }
    }
  }

  /**
   * Stop recording audio
   */
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this._log('Recording stopped');
    }
  }

  /**
   * Process recorded audio and send to server
   * @private
   */
  async _processRecording() {
    if (this.audioChunks.length === 0) return;
    
    try {
      // Create audio blob from recorded chunks
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      // Create form data for API request
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      // Set transcription options
      const options = {
        language: this.options.language,
        smart_format: true,
        punctuate: true
      };
      formData.append('options', JSON.stringify(options));
      
      // Display loading indicator
      if (this.options.outputElementSelector) {
        const outputElement = document.querySelector(this.options.outputElementSelector);
        if (outputElement) {
          outputElement.textContent = 'Processing speech...';
        }
      }
      
      // Send to server endpoint
      const response = await fetch(this.options.serverEndpoint, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Display transcript
        if (this.options.outputElementSelector) {
          const outputElement = document.querySelector(this.options.outputElementSelector);
          if (outputElement) {
            outputElement.textContent = result.data.transcript;
          }
        }
        
        // Call completion callback if provided
        if (typeof this.options.onTranscriptComplete === 'function') {
          this.options.onTranscriptComplete(result.data.transcript, result.data);
        }
        
        this._log('Transcription completed:', result.data);
      } else {
        throw new Error(result.message || 'Failed to process speech');
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      
      // Show error to user
      if (this.options.outputElementSelector) {
        const outputElement = document.querySelector(this.options.outputElementSelector);
        if (outputElement) {
          outputElement.textContent = 'Error processing speech. Please try again.';
        }
      }
    }
  }

  /**
   * Initialize DeepGram WebSocket connection for live transcription
   * @private
   */
  async _initializeDeepgramSocket() {
    try {
      // Get token and connection params from server
      const response = await fetch(this.options.liveEndpoint);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to get transcription token');
      }
      
      // Store connection parameters
      this.connectionParams = result.data.connectionParams;
      
      // Create DeepGram WebSocket connection
      const apiKey = result.data.apiKey;
      const deepgramUrl = new URL('wss://api.deepgram.com/v1/listen');
      
      // Add params to URL
      deepgramUrl.searchParams.append('model', this.connectionParams.model);
      deepgramUrl.searchParams.append('language', this.connectionParams.language);
      deepgramUrl.searchParams.append('smart_format', this.connectionParams.smart_format);
      deepgramUrl.searchParams.append('punctuate', this.connectionParams.punctuate);
      deepgramUrl.searchParams.append('interim_results', 'true');
      
      // Create WebSocket with API key in header
      this.deepgramSocket = new WebSocket(deepgramUrl, ['token', apiKey]);
      
      // Set up WebSocket event handlers
      this.deepgramSocket.onopen = () => {
        this._log('DeepGram WebSocket connected');
      };
      
      this.deepgramSocket.onmessage = (event) => {
        try {
          const result = JSON.parse(event.data);
          
          if (result.channel && result.channel.alternatives && result.channel.alternatives.length > 0) {
            const transcript = result.channel.alternatives[0].transcript;
            
            if (transcript) {
              // Display interim results
              if (this.options.outputElementSelector) {
                const outputElement = document.querySelector(this.options.outputElementSelector);
                if (outputElement) {
                  outputElement.textContent = transcript;
                }
              }
              
              // Call interim callback if provided
              if (typeof this.options.onTranscriptInterim === 'function') {
                this.options.onTranscriptInterim(transcript, result);
              }
              
              this._log('Interim transcript:', transcript);
            }
            
            // Handle final results
            if (result.is_final) {
              if (typeof this.options.onTranscriptComplete === 'function') {
                this.options.onTranscriptComplete(transcript, result);
              }
              
              this._log('Final transcript:', transcript);
            }
          }
        } catch (error) {
          console.error('Error processing transcription result:', error);
        }
      };
      
      this.deepgramSocket.onerror = (error) => {
        console.error('DeepGram WebSocket error:', error);
      };
      
      this.deepgramSocket.onclose = () => {
        this._log('DeepGram WebSocket closed');
      };
    } catch (error) {
      console.error('Error initializing DeepGram socket:', error);
      throw error;
    }
  }

  /**
   * Update UI elements to reflect recording state
   * @param {boolean} isRecording - Whether recording is active
   * @private
   */
  _updateRecordingState(isRecording) {
    if (this.options.microphoneButtonSelector) {
      const micButton = document.querySelector(this.options.microphoneButtonSelector);
      if (micButton) {
        if (isRecording) {
          micButton.classList.add('recording');
          micButton.setAttribute('data-recording', 'true');
        } else {
          micButton.classList.remove('recording');
          micButton.setAttribute('data-recording', 'false');
        }
      }
    }
  }

  /**
   * Log debug messages if debug mode is enabled
   * @private
   */
  _log(...args) {
    if (this.options.debug) {
      console.log('[SpeechToText]', ...args);
    }
  }
}

// Make available globally
window.SpeechToTextInput = SpeechToTextInput;
