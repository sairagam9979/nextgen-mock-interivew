import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const InterviewContext = createContext();

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};

export const InterviewProvider = ({ children }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const startSession = async (rolePrompt, settings = {}) => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/interview/start', {
        rolePrompt,
        settings
      });
      
      const session = response.data.session;
      setCurrentSession(session);
      setMessages([]);
      
      toast.success('Interview session started!');
      return { success: true, session };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to start session';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content, inputType = 'text', audioUrl = null) => {
    if (!currentSession) {
      toast.error('No active session');
      return { success: false };
    }

    try {
      setIsLoading(true);
      
      // Add user message to UI immediately
      const userMessage = {
        role: 'user',
        content,
        inputType,
        timestamp: new Date(),
        audioUrl
      };
      setMessages(prev => [...prev, userMessage]);

      // Send message to backend
      await axios.post(`/api/interview/session/${currentSession.sessionId}/message`, {
        content,
        inputType,
        audioUrl
      });

      // Get AI response
      setIsTyping(true);
      const aiResponse = await axios.post('/api/ai/chat', {
        sessionId: currentSession.sessionId,
        message: content
      });

      const aiMessage = {
        role: 'assistant',
        content: aiResponse.data.response,
        timestamp: new Date(),
        feedback: aiResponse.data.feedback
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      
      return { success: true, response: aiResponse.data.response };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to send message';
      toast.error(message);
      setIsTyping(false);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = async () => {
    if (!currentSession) return;

    try {
      setIsLoading(true);
      await axios.post(`/api/interview/session/${currentSession.sessionId}/end`);
      
      setCurrentSession(null);
      setMessages([]);
      setIsTyping(false);
      
      toast.success('Interview session ended');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to end session';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const abandonSession = async () => {
    if (!currentSession) return;

    try {
      setIsLoading(true);
      await axios.post(`/api/interview/session/${currentSession.sessionId}/abandon`);
      
      setCurrentSession(null);
      setMessages([]);
      setIsTyping(false);
      
      toast.success('Interview session abandoned');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to abandon session';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await axios.post('/api/ai/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return { success: true, text: response.data.text };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to transcribe audio';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const synthesizeSpeech = async (text, voice = 'alloy') => {
    try {
      const response = await axios.post('/api/ai/synthesize', { text, voice });
      
      // Convert base64 to audio blob
      const audioData = atob(response.data.audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
      return { success: true, audioBlob };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to synthesize speech';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const getRolePrompts = async () => {
    try {
      const response = await axios.get('/api/ai/role-prompts');
      // Handle both possible response formats
      const prompts = response.data.roles || response.data.rolePrompts || [];
      return { success: true, prompts };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to get role prompts';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const loadSession = async (sessionId) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/interview/session/${sessionId}`);
      const session = response.data.session;
      
      setCurrentSession({
        sessionId: session.sessionId,
        rolePrompt: session.rolePrompt,
        settings: session.settings,
        startTime: session.startTime
      });
      
      setMessages(session.messages || []);
      return { success: true, session };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to load session';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentSession,
    messages,
    isLoading,
    isTyping,
    startSession,
    sendMessage,
    endSession,
    abandonSession,
    transcribeAudio,
    synthesizeSpeech,
    getRolePrompts,
    loadSession
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
}; 