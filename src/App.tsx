import React, { useState, useEffect } from 'react';
import { Github, Link2, AlertCircle, Shield } from 'lucide-react';
import ProgressBar from './components/ProgressBar';
import AdminControls from './components/AdminControls';
import LoginModal from './components/LoginModal';
import { isValidGitHubPRUrl } from './utils/validation';
import { authenticateAdmin } from './utils/auth';
import { savePRProgress, getPRProgress } from './utils/storage';

function App() {
  const [prUrl, setPrUrl] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState('');

  const stages = [
    'PR Approved',
    'Ordering PCBs',
    'Printing your 3d Case!',
    'Out for Shipping',
    'Shipped :D ',
  ];

  // Load saved progress when PR URL is submitted
  useEffect(() => {
    if (isSubmitted && prUrl) {
      const savedProgress = getPRProgress(prUrl);
      if (savedProgress) {
        setProgress(savedProgress.progress);
        setCurrentStage(savedProgress.currentStage);
      } else {
        // Initialize with 0% progress and first stage
        setProgress(0);
        setCurrentStage(stages[0]);
        savePRProgress(prUrl, 0, stages[0]);
      }
    }
  }, [isSubmitted, prUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidGitHubPRUrl(prUrl)) {
      setIsValid(false);
      return;
    }

    setIsValid(true);
    setIsSubmitted(true);
    
    // Check for saved progress first
    const savedProgress = getPRProgress(prUrl);
    if (savedProgress) {
      setProgress(savedProgress.progress);
      setCurrentStage(savedProgress.currentStage);
    } else {
      // Initialize with 0% progress and first stage
      setProgress(0);
      setCurrentStage(stages[0]);
      savePRProgress(prUrl, 0, stages[0]);
    }
  };

  const handleLogin = (credentials: { username: string; password: string }) => {
    if (authenticateAdmin(credentials)) {
      setIsAdmin(true);
      setShowLoginModal(false);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
  };

  const handleProgressChange = (newProgress: number) => {
    setProgress(newProgress);
    const newStage = stages[Math.floor((newProgress / 100) * (stages.length - 1))];
    setCurrentStage(newStage);
    // Save progress when admin changes it
    if (isAdmin && prUrl) {
      savePRProgress(prUrl, newProgress, newStage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header with Admin Controls */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center space-x-3">
              <Github className="w-10 h-10" />
              <h1 className="text-4xl font-bold">PR Progress Tracker</h1>
            </div>
            <div>
              {isAdmin ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Login</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-8 shadow-xl border border-gray-700">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="pr-url" className="block text-sm font-medium text-gray-300">
                    GitHub Pull Request URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Link2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="pr-url"
                      value={prUrl}
                      onChange={(e) => {
                        setPrUrl(e.target.value);
                        setIsValid(true);
                      }}
                      className={`block w-full pl-10 pr-4 py-3 bg-gray-700/50 border ${
                        isValid ? 'border-gray-600' : 'border-red-500'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                      placeholder="https://github.com/owner/repo/pull/123"
                    />
                  </div>
                  {!isValid && (
                    <div className="flex items-center space-x-2 text-red-400 text-sm mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>Please enter a valid GitHub PR URL</span>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  Track Progress
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Pull Request Status</h2>
                  <p className="text-gray-400 text-sm break-all">{prUrl}</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-400">{currentStage}</span>
                    <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
                  </div>
                  <ProgressBar progress={progress} />
                </div>

                {isAdmin && (
                  <AdminControls
                    progress={progress}
                    currentStage={currentStage}
                    stages={stages}
                    onProgressChange={handleProgressChange}
                    onStageChange={(stage) => {
                      setCurrentStage(stage);
                      if (prUrl) {
                        savePRProgress(prUrl, progress, stage);
                      }
                    }}
                  />
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setPrUrl('');
                      setProgress(0);
                      setCurrentStage('');
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Track Another PR
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLoginModal && (
        <LoginModal
          onClose={() => {
            setShowLoginModal(false);
            setLoginError('');
          }}
          onLogin={handleLogin}
          error={loginError}
        />
      )}
    </div>
  );
}

export default App;