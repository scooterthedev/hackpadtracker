import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { Github, Link2, AlertCircle, Shield } from 'lucide-react';
import ProgressBar from './components/ProgressBar';
import AdminControls from './components/AdminControls';
import LoginModal from './components/LoginModal';
import { isValidGitHubPRUrl } from './utils/validation';
import { savePRProgress, getPRProgress } from './api';
import Cookies from 'js-cookie';

function App() {
  const [prUrl, setPrUrl] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState('');
  const client_secrets = import.meta.env.VITE_CODE;

  const stages = [
    'PR Approved',
    'Ordering PCBs',
    'Printing your 3d Case!',
    'Out for Shipping',
    'Shipped :D ',
  ];

  const navigate = useNavigate();

// Load saved progress when PR URL is submitted
useEffect(() => {
  const loadProgress = async () => {
    if (isSubmitted && prUrl) {
      const savedProgress = await getPRProgress(prUrl);
      if (savedProgress) {
        setProgress(savedProgress.progress);
        setCurrentStage(savedProgress.current_stage);
      } else {
        setProgress(0);
        setCurrentStage(stages[0]);
        await savePRProgress(prUrl, 0, stages[0]);
      }
    }
  };
  loadProgress();
}, [isSubmitted, prUrl, stages]);

  const verifyUser = useCallback(async (token: string, userId: string) => {
    const authorizedUsers = [import.meta.env.VITE_AUTHUSERS];

    try {
      console.log('Verifying user with token:', token);

      const response = await fetch(`https://hackpadtracker-eta.vercel.app/api/slack/api/users.profile.get?user=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('Full response data:', data);

      if (!data.ok) {
        console.error('Error from Slack API:', data.error);
        setLoginError(`Error: ${data.error}`);
        return;
      }

      const profile = data.profile;
      console.log('Profile data:', profile);

      const userName = profile.display_name || profile.real_name;
      console.log('Authenticated user:', userName);

      if (authorizedUsers.includes(userName)) {
        console.log('User is authorized');
        setIsAdmin(true);
        setShowLoginModal(false);
        setLoginError('');
      } else {
        console.log('User is not authorized');
        setLoginError('Unauthorized user');
      }
    } catch (error: any) {
      console.error('Error during verification:', error);
      setLoginError(error.message);
    }
  }, [setIsAdmin, setShowLoginModal, setLoginError]);

  useEffect(() => {
    const token = Cookies.get('slack_token');
    const userId = Cookies.get('slack_user_id');
    if (token && userId) {
      verifyUser(token, userId);
    }
  }, [verifyUser]);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        try {
          const response = await fetch('https://slack.com/api/oauth.v2.access', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: '2210535565.7957522136834',
              client_secret: import.meta.env.VITE_CODE,
              code,
              redirect_uri: 'https://hackpadtracker-eta.vercel.app/callback',
            }),
          });

          const data = await response.json();
          if (data.ok) {
            Cookies.set('slack_token', data.access_token);
            Cookies.set('slack_user_id', data.authed_user.id);
            await verifyUser(data.access_token, data.authed_user.id);
            navigate('/');
          } else {
            setLoginError(`Error: ${data.error}`);
          }
        } catch (error: any) {
          console.error('Error:', error);
          setLoginError(error.message);
        }
      }
    };

    handleCallback();
  }, [navigate, client_secrets, verifyUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidGitHubPRUrl(prUrl)) {
      setIsValid(false);
      return;
    }

    setIsValid(true);
    setIsSubmitted(true);

    const savedProgress = await getPRProgress(prUrl);
    if (savedProgress) {
      setProgress(savedProgress.progress);
      setCurrentStage(savedProgress.current_stage);
    } else {
      setProgress(0);
      setCurrentStage(stages[0]);
      await savePRProgress(prUrl, 0, stages[0]);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    Cookies.remove('slack_token');
  };

  const handleProgressChange = async (newProgress: number) => {
    setProgress(newProgress);
    const newStage = stages[Math.floor((newProgress / 100) * (stages.length - 1))];
    setCurrentStage(newStage);
    if (isAdmin && prUrl) {
      await savePRProgress(prUrl, newProgress, newStage);
    }
  };

  return (
    <Routes>
      <Route path="/callback" element={<div>Handling OAuth callback...</div>} />
      <Route path="/" element={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto">
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

              <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-8 shadow-xl border border-gray-700">
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="pr-url" className="block text-sm font-medium text-gray-300">
                        GitHub Pull Request URL
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Link2 className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          id="pr-url"
                          name="pr-url"
                          type="url"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="https://github.com/hackclub/hackpad/pull/1"
                          value={prUrl}
                          onChange={(e) => setPrUrl(e.target.value)}
                        />
                      </div>
                      {!isValid && (
                        <div className="flex items-center space-x-2 text-red-400 text-sm mt-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>Invalid GitHub PR URL</span>
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
                          savePRProgress(prUrl, progress, stage);
                        }}
                      />
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setIsSubmitted(false);
                          setPrUrl('');
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
              error={loginError}
            />
          )}
        </div>
      } />
    </Routes>
  );
}

function Root() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default Root;