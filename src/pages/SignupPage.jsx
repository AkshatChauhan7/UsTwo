import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [validationError, setValidationError] = useState('');
  const { signup, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setValidationError('Please enter your name');
      return;
    }
    if (!formData.email.trim()) {
      setValidationError('Please enter your email');
      return;
    }
    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    const success = await signup(formData.email, formData.password, formData.name);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center px-4 overflow-hidden relative">
      {/* Animated background blobs */}
      <div className="absolute top-10 right-10 w-80 h-80 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
      <div className="absolute -bottom-8 left-10 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Animated Logo */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-block mb-4 animate-bounce">
            <span className="text-7xl drop-shadow-lg">💕</span>
          </div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 bg-clip-text text-transparent mb-2 animate-fade-in animation-delay-300">
            UsTwo
          </h1>
          <p className="text-gray-600 text-lg font-medium animate-fade-in animation-delay-500">Start your love story together</p>
        </div>

        {/* Enhanced Signup Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/40 animate-fade-in animation-delay-700 hover:shadow-3xl transition-shadow duration-500">
          {(error || validationError) && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm animate-shake">
              <span className="font-semibold">Oops!</span> {error || validationError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-800 mb-2 group-focus-within:text-rose-600 transition">
                👤 Your Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-5 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition duration-300 bg-white/50 hover:bg-white/80"
                disabled={loading}
                required
              />
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-800 mb-2 group-focus-within:text-rose-600 transition">
                📧 Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-5 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition duration-300 bg-white/50 hover:bg-white/80"
                disabled={loading}
                required
              />
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-800 mb-2 group-focus-within:text-rose-600 transition">
                🔐 Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-5 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition duration-300 bg-white/50 hover:bg-white/80"
                disabled={loading}
                required
              />
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-800 mb-2 group-focus-within:text-rose-600 transition">
                ✓ Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-5 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition duration-300 bg-white/50 hover:bg-white/80"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-rose-300 transform hover:scale-105 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Creating account...
                </span>
              ) : (
                '💌 Sign Up'
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-200 pt-6">
            <p className="text-gray-700 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-rose-600 font-bold hover:text-rose-700 hover:underline transition"
              >
                Login here
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-8 font-medium">
          💑 A space for couples to stay connected
        </p>
      </div>
    </div>
  );
};

export default SignupPage;