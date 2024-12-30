import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { Github, Link2, AlertCircle, Shield } from 'lucide-react';
import ProgressBar from './components/ProgressBar';
import AdminControls from './components/AdminControls';
import LoginModal from './components/LoginModal';
import { isValidGitHubPRUrl } from './utils/validation';
import { savePRProgress, getPRProgress, saveEmailToDatabase } from './api';
import Cookies from 'js-cookie';
import { savePRProgressLocally } from './utils/storage';
import { checkPRStatus } from './utils/validation';
import Modal from './components/Modal';

function App() {
  const [prUrl, setPrUrl] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [acrylicCut, setAcrylicCut] = useState(false);
  const [soldered, setSoldered] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [email, setEmail] = useState('');
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const client_secrets = import.meta.env.VITE_CODE;
  const [prUrls] = useState<string[]>([]);

  const stages = [
    'PR Approved',
    '3D Printing',
    'Ordering PCBs',
    'Boxing all the parts!',
    'Out for Shipping',
    'Shipped :D ',
  ];

  const navigate = useNavigate();

  // Load saved progress when PR URL is submitted
  useEffect(() => {
    const loadProgress = async () => {
      if (isSubmitted && prUrl) {
        // First check local storage
        const localProgress = getPRProgress(prUrl);
        if (localProgress) {
          setProgress(localProgress.progress);
          setCurrentStage(localProgress.currentStage);
          setAcrylicCut(localProgress.acrylicCut);
          setSoldered(localProgress.soldered);
        } else {
          // If not in local storage, fetch from DB
          const savedProgress = await getPRProgress(prUrl);
          if (savedProgress) {
            setProgress(savedProgress.progress);
            setCurrentStage(savedProgress.current_stage);
            setAcrylicCut(savedProgress.acrylic_cut);
            setSoldered(savedProgress.soldered);
            if (!savedProgress.email) {
              console.log('Email is missing, showing email prompt.');
              setShowEmailPrompt(true);
            }
            // Save to local storage for future use
            savePRProgressLocally(prUrl, savedProgress.progress, savedProgress.current_stage, savedProgress.acrylic_cut, savedProgress.soldered);
          }
        }
      }
    };
    loadProgress();
  }, [isSubmitted, prUrl]);

  const verifyUser = useCallback(async (token: string, userId: string) => {
    const authorizedUsers = [import.meta.env.VITE_AUTHUSERS1, import.meta.env.VITE_AUTHUSERS2, import.meta.env.VITE_AUTHUSERS3];

    try {
      console.log('Verifying user with token:', token);

      const response = await fetch(import.meta.env.VITE_URL + `/api/slack/api/users.profile.get?user=${userId}`, {
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
              client_id: import.meta.env.VITE_CLIENT_ID,
              client_secret: import.meta.env.VITE_CODE,
              code,
              redirect_uri: import.meta.env.VITE_URL + '/callback',
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

    const prNumber = prUrl.split('/').pop() || '';
    const { isValid: isPRValid, isMerged } = await checkPRStatus(prNumber);

    if (!isPRValid) {
      setIsValid(false);
      return;
    }

    setIsValid(true);
    setIsSubmitted(true);

    const savedProgress = await getPRProgress(prUrl);
    let initialProgress = 0;
    let initialStage = stages[0];

    if (savedProgress) {
      if (isMerged && savedProgress.progress < 20) {
        initialProgress = 20;
        initialStage = stages[Math.floor((20 / 100) * (stages.length - 1))];
        await savePRProgress(prUrl, initialProgress, initialStage);
      } else {
        initialProgress = savedProgress.progress;
        initialStage = savedProgress.current_stage;
      }
    } else {
      if (isMerged) {
        initialProgress = 20;
        initialStage = stages[Math.floor((20 / 100) * (stages.length - 1))];
      }
      await savePRProgress(prUrl, initialProgress, initialStage);
    }

    if (initialStage === 'Printing your 3d Case!') {
      initialProgress = 36;
    } else if (initialStage === "Ordering PCB's") {
      initialProgress = 54;
    }

    await savePRProgress(prUrl, initialProgress, initialStage);

    setProgress(initialProgress);
    setCurrentStage(initialStage);
    savePRProgressLocally(prUrl, initialProgress, initialStage);

    // Check if email is missing and show prompt
    if (!savedProgress?.email) {
      setShowEmailPrompt(true);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    Cookies.remove('slack_token');
    Cookies.remove('slack_user_id');
  };

  const handleProgressChange = (newProgress: number) => {
    setProgress(newProgress);
    const newStage = stages[Math.floor((newProgress / 100) * (stages.length - 1))];
    setCurrentStage(newStage);
    
    // Always update local storage immediately
    savePRProgressLocally(prUrl, newProgress, newStage, acrylicCut, soldered);
  };

  const handleProgressComplete = async (newProgress: number) => {
    if (prUrl) {
      // Sync with DB
      await savePRProgress(prUrl, newProgress, currentStage, acrylicCut, soldered);
      
      // Fetch latest from DB to ensure consistency
      const latestProgress = await getPRProgress(prUrl);
      if (latestProgress) {
        setProgress(latestProgress.progress);
        setCurrentStage(latestProgress.current_stage);
        setAcrylicCut(latestProgress.acrylic_cut);
        setSoldered(latestProgress.soldered);
        // Update local storage with latest DB data
        savePRProgressLocally(prUrl, latestProgress.progress, latestProgress.current_stage, latestProgress.acrylic_cut, latestProgress.soldered);
      }
    }
  };

  const handleStageChange = (selectedStage: string) => {
    const stageIndex = stages.indexOf(selectedStage);
    const newProgress = Math.round((stageIndex / (stages.length - 1)) * 100);
    
    setProgress(newProgress);
    setCurrentStage(selectedStage);
    
    // Update local storage
    savePRProgressLocally(prUrl, newProgress, selectedStage, acrylicCut, soldered);
    
    // Sync with DB
    if (prUrl) {
      savePRProgress(prUrl, newProgress, selectedStage, acrylicCut, soldered);
    }
  };

  const handleBulkUpdate = async (selectedPrs: string[], newProgress: number, newStage: string) => {
    // Process each PR URL individually
    await Promise.all(selectedPrs.map(pr => 
      savePRProgress(pr, newProgress, newStage, acrylicCut, soldered)
    ));
  };

  const handleEmailSubmit = async (email: string) => {
    console.log('Submitting email:', email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    await saveEmailToDatabase(prUrl, email);
    setEmail(email);
    setShowEmailPrompt(false);
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
                        <div className="flex items-center space-x-1">
                          <span className="pl-10 text-gray-400 text-sm">github.com/hackclub/hackpad/pull/</span>
                          <input
                            id="pr-number"
                            name="pr-number"
                            type="text"
                            className="w-16 py-1.5 px-2 border border-gray-600 rounded-md bg-gray-700 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="256"
                            value={prUrl.replace('https://github.com/hackclub/hackpad/pull/', '')}
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => setPrUrl('https://github.com/hackclub/hackpad/pull/' + e.target.value)}
                          />
                        </div>
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
                      <ProgressBar 
                        progress={progress} 
                        currentStage={currentStage} 
                        acrylicCut={acrylicCut} 
                        soldered={soldered} 
                        stages={stages}
                      />
                    </div>
                    {!isAdmin && (
                      <div className="mt-8 space-y-4">
                        <div className="flex items-center space-x-2 text-blue-400">
                          <h3 className="text-sm font-medium">Hackpad 3D Printing Live Stream</h3>
                        </div>
                        <div className="relative pt-[56.25%] rounded-lg overflow-hidden">
                          <iframe
                            src="https://www.youtube.com/embed/ZtxAc-QAwJw"
                            title="Hackpad 3D Printing Live Stream"
                            className="absolute top-0 left-0 w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      </div>
                    )}
                    {isAdmin && (
                      <AdminControls
                        progress={progress}
                        currentStage={currentStage}
                        acrylicCut={acrylicCut}
                        soldered={soldered}
                        currentPrUrl={prUrl}
                        stages={stages}
                        onProgressChange={handleProgressChange}
                        onProgressChangeComplete={handleProgressComplete}
                        onStageChange={handleStageChange}
                        prUrls={prUrls}
                        onBulkUpdate={handleBulkUpdate}
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

          <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
            <LoginModal
              onClose={() => {
                setShowLoginModal(false);
                setLoginError('');
              }}
              error={loginError}
            />
          </Modal>

          <Modal isOpen={showEmailPrompt} onClose={() => setShowEmailPrompt(false)}>
            {console.log('Rendering email prompt modal')}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Enter your email for Hackpad Updates</h2>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full py-2 px-3 border border-gray-600 rounded-md bg-gray-700 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm mb-4"
              />
              <button
                onClick={() => handleEmailSubmit(email)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Submit
              </button>
            </div>
          </Modal>
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
