import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -top-40 right-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Navigation */}
      <nav className="relative z-20 bg-white/80 backdrop-blur-xl border-b border-white/40 shadow-lg sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-bounce">💕</span>
            <h1 className="text-3xl font-black bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
              UsTwo
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg font-semibold transition transform hover:scale-105 shadow-lg hover:shadow-rose-300"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-rose-100/50 via-pink-100/50 to-rose-100/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-12 border border-white/40 animate-fade-in">
          <div className="text-center">
            <h2 className="text-5xl font-black text-gray-800 mb-3 animate-fade-in animation-delay-300">
              Welcome back, {user?.name}! 💑
            </h2>
            <p className="text-gray-700 text-xl font-medium animate-fade-in animation-delay-500">
              A special space just for you and your love
            </p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Your Info */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/40 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in animation-delay-400">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-rose-400 via-pink-400 to-rose-400 rounded-2xl mb-6 shadow-lg transform hover:scale-110 transition-transform">
                <span className="text-5xl">💕</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2">{user?.name}</h3>
              <p className="text-rose-600 font-semibold mb-4">Initials: {user?.initials}</p>
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-6 border border-rose-200">
                <p className="text-gray-700 text-sm">
                  <span className="block font-bold text-gray-900">Your Email</span>
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Couple Status */}
          <div className="bg-gradient-to-br from-purple-100/30 via-pink-100/30 to-rose-100/30 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/40 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in animation-delay-600">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl mb-6 shadow-lg animate-pulse">
                <span className="text-5xl">👫</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2">Couple Status</h3>
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-5 mb-6 border-2 border-dashed border-amber-300">
                <p className="text-gray-800 font-semibold">
                  ⏳ Waiting to pair with your partner...
                </p>
                <p className="text-gray-600 text-sm mt-2">Share your invite code to connect</p>
              </div>
              <button className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-pink-300 font-bold transition transform hover:scale-105 uppercase tracking-wide">
                🔗 Generate Invite Code
              </button>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="animate-fade-in animation-delay-800">
          <h3 className="text-3xl font-black text-gray-800 mb-8">✨ Features Coming Soon</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '💬', title: 'Chat', desc: 'Real-time messaging', color: 'from-blue-400 to-cyan-400' },
              { icon: '📹', title: 'Video Call', desc: 'Crystal clear calls', color: 'from-red-400 to-pink-400' },
              { icon: '🎬', title: 'Watch Party', desc: 'Watch together', color: 'from-purple-400 to-indigo-400' },
              { icon: '🎨', title: 'Canvas', desc: 'Draw together', color: 'from-yellow-400 to-orange-400' }
            ].map((feature, idx) => (
              <div
                key={feature.title}
                className={`bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/40 text-center hover:shadow-2xl transform hover:-translate-y-3 transition-all duration-300 cursor-pointer animate-fade-in`}
                style={{ animationDelay: `${600 + idx * 100}ms` }}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl mb-4 shadow-lg transform hover:scale-110 transition-transform`}>
                  <span className="text-3xl">{feature.icon}</span>
                </div>
                <h4 className="font-bold text-gray-800 text-lg mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-600 font-medium">{feature.desc}</p>
                <div className="mt-4 h-1 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center mt-16 animate-fade-in animation-delay-1000">
          <p className="text-gray-700 text-lg font-bold">
            💑 Building a special space for you two...
          </p>
          <p className="text-gray-500 text-sm mt-2 font-medium">More features coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
