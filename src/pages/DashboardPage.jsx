import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useSocket } from '../hooks/useSocket';
import ChatWindow from '../components/ChatWindow';
import InviteModal from '../components/InviteModal';
import SharedCanvas from '../components/SharedCanvas';
import MemoryLane from '../components/MemoryLane';
import DiaryBook from '../components/DiaryBook';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [coupleData, setCoupleData] = useState(null);
  const [isLoadingCouple, setIsLoadingCouple] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [mood, setMood] = useState('cozy');
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [hasDiaryAlert, setHasDiaryAlert] = useState(false);

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

  useEffect(() => {
    if (!socket || !coupleData?._id || !user?.id) return;

    socket.emit('join-room', { coupleId: coupleData._id });

    const mySide = coupleData.user1?._id === user.id ? 'left' : 'right';

    const onDiaryComment = ({ targetPage, authorId }) => {
      if (authorId?.toString() === user.id?.toString()) return;
      if (targetPage === mySide && !isDiaryOpen) {
        setHasDiaryAlert(true);
      }
    };

    socket.on('diary-comment-added', onDiaryComment);

    return () => {
      socket.off('diary-comment-added', onDiaryComment);
      socket.emit('leave-room', { coupleId: coupleData._id });
    };
  }, [socket, coupleData?._id, coupleData?.user1?._id, user?.id, isDiaryOpen]);

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
  const partnerData =
    coupleData.user1._id === user?.id ? coupleData.user2 : coupleData.user1;
  const partnerName = partnerData?.name || 'Partner';
  const partnerInitials = partnerData?.initials || partnerName.slice(0, 2).toUpperCase();
  const moodLabelMap = {
    cozy: 'Cozy Evening',
    night: 'Late Night',
    playful: 'Playful Vibe',
    deep: 'Deep Talk'
  };

  return (
    <div
      className={`h-dvh min-h-dvh overflow-hidden flex flex-col ustwo-ambient ${mood === 'night' ? 'ustwo-night' : 'bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50'}`}
    >
      {/* Compact top bar */}
      <nav className="z-30 px-3 sm:px-4 pt-2 sm:pt-3">
        <div className="max-w-7xl mx-auto ustwo-glass rounded-xl px-3 sm:px-4 py-2.5 relative z-10">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-full ustwo-brand-gradient text-white flex items-center justify-center font-bold animate-heartbeat text-sm">
                {user?.initials || 'U'}
              </div>
              <div className="w-8 h-8 rounded-full bg-white text-gray-700 border-2 border-white absolute -bottom-1 -right-1.5 flex items-center justify-center text-[10px] font-bold">
                {partnerInitials}
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black ustwo-text-gradient truncate">UsTwo Room</h1>
              <p className="text-xs text-gray-500 truncate">{moodLabelMap[mood]} · With {partnerName}</p>
            </div>
          </div>
            <div className="flex items-center gap-2">
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="ustwo-pill bg-white/80 outline-none max-w-[110px]"
            >
              <option value="cozy">Cozy</option>
              <option value="night">Late Night</option>
              <option value="playful">Playful</option>
              <option value="deep">Deep Talk</option>
            </select>
            <button
              onClick={handleLogout}
              className="ustwo-brand-gradient text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition transform hover:scale-105 ustwo-soft-shadow"
            >
              Logout
            </button>
          </div>
        </div>

          <div className="grid grid-cols-3 gap-1 bg-white/70 rounded-lg p-1 border border-pink-100 mt-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition ${
                activeTab === 'chat'
                  ? 'ustwo-brand-gradient text-white'
                  : 'text-gray-700 hover:bg-pink-50'
              }`}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setActiveTab('canvas')}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition ${
                activeTab === 'canvas'
                  ? 'ustwo-brand-gradient text-white'
                  : 'text-gray-700 hover:bg-pink-50'
              }`}
            >
              🎨 Canvas
            </button>
            <button
              onClick={() => setActiveTab('memories')}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition ${
                activeTab === 'memories'
                  ? 'ustwo-brand-gradient text-white'
                  : 'text-gray-700 hover:bg-pink-50'
              }`}
            >
              📸 Memories
            </button>
          </div>
        </div>
      </nav>

      {/* Main Chat Container */}
      <div className="flex-1 min-h-0 overflow-hidden relative z-10 px-3 sm:px-4 pb-3 sm:pb-4 pt-1 sm:pt-2">
        <div className="h-full min-h-0 flex flex-col max-w-7xl mx-auto w-full">
          <div className="flex-1 min-h-0 overflow-hidden pt-1">
            {activeTab === 'chat' ? (
              <ChatWindow
                coupleId={coupleData._id}
                partnerName={partnerName}
                mood={mood}
                onOpenCanvas={() => setActiveTab('canvas')}
              />
            ) : activeTab === 'canvas' ? (
              <SharedCanvas
                coupleId={coupleData._id}
                mood={mood}
                onBackToChat={() => setActiveTab('chat')}
              />
            ) : (
              <MemoryLane
                coupleId={coupleData._id}
                mood={mood}
              />
            )}
          </div>
        </div>
      </div>

      <DiaryBook
        isOpen={isDiaryOpen}
        onOpen={() => {
          setIsDiaryOpen(true);
          setHasDiaryAlert(false);
        }}
        onClose={() => setIsDiaryOpen(false)}
        coupleId={coupleData._id}
        coupleData={coupleData}
        user={user}
        hasAlert={hasDiaryAlert}
      />

      {!isDiaryOpen && hasDiaryAlert ? (
        <div className="fixed bottom-20 right-5 z-40 text-xs ustwo-pill bg-rose-100 text-rose-700 animate-heartbeat">
          New diary ink note 💜
        </div>
      ) : null}
    </div>
  );
};

export default DashboardPage;
