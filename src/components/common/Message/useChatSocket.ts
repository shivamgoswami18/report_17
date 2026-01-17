import { errorHandler } from "@/components/constants/Common";
import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { BaseWebSocketURL } from "@/lib/api/ApiService";

export interface Message {
  _id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  type: string;
  image?: string;
  status?: string;
  createdAt: string;
}

export interface UseChatSocketOptions {
  chatId: string | null;
  userId: string | null;
  onMessage?: (message: Message) => void;
  onHistory?: (messages: Message[]) => void;
  onTyping?: (userId: string) => void;
  onStoppedTyping?: (userId: string) => void;
}

export const useChatSocket = ({
  chatId,
  userId,
  onMessage,
  onHistory,
  onTyping,
  onStoppedTyping,
}: UseChatSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Connect to socket
  const connect = useCallback(() => {
    if (!chatId || !userId) {
      setIsConnected(false);
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    const wsUrl = BaseWebSocketURL;
    if (!wsUrl) {
      setIsConnected(false);
      return;
    }

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current?.disconnect();
      socketRef.current = null;
    }

    // Create new socket connection with chat_id as query param
    socketRef.current = io(wsUrl, {
      query: {
        chat_id: chatId,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    const socket = socketRef.current;

    // Connection event
    socket.on("connect", () => {
      setIsConnected(true);
    });

    // Disconnect event
    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Receive message event
    socket.on("receivedMessage", (message: Message) => {
      onMessage?.(message);
    });

    // Chat history event
    socket.on("chatHistory", (messages: Message[]) => {
      onHistory?.(messages);
    });

    // User typing event
    socket.on("userTyping", (data: { sender: string }) => {
      if (data.sender !== userId) {
        onTyping?.(data.sender);
      }
    });

    // User stopped typing event
    socket.on("userStoppedTyping", (data: { sender: string }) => {
      if (data.sender !== userId) {
        onStoppedTyping?.(data.sender);
      }
    });

    // Error handling - Built-in Socket.IO client event (not a server event)
    // Fires when client cannot connect to server (wrong URL, server down, network issues, etc.)
    socket.on("connect_error", (error) => {
      errorHandler(error);
      setIsConnected(false);
    });
  }, [chatId, userId, onMessage, onHistory, onTyping, onStoppedTyping]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(
    (message: string, type: string = "normal", image: string = "") => {
      if (!socketRef.current?.connected || !chatId || !userId) {
        return false;
      }

      socketRef.current?.emit("sendMessage", {
        chat_id: chatId,
        sender: userId,
        message,
        type,
        image,
      });

      return true;
    },
    [chatId, userId]
  );

  // Request chat history
  const requestChatHistory = useCallback(
    (search?: string) => {
      if (!socketRef.current?.connected || !chatId) {
        return;
      }

      const payload: { chat_id: string; search?: string } = { chat_id: chatId };
      if (search?.trim()) {
        payload.search = search.trim();
      }

      socketRef.current?.emit("chatHistory", payload);
    },
    [chatId]
  );

  // Send typing indicator
  const sendTyping = useCallback(() => {
    if (!socketRef.current?.connected || !chatId || !userId) {
      return;
    }

    socketRef.current?.emit("userTyping", {
      chat_id: chatId,
      sender: userId,
    });
  }, [chatId, userId]);

  // Send stopped typing indicator
  const sendStoppedTyping = useCallback(() => {
    if (!socketRef.current?.connected || !chatId || !userId) {
      return;
    }

    socketRef.current?.emit("userStoppedTyping", {
      chat_id: chatId,
      sender: userId,
    });
  }, [chatId, userId]);

  // Connect when chatId or userId changes
  useEffect(() => {
    if (chatId && userId) {
      connect();
    } else {
      setIsConnected(false);
    }

    return () => {
      disconnect();
    };
  }, [chatId, userId, connect, disconnect]);

  return {
    connect,
    disconnect,
    sendMessage,
    requestChatHistory,
    sendTyping,
    sendStoppedTyping,
    isConnected,
  };
};
