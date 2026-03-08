import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Settings, Save } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    preferences: {
      voiceEnabled: user?.preferences?.voiceEnabled ?? true,
      defaultRolePrompt: user?.preferences?.defaultRolePrompt || ''
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('preferences.')) {
      const prefKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await updateProfile(formData);
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and interview preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <User className="mr-2" size={20} />
              Personal Information
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="email"
                    id="email"
                    value={user?.email || ''}
                    className="input-field bg-gray-50"
                    disabled
                  />
                  <span className="text-xs text-gray-500">(Cannot be changed)</span>
                </div>
              </div>

              <div>
                <label htmlFor="defaultRolePrompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Default Role Prompt
                </label>
                <textarea
                  id="defaultRolePrompt"
                  name="preferences.defaultRolePrompt"
                  value={formData.preferences.defaultRolePrompt}
                  onChange={handleChange}
                  className="input-field h-24 resize-none"
                  placeholder="Enter your preferred default role prompt for interviews..."
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be used as the default role prompt when starting new interviews.
                </p>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="preferences.voiceEnabled"
                    checked={formData.preferences.voiceEnabled}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable voice features by default</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  This will enable voice input and output for new interview sessions.
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center space-x-2"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings size={18} className="mr-2" />
              Account Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Member since:</span>
                <span className="text-gray-900">
                  {new Date(user?.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total interviews:</span>
                <span className="text-gray-900">
                  {user?.interviewHistory?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account type:</span>
                <span className="text-gray-900 capitalize">
                  {user?.role || 'user'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Statistics</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="text-green-600 font-medium">
                  {user?.interviewHistory?.filter(h => h.status === 'completed').length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active:</span>
                <span className="text-blue-600 font-medium">
                  {user?.interviewHistory?.filter(h => h.status === 'active').length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Abandoned:</span>
                <span className="text-red-600 font-medium">
                  {user?.interviewHistory?.filter(h => h.status === 'abandoned').length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Tips</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Set a default role prompt to speed up interview setup</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Enable voice features for a more natural interview experience</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Review your interview history to track your progress</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 