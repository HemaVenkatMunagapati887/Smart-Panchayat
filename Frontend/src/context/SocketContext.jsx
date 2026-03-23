import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useApp } from './AppContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user, toast } = useApp();
    const [socket, setSocket] = useState(null);

    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        if (!user) return;

        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            // Join relevant rooms
            newSocket.emit('join_room', {
                userId: user.email,
                role: user.role
            });
        });

        newSocket.on('new_complaint', (complaint) => {
            if (user.role === 'admin' || user.role === 'staff') {
                if (complaint.priority === 'high') {
                    toast.error(`URGENT: ${complaint.title}`);
                } else {
                    toast.success(`New Complaint: ${complaint.title}`);
                }
            }
        });

        newSocket.on('status_update', (data) => {
            toast.info(`${data.message}`);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    return useContext(SocketContext);
};
