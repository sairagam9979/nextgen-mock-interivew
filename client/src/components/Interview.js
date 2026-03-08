import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInterview } from '../contexts/InterviewContext';
import { 
  Mic, 
  MicOff, 
  Send, 
  Keyboard, 
  Volume2,
  VolumeX,
  Square,
  Play,
  Pause,
  RotateCcw,
  X
} from 'lucide-react';

const Interview = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const {
    currentSession,
    messages,
    isLoading,
    isTyping,
    sendMessage,
    endSession,
    abandonSession,
    loadSession
  } = useInterview();

  const [inputType, setInputType] = useState('text');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentUtterance, setCurrentUtterance] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (sessionId && !currentSession) {
      loadSession(sessionId);
    }
  }, [sessionId, currentSession, loadSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && inputType === 'text') return;

    if (inputType === 'text') {
      await sendMessage(inputText, 'text');
      setInputText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Your browser does not support speech recognition. Please use Chrome.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let finalTranscript = '';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        finalTranscript += transcript;
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = async () => {
        setIsRecording(false);
        recognitionRef.current = null;

        const text = finalTranscript.trim();
        if (text) {
          await sendMessage(text, 'voice');
        } else {
          alert('No speech detected. Please try again.');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      alert('Unable to start speech recognition.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  const playAudio = (text) => {
    if (isPlaying) return;

    if (!('speechSynthesis' in window)) {
      alert('Your browser does not support speech synthesis.');
      return;
    }

    try {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentUtterance(null);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setIsPlaying(false);
        setCurrentUtterance(null);
      };

      setCurrentUtterance(utterance);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setCurrentUtterance(null);
    }
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentUtterance(null);
    setIsPlaying(false);
  };

  const handleEndSession = async () => {
    const confirmed = window.confirm('Are you sure you want to end this interview session?');
    if (confirmed) {
      await endSession();
      navigate('/dashboard');
    }
  };

  const handleAbandonSession = async () => {
    const confirmed = window.confirm('Are you sure you want to abandon this interview session?');
    if (confirmed) {
      await abandonSession();
      navigate('/dashboard');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interview Session</h1>
          <p className="text-gray-600">Role: {currentSession.rolePrompt.substring(0, 50)}...</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEndSession}
            className="btn-secondary flex items-center space-x-1"
          >
            <Square size={16} />
            <span>End Session</span>
          </button>
          <button
            onClick={handleAbandonSession}
            className="btn-danger flex items-center space-x-1"
          >
            <X size={16} />
            <span>Abandon</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="card h-96 overflow-y-auto mb-6">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`message-bubble ${message.role === 'user' ? 'message-user' : 'message-ai'}`}>
                <div className="flex items-start space-x-2">
                  <div className="flex-1">
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                  {message.role === 'assistant' && voiceEnabled && (
                    <button
                      onClick={() => isPlaying ? stopAudio() : playAudio(message.content)}
                      className="flex-shrink-0 p-1 hover:bg-gray-200 rounded"
                    >
                      {isPlaying ? (
                        <Pause size={14} />
                      ) : (
                        <Volume2 size={14} />
                      )}
                    </button>
                  )}
                </div>
                {message.feedback && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Feedback:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        message.feedback.grammar === 'excellent' ? 'bg-green-100 text-green-800' :
                        message.feedback.grammar === 'good' ? 'bg-blue-100 text-blue-800' :
                        message.feedback.grammar === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {message.feedback.grammar}
                      </span>
                      <span className="text-gray-600">
                        Confidence: {message.feedback.confidence}/10
                      </span>
                    </div>
                    {message.feedback.notes && (
                      <p className="mt-1 text-gray-600">{message.feedback.notes}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="message-bubble message-ai">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="card">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setInputType('text')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                inputType === 'text' 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Keyboard size={20} />
            </button>
            <button
              onClick={() => setInputType('voice')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                inputType === 'voice' 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Mic size={20} />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Voice Output</span>
            </label>
          </div>
        </div>

        {inputType === 'text' ? (
          <div className="flex space-x-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
              className="input-field flex-1 resize-none"
              rows={3}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
              className="btn-primary px-4 self-end"
            >
              <Send size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isLoading}
                className="btn-primary flex items-center space-x-2"
              >
                <Mic size={20} />
                <span>Start Recording</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="btn-danger flex items-center space-x-2 recording-pulse"
              >
                <MicOff size={20} />
                <span>Stop Recording</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Interview; 