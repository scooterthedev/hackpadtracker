import React, { useState } from 'react';
import { X } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
  error?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, error }) => {
  const [loading, setLoading] = useState(false);

const handleSlackLogin = async () => {
  setLoading(true);
  const clientId = '2210535565.7957522136834';
  const redirectUri = 'https://hackpadtracker-eta.vercel.app/callback';
  const scope = 'users.profile:read';
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

  window.location.href = authUrl;
};
  return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md relative">
          <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-semibold mb-4">Admin Login</h2>

          {error && (
              <div className="flex items-center space-x-2 text-red-400 text-sm">
                <span>{error}</span>
              </div>
          )}

          <button
              onClick={handleSlackLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              disabled={loading}
          >
            {loading ? 'Redirecting...' : 'Login with Slack'}
          </button>
        </div>
      </div>
  );
};

export default LoginModal;