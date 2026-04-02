import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import ChatWindow from '../components/ChatWindow';
import InviteModal from '../components/InviteModal';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [coupleData, setCoupleData] = useState(null);
  const [isLoadingCouple, setIsLoadingCouple] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    const fetchCoupleData = async () => {
      try {
        const response = await api.getMyCouple();
        if (isMounted) {
          setCoupleData(response.data.couple);
        }
      } catch (error) {
        // Expected when user is not connected yet
      } finally {
        if (isMounted) {
          setIsLoadingCouple(false);
        }
      }
    };

    fetchCoupleData();

    // While waiting for partner to accept invite, poll for couple status
    const intervalId = setInterval(() => {
      if (!coupleData) {
        fetchCoupleData();
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [user?.id, coupleData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCoupleConnected = (coupleId) => {
    // Fetch the newly connected couple data
    api.getCoupleInfo(coupleId).then(res => setCoupleData(res.data.couple));
  };

  // If no couple is connected yet, show the invite modal
  if (isLoadingCouple) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!coupleData) {
    return <InviteModal onCoupleConnected={handleCoupleConnected} />;
  }

  // Safety check - ensure both users are populated
  if (!coupleData.user1 || !coupleData.user2) {
    return <InviteModal onCoupleConnected={handleCoupleConnected} />;
  }

  // Get partner name and info
  const partnerId = coupleData.user1._id === user?.id ? coupleData.user2._id : coupleData.user1._id;
  const partnerData =
    coupleData.user1._id === user?.id ? coupleData.user2 : coupleData.user1;
  const partnerName = partnerData?.name || 'Partner';

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-white/40 shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">💕</span>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                UsTwo
              </h1>
              <p className="text-xs text-gray-500">With {partnerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-semibold transition transform hover:scale-105 shadow-lg hover:shadow-rose-300"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Chat Container */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow coupleId={coupleData._id} partnerName={partnerName} />
      </div>
    </div>
  );
};

export default DashboardPage;
