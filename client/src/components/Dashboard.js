import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useInterview } from '../contexts/InterviewContext';
import { 
  Play, 
  History, 
  Settings, 
  Mic, 
  Keyboard,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { startSession, getRolePrompts } = useInterview();
  const navigate = useNavigate();
  const [rolePrompts, setRolePrompts] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRolePrompts();
  }, []);

  const loadRolePrompts = async () => {
    const result = await getRolePrompts();
    if (result.success && result.prompts && result.prompts.length > 0) {
      setRolePrompts(result.prompts);
      setSelectedRole(result.prompts[0]?.id || '');
    }
  };

  const handleStartInterview = async () => {
    if (!selectedRole && !customPrompt.trim()) {
      alert('Please select a role or enter a custom prompt');
      return;
    }

    setIsLoading(true);
    
    const selectedPrompt = rolePrompts?.find(p => p.id === selectedRole);
    const rolePrompt = customPrompt.trim() || selectedPrompt?.prompt || selectedPrompt?.description || '';

    const result = await startSession(rolePrompt, {
      voiceEnabled,
      maxQuestions: 10,
      timeLimit: 30
    });

    if (result.success && result.session?.sessionId) {
      navigate(`/interview/${result.session.sessionId}`);
    } else {
      console.error('Failed to start session:', result);
    }
    
    setIsLoading(false);
  };

  const getSelectedPrompt = () => {
    if (customPrompt.trim()) return customPrompt;
    const selected = rolePrompts?.find(p => p.id === selectedRole);
    return selected?.prompt || selected?.description || '';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Ready to practice your interview skills? Choose a role and start your AI-powered interview.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Interview Section */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Start New Interview
            </h2>

            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Interview Role
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rolePrompts && rolePrompts.length > 0 ? (
                  rolePrompts.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-colors duration-200 ${
                        selectedRole === role.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h3 className="font-medium text-gray-900">{role.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {role.description ? role.description.substring(0, 100) : role.prompt?.substring(0, 100)}...
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 p-4 text-center text-gray-500">
                    Loading role prompts...
                  </div>
                )}
              </div>
            </div>

            {/* Custom Prompt */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or enter a custom role prompt
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe the role you want the AI to play..."
                className="input-field h-24 resize-none"
                rows={4}
              />
            </div>

            {/* Settings */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Interview Settings
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={voiceEnabled}
                    onChange={(e) => setVoiceEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable voice input</span>
                </label>
              </div>
            </div>

            {/* Selected Prompt Preview */}
            {getSelectedPrompt() && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Role:</h4>
                <p className="text-sm text-gray-600">{getSelectedPrompt()}</p>
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={handleStartInterview}
              disabled={isLoading || (!selectedRole && !customPrompt.trim())}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Play size={20} />
                  <span>Start Interview</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Total Sessions</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {user?.interviewHistory?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Avg. Score</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">8.5</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/history')}
                className="w-full flex items-center space-x-2 p-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <History size={18} />
                <span>View History</span>
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="w-full flex items-center space-x-2 p-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <Settings size={18} />
                <span>Profile Settings</span>
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Tips</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Speak clearly and at a moderate pace</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Use specific examples from your experience</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Practice active listening and respond thoughtfully</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 