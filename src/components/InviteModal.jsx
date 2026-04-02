import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api';

const InviteModal = ({ onCoupleConnected }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState('generate'); // 'generate' or 'accept'
  const [inviteCode, setInviteCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  // Debug: Log user on mount
  useEffect(() => {
    console.log('📋 InviteModal mounted with user:', user);
  }, [user]);

  useEffect(() => {
    const generateInvite = async () => {
      try {
        if (!user?.id) {
          console.error('❌ User ID missing:', user);
          setError('User not properly loaded. Try refreshing the page.');
          return;
        }
        console.log('📤 Generating invite for user:', user.id);
        const response = await api.generateInvite();
        console.log('✅ Invite generated:', response.data);
        setInviteCode(response.data.inviteCode);
        setError(''); // Clear any previous errors
      } catch (err) {
        const errorMsg = err.response?.data?.msg || err.message || 'Failed to generate invite code';
        console.error('❌ Generate invite error:', errorMsg, err);
        setError(errorMsg);
        setInviteCode('');
      }
    };

    if (user?.id && mode === 'generate') {
      generateInvite();
    }
  }, [mode, user?.id]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleAcceptInvite = async () => {
    if (!inputCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.acceptInvite(inputCode);
      setSuccess('Successfully connected with your partner! 💕');
      setTimeout(() => {
        onCoupleConnected(response.data.coupleId);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen ustwo-ambient bg-gradient-to-br from-rose-50 via-pink-100 to-purple-100 flex items-center justify-center p-4">
      <div className="relative z-10 ustwo-glass rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold ustwo-text-gradient text-center mb-2">
          💕 UsTwo
        </h1>
        <p className="text-gray-500 text-center mb-8">Create your private room for two</p>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-8 bg-white/70 rounded-xl p-1 border border-pink-100">
          <button
            onClick={() => {
              setMode('generate');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
              mode === 'generate'
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Room Key
          </button>
          <button
            onClick={() => {
              setMode('accept');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
              mode === 'accept'
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Enter Room
          </button>
        </div>

        {/* Generate Mode */}
        {mode === 'generate' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-pink-50/90 to-purple-50/90 p-6 rounded-2xl text-center border border-pink-100">
              <p className="text-sm text-gray-600 mb-3">Your private room key</p>
              <p className="text-4xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-4">
                {inviteCode || 'Loading...'}
              </p>
              <button
                onClick={handleCopyCode}
                disabled={!inviteCode}
                className="w-full ustwo-brand-gradient text-white py-2.5 px-4 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {copied ? '✓ Sealed & Copied' : 'Seal & Share'}
              </button>
            </div>

            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800 leading-relaxed">
                ✨ Share this room key only with your partner. It unlocks your private space together.
              </p>
            </div>
          </div>
        )}

        {/* Accept Mode */}
        {mode === 'accept' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enter your partner's room key
              </label>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="e.g., 60D1D480"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-pink-500 focus:outline-none font-mono text-center text-lg tracking-wider bg-white/85"
                maxLength="8"
              />
            </div>

            <button
              onClick={handleAcceptInvite}
              disabled={loading}
              className="w-full ustwo-brand-gradient text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Unlocking room...' : 'Unlock Our Room'}
            </button>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-sm text-purple-800">
                💌 Ask your partner for their room key to enter your private space.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">❌ {error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">✅ {success}</p>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-8">
          💑 A room that belongs only to both of you
        </p>
      </div>
    </div>
  );
};

export default InviteModal;
