"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import { io as ClientIO } from "socket.io-client";
import { Socket } from "socket.io";

type SocketContextType = {
    socket: any | null;
    isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<any | null>(null);
    const [isConnected, setConnected] = useState<boolean>(false);

    useEffect(() => {
        const socketInstance = new (ClientIO as any)(
            process.env.NEXT_PUBLIC_SITE_URL,
            {
                path: "/api/socket/io",
                addTrailingSlash: false,
            }
        );

        socketInstance.on("connect", () => {
            setConnected(true);
        });

        socketInstance.on("disconnect", () => {
            setConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);
    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
