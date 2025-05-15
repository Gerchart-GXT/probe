// src/contexts/WebSocketContext.js
import React, { createContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

export const WebSocketContext = createContext({
  isConnected: false,
  serverData: [],
  socket: null
});

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [serverData, setServerData] = useState([]);
  const [lastReceived, setLastReceived] = useState(null); // 新增：记录最后接收时间
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) socketRef.current.close();
      return;
    }

    const wsUrl = `${process.env.REACT_APP_WS_URL}?user_id=${user.id}`;
    socketRef.current = io(wsUrl); // 使用Socket.IO客户端

    socketRef.current.on('connect', () => {
      setIsConnected(true);

      socketRef.current.emit('join', { roomId: user.id }); // 显式加入房间
    });

    socketRef.current.on('server_data', (data) => {
      console.log("Websocket received data");
      console.log(data);
      const newEntries = data.data; // 提取消息中的data数组
      setServerData(prev => [...newEntries, ...prev]); // 将每个服务器数据项推入数组
      setLastReceived(new Date().toISOString()); // 更新最后接收时间
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [user]);

  return (
    <WebSocketContext.Provider 
      value={{ 
        isConnected, 
        serverData, 
        lastReceived,
        socket: socketRef.current,
        reconnect: () => socketRef.current.connect() // 提供重连方法
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};