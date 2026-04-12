import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useSocket } from '../hooks/useSocket';
import ChatWindow from '../components/ChatWindow';
import InviteModal from '../components/InviteModal';
import SharedCanvas from '../components/SharedCanvas';
import MemoryLane from '../components/MemoryLane';
import DiaryBook from '../components/DiaryBook';
import CinemaTheater from '../components/CinemaTheater';
import Shopping from '../components/Shopping';

const validTabs = ['chat', 'canvas', 'memories', 'cinema', 'shopping'];

const getTabFromPath = (pathname) => {
  const tab = pathname?.split('/')[2];
  return validTabs.includes(tab) ? tab : 'chat';
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [coupleData, setCoupleData] = useState(null);
  const [isLoadingCouple, setIsLoadingCouple] = useState(true);
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [mood, setMood] = useState('cozy');
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [hasDiaryAlert, setHasDiaryAlert] = useState(false);
  const [hasCinemaInvite, setHasCinemaInvite] = useState(false);
  const previousMoodRef = useRef('cozy');

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    navigate(`/dashboard/${nextTab}`);
  };

  useEffect(() => {
    const nextTab = getTabFromPath(location.pathname);
    setActiveTab(nextTab);

    if (location.pathname === '/dashboard') {
      navigate('/dashboard/chat', { replace: true });
    }
  }, [location.pathname, navigate]);

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

    const onCinemaInvite = ({ fromUserId }) => {
      if (fromUserId?.toString() === user?.id?.toString()) return;
      if (activeTab !== 'cinema') {
        setHasCinemaInvite(true);
      }
    };

    socket.on('diary-comment-added', onDiaryComment);
    socket.on('cinema-invite', onCinemaInvite);

    return () => {
      socket.off('diary-comment-added', onDiaryComment);
      socket.off('cinema-invite', onCinemaInvite);
      socket.emit('leave-room', { coupleId: coupleData._id });
    };
  }, [socket, coupleData?._id, coupleData?.user1?._id, user?.id, isDiaryOpen, activeTab]);

  useEffect(() => {
    if (activeTab === 'cinema') {
      if (mood !== 'movie') {
        previousMoodRef.current = mood;
      }
      setMood('movie');
      setHasCinemaInvite(false);
    } else if (mood === 'movie') {
      setMood(previousMoodRef.current || 'cozy');
    }
  }, [activeTab]);

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
  <div className="min-h-screen bg-linear-to-br from-pink-100 to-purple-100 flex items-center justify-center">
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
    ,movie: 'Movie Night'
  };

  const isCinemaActive = activeTab === 'cinema';

  return (
    <div
  className={`h-dvh min-h-dvh overflow-hidden flex flex-col ustwo-ambient ${isCinemaActive ? 'bg-linear-to-br from-[#17131f] via-[#231b31] to-[#0f0c14]' : mood === 'night' ? 'ustwo-night' : 'bg-linear-to-br from-rose-50 via-pink-50 to-purple-50'}`}
    >
      {/* Compact top bar */}
      <nav className="sticky top-0 z-40 px-3 sm:px-4 pt-2 sm:pt-3">
        <div className={`max-w-7xl mx-auto ustwo-glass rounded-xl px-3 sm:px-4 py-2.5 relative z-10 ${isCinemaActive ? 'opacity-85' : ''}`}>
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
              disabled={isCinemaActive}
              className="ustwo-pill bg-white/80 outline-none max-w-[110px]"
            >
              <option value="cozy">Cozy</option>
              <option value="night">Late Night</option>
              <option value="playful">Playful</option>
              <option value="deep">Deep Talk</option>
              <option value="movie">Movie Night</option>
            </select>
            <button
              onClick={handleLogout}
              className="ustwo-brand-gradient text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition transform hover:scale-105 ustwo-soft-shadow"
            >
              Logout
            </button>
          </div>
        </div>

          <div className="grid grid-cols-5 gap-1 bg-white/70 rounded-lg p-1 border border-pink-100 mt-2">
            <button
              onClick={() => handleTabChange('chat')}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition ${
                activeTab === 'chat'
                  ? 'ustwo-brand-gradient text-white'
                  : 'text-gray-700 hover:bg-pink-50'
              }`}
            >
              💬 Chat
            </button>
            <button
              onClick={() => handleTabChange('canvas')}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition ${
                activeTab === 'canvas'
                  ? 'ustwo-brand-gradient text-white'
                  : 'text-gray-700 hover:bg-pink-50'
              }`}
            >
              🎨 Canvas
            </button>
            <button
              onClick={() => handleTabChange('memories')}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition ${
                activeTab === 'memories'
                  ? 'ustwo-brand-gradient text-white'
                  : 'text-gray-700 hover:bg-pink-50'
              }`}
            >
              📸 Memories
            </button>
            <button
              onClick={() => {
                handleTabChange('cinema');
                setHasCinemaInvite(false);
              }}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition relative ${
                activeTab === 'cinema'
                  ? 'ustwo-brand-gradient text-white'
                  : 'text-gray-700 hover:bg-pink-50'
              } ${hasCinemaInvite && activeTab !== 'cinema' ? 'animate-heartbeat' : ''}`}
            >
              🍿 Cinema
              {hasCinemaInvite && activeTab !== 'cinema' ? (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose-500" />
              ) : null}
            </button>
            <button
              onClick={() => handleTabChange('shopping')}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition ${
                activeTab === 'shopping'
                  ? 'ustwo-brand-gradient text-white'
                  : 'text-gray-700 hover:bg-pink-50'
              }`}
            >
              🛍️ Shopping
            </button>
          </div>
        </div>
      </nav>

      {/* Main Chat Container */}
      <div className={`flex-1 min-h-0 overflow-hidden relative z-10 px-3 sm:px-4 pb-3 sm:pb-4 pt-1 sm:pt-2 ${isCinemaActive ? 'pt-3 sm:pt-4' : ''}`}>
        <div className="h-full min-h-0 flex flex-col max-w-7xl mx-auto w-full">
          <div className="flex-1 min-h-0 overflow-hidden pt-1">
            {activeTab === 'chat' ? (
              <ChatWindow
                coupleId={coupleData._id}
                partnerName={partnerName}
                mood={mood}
                onOpenCanvas={() => handleTabChange('canvas')}
              />
            ) : activeTab === 'canvas' ? (
              <SharedCanvas
                coupleId={coupleData._id}
                mood={mood}
                onBackToChat={() => handleTabChange('chat')}
              />
            ) : activeTab === 'cinema' ? (
              <CinemaTheater
                coupleId={coupleData._id}
                user={user}
                coupleData={coupleData}
                partnerName={partnerName}
              />
            ) : activeTab === 'shopping' ? (
              <Shopping mood={mood} />
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
