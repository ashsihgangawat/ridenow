import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRideRoom: (rideId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinRideRoom: () => {}
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    // Initialize Socket connection
    const newSocket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (user) {
        newSocket.emit('join_user', {
          userId: user.id,
          role: user.role,
          driverId: user.driverProfile?.id
        });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const joinRideRoom = (rideId: string) => {
    if (socket && rideId) {
      socket.emit('join_ride', { rideId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinRideRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

