const AI_PROVIDERS = {
  // OpenAI (Paid)
  openai: {
    name: 'OpenAI',
    type: 'paid',
    chat: {
      url: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    },
    speechToText: {
      url: 'https://api.openai.com/v1/audio/transcriptions',
      model: 'whisper-1'
    },
    textToSpeech: {
      url: 'https://api.openai.com/v1/audio/speech',
      model: 'tts-1'
    }
  },

  // Hugging Face (Free)
  huggingface: {
    name: 'Hugging Face',
    type: 'free',
    chat: {
      url: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    },
    speechToText: {
      url: 'https://api-inference.huggingface.co/models/openai/whisper-base',
      model: 'whisper-base'
    },
    textToSpeech: {
      url: 'https://api-inference.huggingface.co/models/facebook/fastspeech2-en-ljspeech',
      model: 'fastspeech2-en'
    }
  },

  // Cohere (Free Tier)
  cohere: {
    name: 'Cohere',
    type: 'free-tier',
    chat: {
      url: 'https://api.cohere.ai/v1/generate',
      model: 'command',
      headers: {
        'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  },

  // Web Speech API (Browser - Free)
  webSpeech: {
    name: 'Web Speech API',
    type: 'free',
    speechToText: {
      type: 'browser',
      implementation: 'navigator.mediaDevices.getUserMedia'
    },
    textToSpeech: {
      type: 'browser',
      implementation: 'speechSynthesis'
    }
  },

  // Azure Speech (Free Tier)
  azure: {
    name: 'Azure Speech',
    type: 'free-tier',
    speechToText: {
      url: 'https://eastus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
        'Content-Type': 'audio/wav'
      }
    },
    textToSpeech: {
      url: 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
        'Content-Type': 'application/ssml+xml'
      }
    }
  },

  // Google Cloud (Free Tier)
  google: {
    name: 'Google Cloud',
    type: 'free-tier',
    speechToText: {
      url: 'https://speech.googleapis.com/v1/speech:recognize',
      headers: {
        'Authorization': `Bearer ${process.env.GOOGLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    },
    textToSpeech: {
      url: 'https://texttospeech.googleapis.com/v1/text:synthesize',
      headers: {
        'Authorization': `Bearer ${process.env.GOOGLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  }
};

// Get current provider from environment
const getCurrentProvider = () => {
  const provider = process.env.AI_PROVIDER || 'openai';
  return AI_PROVIDERS[provider] || AI_PROVIDERS.openai;
};

// Check if provider is free
const isFreeProvider = (provider) => {
  return AI_PROVIDERS[provider]?.type === 'free' || 
         AI_PROVIDERS[provider]?.type === 'free-tier';
};

// Get all free providers
const getFreeProviders = () => {
  return Object.entries(AI_PROVIDERS)
    .filter(([key, provider]) => isFreeProvider(key))
    .map(([key, provider]) => ({
      key,
      name: provider.name,
      type: provider.type,
      features: Object.keys(provider).filter(k => k !== 'name' && k !== 'type')
    }));
};

module.exports = {
  AI_PROVIDERS,
  getCurrentProvider,
  isFreeProvider,
  getFreeProviders
}; 