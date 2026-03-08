// Browser-based Speech-to-Text using Web Speech API
export class BrowserSpeechToText {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResult = null;
    this.onError = null;
    this.onEnd = null;
    
    this.initSpeechRecognition();
  }

  initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (this.onResult) {
          this.onResult(transcript);
        }
      };
      
      this.recognition.onerror = (event) => {
        if (this.onError) {
          this.onError(event.error);
        }
      };
      
      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onEnd) {
          this.onEnd();
        }
      };
    } else {
      console.error('Speech recognition not supported in this browser');
    }
  }

  startListening() {
    if (this.recognition && !this.isListening) {
      this.recognition.start();
      this.isListening = true;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
}

// Browser-based Text-to-Speech using Web Speech API
export class BrowserTextToSpeech {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.currentUtterance = null;
    this.loadVoices();
  }

  loadVoices() {
    if (this.synthesis) {
      this.voices = this.synthesis.getVoices();
      
      if (this.voices.length === 0) {
        this.synthesis.onvoiceschanged = () => {
          this.voices = this.synthesis.getVoices();
        };
      }
    }
  }

  speak(text, options = {}) {
    if (!this.synthesis) {
      console.error('Speech synthesis not supported');
      return false;
    }

    // Stop any current speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set default options
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;
    
    // Try to find a good voice
    const preferredVoice = this.voices.find(voice => 
      voice.lang.startsWith('en') && voice.name.includes('Female')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      this.currentUtterance = null;
      if (options.onEnd) {
        options.onEnd();
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      if (options.onError) {
        options.onError(event.error);
      }
    };

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
    return true;
  }

  stop() {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
  }

  pause() {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  resume() {
    if (this.synthesis && this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  isSupported() {
    return !!window.speechSynthesis;
  }

  getVoices() {
    return this.voices;
  }
}

// Utility function to check browser support
export const checkBrowserSpeechSupport = () => {
  const speechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const speechSynthesis = !!window.speechSynthesis;
  
  return {
    speechRecognition,
    speechSynthesis,
    fullySupported: speechRecognition && speechSynthesis
  };
};

// Hook for React components
export const useBrowserSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  const speechToText = useMemo(() => new BrowserSpeechToText(), []);
  const textToSpeech = useMemo(() => new BrowserTextToSpeech(), []);

  useEffect(() => {
    speechToText.onResult = (text) => {
      setTranscript(text);
      setIsListening(false);
    };

    speechToText.onError = (error) => {
      setError(error);
      setIsListening(false);
    };

    speechToText.onEnd = () => {
      setIsListening(false);
    };

    return () => {
      speechToText.stopListening();
      textToSpeech.stop();
    };
  }, [speechToText, textToSpeech]);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    setIsListening(true);
    speechToText.startListening();
  }, [speechToText]);

  const stopListening = useCallback(() => {
    speechToText.stopListening();
    setIsListening(false);
  }, [speechToText]);

  const speak = useCallback((text, options = {}) => {
    setIsSpeaking(true);
    textToSpeech.speak(text, {
      ...options,
      onEnd: () => {
        setIsSpeaking(false);
        if (options.onEnd) options.onEnd();
      },
      onError: (error) => {
        setIsSpeaking(false);
        setError(error);
        if (options.onError) options.onError(error);
      }
    });
  }, [textToSpeech]);

  const stopSpeaking = useCallback(() => {
    textToSpeech.stop();
    setIsSpeaking(false);
  }, [textToSpeech]);

  return {
    // Speech-to-Text
    startListening,
    stopListening,
    isListening,
    transcript,
    
    // Text-to-Speech
    speak,
    stopSpeaking,
    isSpeaking,
    
    // Support
    error,
    isSupported: checkBrowserSpeechSupport(),
    
    // Utilities
    clearTranscript: () => setTranscript(''),
    clearError: () => setError(null)
  };
};

// Import React hooks
import { useState, useEffect, useMemo, useCallback } from 'react'; 