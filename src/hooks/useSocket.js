import { useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';

let socketInstance = null;

export const useSocket = () => {
  const { token } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      setSocket(null);
      return;
    }

    // Create socket connection if not already connected
    if (!socketInstance) {
      socketInstance = io('http://localhost:5001', {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socketInstance.on('connect', () => {
        console.log('✅ Socket.io connected');
      });

      socketInstance.on('connect_error', (error) => {
        console.error('❌ Socket.io connection error:', error);
      });

      socketInstance.on('disconnect', () => {
        console.log('🔌 Socket.io disconnected');
      });

      setSocket(socketInstance);
    } else {
      setSocket(socketInstance);
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive for other components
    };
  }, [token]);

  return socket;
};
