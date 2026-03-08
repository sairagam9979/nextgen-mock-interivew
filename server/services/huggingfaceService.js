const axios = require('axios');

class HuggingFaceService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    
    if (!this.apiKey) {
      console.warn('Hugging Face API key not found. Some features may not work.');
    }
  }

  // Chat/Text Generation
  async generateChatResponse(messages, model = 'microsoft/DialoGPT-medium') {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${model}`,
        {
          inputs: this.formatMessagesForDialoGPT(messages),
          parameters: {
            max_length: 150,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        response: response.data[0].generated_text,
        model: model
      };
    } catch (error) {
      console.error('Hugging Face chat error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Speech-to-Text
  async transcribeAudio(audioBuffer, model = 'openai/whisper-base') {
    try {
      const formData = new FormData();
      formData.append('file', audioBuffer, 'audio.wav');

      const response = await axios.post(
        `${this.baseUrl}/${model}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return {
        success: true,
        text: response.data.text,
        model: model
      };
    } catch (error) {
      console.error('Hugging Face transcription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Text-to-Speech
  async synthesizeSpeech(text, model = 'facebook/fastspeech2-en-ljspeech') {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${model}`,
        {
          inputs: text,
          parameters: {
            sampling_rate: 22050
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      return {
        success: true,
        audio: Buffer.from(response.data),
        format: 'wav',
        model: model
      };
    } catch (error) {
      console.error('Hugging Face TTS error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Format messages for DialoGPT
  formatMessagesForDialoGPT(messages) {
    // DialoGPT expects a simple string input
    // We'll take the last few messages and format them
    const recentMessages = messages.slice(-4); // Last 4 messages
    return recentMessages
      .map(msg => msg.content)
      .join(' ')
      .trim();
  }

  // Get available models
  async getAvailableModels() {
    const models = {
      chat: [
        'microsoft/DialoGPT-medium',
        'microsoft/DialoGPT-large',
        'gpt2',
        'EleutherAI/gpt-neo-125M'
      ],
      speechToText: [
        'openai/whisper-base',
        'openai/whisper-small',
        'facebook/wav2vec2-base-960h'
      ],
      textToSpeech: [
        'facebook/fastspeech2-en-ljspeech',
        'microsoft/speecht5_tts',
        'facebook/fastspeech2-ar'
      ]
    };

    return models;
  }

  // Check API status
  async checkAPIStatus() {
    try {
      const response = await axios.get(
        'https://api-inference.huggingface.co/status',
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        success: true,
        status: response.data,
        apiKey: !!this.apiKey
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        apiKey: !!this.apiKey
      };
    }
  }

  // Rate limiting info
  getRateLimitInfo() {
    return {
      requestsPerMonth: 30000,
      requestsPerMinute: 60,
      concurrentRequests: 5
    };
  }
}

module.exports = new HuggingFaceService(); 