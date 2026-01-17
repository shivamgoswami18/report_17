"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  SearchIcon,
  AttachmentIcon,
  SendIcon,
  BackArrowIcon,
  CloseIcon,
  ChevronDownIcon,
} from "@/assets/icons/CommonIcons";
import user_image from "@/assets/images/user_dummy_image.png";
import chat_bg_image from "@/assets/images/chat_bg_image.jpg";
import dummy_file_image from "@/assets/images/dummy_file_image.png";
import BaseButton from "@/components/base/BaseButton";
import BaseInput from "@/components/base/BaseInput";
import BaseLoader from "@/components/base/BaseLoader";
import BaseFileUpload from "@/components/base/BaseFileUpload";
import TypingIndicator from "@/components/common/Message/TypingIndicator";
import { chatFormate } from "@/components/common/Message/chatFormate";
import SafeImage from "@/components/common/SafeImage";
import {
  useChatSocket,
  type Message as SocketMessage,
} from "@/components/common/Message/useChatSocket";
import {
  createChatSession,
  getChatList,
  type ChatContact,
} from "@/lib/api/ChatApi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { formatDistanceToNow, parseISO } from "date-fns";
import { store } from "@/lib/store/store";
import { ListOfReceivedOffer } from "@/lib/api/ProjectApi";
import { io, Socket } from "socket.io-client";
import {
  errorHandler,
  commonLabels,
  handleImagePreview,
} from "@/components/constants/Common";
import { BaseWebSocketURL, BaseImageURL } from "@/lib/api/ApiService";
import {
  escapeRegexSpecialChars,
  handleFileDownload,
} from "@/components/constants/Validation";
import { getTranslationSync } from "@/i18n/i18n";
import { UploadFile } from "@/lib/api/UserApi";

interface Message {
  id: string;
  text: string;
  isOutgoing: boolean;
  timestamp: string;
  createdAt?: string;
  type?: string;
  image?: string;
  isImage?: boolean;
}

const t = (key: string, params?: Record<string, string>) => {
  return getTranslationSync(key, params);
};

export default function Messages() { // NOSONAR – Complex UI state handling, refactor risks breaking chat behavior
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.user.profile?._id ?? null);
  const searchParams = useSearchParams();
  const businessIdFromUrl = searchParams.get("business_id");
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]); // Store all messages for search highlighting
  const [messageText, setMessageText] = useState<string>("");
  const [showChatView, setShowChatView] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingChats, setLoadingChats] = useState<boolean>(true);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState<boolean>(false);
  const [tempBusinessData, setTempBusinessData] = useState<{
    business_id: string;
    business_name: string;
    business_image: string | null;
  } | null>(null);
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [contactSearchQuery, setContactSearchQuery] = useState<string>("");
  const [isContactSearchVisible, setIsContactSearchVisible] =
    useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contactSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const messageInputAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const otherUserTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasProcessedBusinessIdRef = useRef<string | null>(null);
  const hasLoadedChatListRef = useRef<boolean>(false);
  const hasLoadedChatHistoryRef = useRef<string | null>(null);
  const scrollTimeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());
  const lastScrollHeightRef = useRef<number>(0);

  // Check if user is at the bottom of the scroll container
  const isAtBottom = useCallback((): boolean => {
    if (!messagesContainerRef.current) {
      return false;
    }
    const container = messagesContainerRef.current;
    const scrollHeight = container.scrollHeight;
    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;
    // Consider user at bottom if within 10px of the bottom (tolerance for rounding)
    const threshold = 10;
    return scrollHeight - scrollTop <= clientHeight + threshold;
  }, []);

  // Scroll to bottom - with image loading support (smooth scrolling)
  const scrollToBottom = useCallback(
    (instant: boolean = false) => {
      if (!messagesContainerRef.current) return;

      // Clear any existing scroll timeouts to prevent accumulation
      scrollTimeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      scrollTimeoutRefs.current.clear();

      const container = messagesContainerRef.current;
      const initialHeight = container.scrollHeight;
      lastScrollHeightRef.current = initialHeight;

      // Extended retry delays to handle slow image loading and content rendering
      // Increased to 6+ seconds to ensure all content loads before stopping scroll
      const retryDelays = [100, 300, 600, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000];

      const doInstantScroll = () => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
      };

      const performScroll = (
        useSmooth: boolean = false,
        force: boolean = false
      ) => {
        if (!messagesContainerRef.current) return;
        const cont = messagesContainerRef.current;
        const targetScrollHeight = cont.scrollHeight;
        const heightChanged =
          targetScrollHeight !== lastScrollHeightRef.current;

        // Only scroll if height changed, we're not at bottom, or forced
        const isCurrentlyAtBottom = isAtBottom();
        const shouldScroll = force || heightChanged || !isCurrentlyAtBottom;

        if (shouldScroll) {
          if (useSmooth && !instant) {
            cont.scrollTo({ top: targetScrollHeight, behavior: "smooth" });
          } else {
            // Use requestAnimationFrame for smoother updates
            requestAnimationFrame(doInstantScroll);
          }
          lastScrollHeightRef.current = targetScrollHeight;
        }
      };

      const handleRetryScroll = (index: number) => {
        if (!messagesContainerRef.current) return;

        const currentHeight = messagesContainerRef.current.scrollHeight;
        const heightChanged = currentHeight !== lastScrollHeightRef.current;

        // Only retry if height changed and we should still be at bottom
        if (heightChanged && (isAtBottom() || instant)) {
          // Use smooth scrolling only for first retry in non-instant mode
          const useSmooth = index === 0 && !instant;
          performScroll(useSmooth, false);
        }
      };

      const scheduleRetry = (delay: number, index: number) => {
        const timeoutId = setTimeout(() => {
          handleRetryScroll(index);
          scrollTimeoutRefs.current.delete(timeoutId);
        }, delay);
        scrollTimeoutRefs.current.add(timeoutId);
      };

      // Initial scroll - use smooth for non-instant mode
      if (instant) {
        requestAnimationFrame(() => performScroll(false, true));
      } else {
        performScroll(true, true);
      }

      // Schedule retries with debouncing - only if height actually changes
      retryDelays.forEach((delay, index) => scheduleRetry(delay, index));
    },
    [isAtBottom]
  );

  // Get Redux state for projects and offers
  const receivedOffers = useAppSelector(
    (state) => state.project?.receivedOffers
  );
  const currentProjectDetails = useAppSelector(
    (state) => state.project?.currentProjectDetails
  );

  // Helper function to check if two messages match
  const doMessagesMatch = useCallback(
    (msg1: Message, msg2: Message): boolean => {
      if (msg1.type === "images" && msg2.type === "images") {
        // For image/file messages, match by image path
        return msg1.image === msg2.image && msg2.isOutgoing;
      }
      if (msg1.type === "normal" && msg2.type === "normal") {
        // For text messages, match by text content
        return msg1.text === msg2.text && msg2.isOutgoing;
      }
      return false;
    },
    []
  );

  // Helper function to check if optimistic message matches any history message
  const isOptimisticMessageConfirmed = useCallback(
    (optMsg: Message, historyMessages: Message[]): boolean => {
      return historyMessages.some((histMsg) =>
        doMessagesMatch(optMsg, histMsg)
      );
    },
    [doMessagesMatch]
  );

  // Helper function to check if a message is a matching temp message
  const isMatchingTempMessage = useCallback(
    (msg: Message, uiMessage: Message): boolean => {
      if (
        !msg?.id?.startsWith("temp-") ||
        msg?.isOutgoing !== uiMessage?.isOutgoing
      ) {
        return false;
      }
      if (uiMessage?.type === "images" && msg?.type === "images") {
        return msg?.image === uiMessage?.image;
      }
      if (uiMessage?.type === "normal" && msg?.type === "normal") {
        return msg?.text === uiMessage?.text;
      }
      return false;
    },
    []
  );

  // Convert API message to UI message
  const convertSocketMessageToUIMessage = useCallback(
    (socketMessage: SocketMessage): Message => {
      const isOutgoing = socketMessage.sender_id === userId;
      const createdAt = socketMessage.createdAt
        ? parseISO(socketMessage.createdAt)
        : new Date();

      // If message is very recent (within last 1 minute), show "Now"
      const now = new Date();
      const diffInSeconds = Math.floor(
        (now.getTime() - createdAt.getTime()) / 1000
      );
      let timestamp: string;

      if (diffInSeconds < 60) {
        // Less than 1 minute old, show "Now"
        timestamp = "Now";
      } else {
        // Otherwise use formatDistanceToNow
        timestamp = formatDistanceToNow(createdAt, { addSuffix: true });
      }

      return {
        id: socketMessage._id,
        text: socketMessage.message ?? "",
        isOutgoing,
        timestamp,
        createdAt: socketMessage.createdAt,
        type: socketMessage.type ?? "normal",
        image: socketMessage.image,
        isImage:
          (socketMessage as SocketMessage & { isImage?: boolean }).isImage ??
          true,
      };
    },
    [userId]
  );

  // Handle temp business data cleanup when contact is found
  const handleTempBusinessDataCleanup = useCallback(
    (contacts: ChatContact[]) => {
      if (!tempBusinessData || !businessIdFromUrl) {
        return;
      }

      const foundContact = contacts?.find(
        (c) => c?.user_id === businessIdFromUrl
      );

      if (!foundContact) {
        return;
      }

      setTempBusinessData(null);
      // If chat is open with this business, update selectedContactId
      if (selectedChatId && !selectedContactId) {
        setSelectedContactId(foundContact?._id ?? null);
      }
    },
    [tempBusinessData, businessIdFromUrl, selectedChatId, selectedContactId]
  );

  // Load chat list
  const loadChatList = useCallback(
    async (search: string = "") => {
      if (hasLoadedChatListRef.current && !businessIdFromUrl && !search) {
        // Don't reload if already loaded and no business_id in URL and no search
        return;
      }

      setLoadingChats(true);
      try {
        const response = dispatch(
          getChatList({
            sortKey: "updatedAt",
            sortValue: "desc",
            page: 1,
            limit: 100000,
            search: search,
          })
        );

        // The thunk returns a promise, await it
        const result = await response;

        if (result?.items) {
          setContacts(result.items);
          hasLoadedChatListRef.current = true;

          // If we have tempBusinessData and now found the contact in list, clear temp data
          handleTempBusinessDataCleanup(result.items);
        } else {
          // If no data or empty response, set empty array
          setContacts([]);
          hasLoadedChatListRef.current = true;
        }
      } catch (error) {
        errorHandler(error);
      } finally {
        setLoadingChats(false);
      }
    },
    [dispatch, businessIdFromUrl, handleTempBusinessDataCleanup]
  );

  // Handle received message
  const handleReceivedMessage = useCallback(
    (socketMessage: SocketMessage) => {
      if (socketMessage.chat_id === selectedChatId) {
        const uiMessage = convertSocketMessageToUIMessage(socketMessage);

        // Remove any temporary optimistic messages that match this one
        setMessages((prev) => {
          // Remove temp messages that match this one
          // Match by text for normal messages, or by image path for image/file messages
          const filtered =
            prev?.filter((msg) => !isMatchingTempMessage(msg, uiMessage)) ?? [];

          // Check if message already exists (avoid duplicates)
          const exists =
            filtered?.some((msg) => msg?.id === uiMessage?.id) ?? false;
          if (exists) {
            return filtered;
          }

          return [...filtered, uiMessage];
        });

        // Also update allMessages
        setAllMessages((prev) => {
          const filtered =
            prev?.filter((msg) => !isMatchingTempMessage(msg, uiMessage)) ?? [];
          const exists =
            filtered?.some((msg) => msg?.id === uiMessage?.id) ?? false;
          if (exists) {
            return filtered;
          }
          return [...filtered, uiMessage];
        });
        // Only auto-scroll if user is already at bottom
        if (isAtBottom()) {
          scrollToBottom(false);
        }
      }

      // Update contact list: move contact to top and update lastMessage
      setContacts((prev) => {
        if (!prev) return [];

        const contactIndex = prev.findIndex(
          (contact) => contact?._id === socketMessage.chat_id
        );

        if (contactIndex === -1) {
          // Contact not found in list, return as is
          return prev;
        }

        // Get the contact
        const contact = prev[contactIndex];

        // Update contact with new message
        // If message type is "images", show the image value directly
        // If message type is "normal", show the message text
        let lastMessage = "";
        if (socketMessage.type === "images") {
          lastMessage = socketMessage.image ?? "Media";
        } else {
          // For "normal" type or other types, show the message text
          lastMessage = socketMessage.message ?? contact?.last_message ?? "";
        }

        const updatedContact: ChatContact = {
          ...contact,
          last_message: lastMessage,
        };

        // Remove contact from current position and add to top
        const newContacts = [...prev];
        newContacts.splice(contactIndex, 1);
        return [updatedContact, ...newContacts];
      });
    },
    [
      selectedChatId,
      convertSocketMessageToUIMessage,
      scrollToBottom,
      isAtBottom,
      isMatchingTempMessage,
    ]
  );

  // Handle chat history
  const handleChatHistory = useCallback(
    (historyMessages: SocketMessage[]) => {
      // Mark that chat history has been loaded for this chatId
      if (selectedChatId) {
        hasLoadedChatHistoryRef.current = selectedChatId;
      }

      const uiMessages =
        historyMessages?.map((msg) => convertSocketMessageToUIMessage(msg)) ??
        [];

      // Sort by createdAt
      uiMessages.sort((a, b) => {
        const timeA = a.createdAt ? parseISO(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? parseISO(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });

      // Preserve optimistic messages that haven't been confirmed yet
      setMessages((prevMessages) => {
        // Get optimistic messages (temp messages) that are outgoing
        const optimisticMessages =
          prevMessages?.filter(
            (msg) => msg?.id?.startsWith("temp-") && msg?.isOutgoing
          ) ?? [];

        // Check which optimistic messages are already in the history
        const confirmedOptimisticIds = optimisticMessages
          .filter((optMsg) => isOptimisticMessageConfirmed(optMsg, uiMessages))
          .map((msg) => msg.id);

        const confirmedOptimisticIdsSet = new Set(confirmedOptimisticIds);

        // Keep optimistic messages that haven't been confirmed yet
        const unconfirmedOptimistic = optimisticMessages.filter(
          (msg) => !confirmedOptimisticIdsSet.has(msg.id)
        );

        // Merge history with unconfirmed optimistic messages
        const mergedMessages = [...uiMessages, ...unconfirmedOptimistic];

        // Sort merged messages by createdAt
        mergedMessages.sort((a, b) => {
          const timeA = a.createdAt ? parseISO(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? parseISO(b.createdAt).getTime() : 0;
          return timeA - timeB;
        });

        return mergedMessages;
      });

      // Update allMessages with history (without optimistic messages for search)
      setAllMessages(uiMessages);

      // Keep loading state until scroll completes - wait for DOM to render, then scroll instantly
      // Increased delay to allow more time for images to start loading before scrolling
      setTimeout(() => {
        scrollToBottom(true);
        // After scroll completes, hide loading
        // Give extra time for images to load before hiding loader - significantly increased delay for better UX
        setTimeout(() => {
          setLoading(false);
        }, 1500);
      }, 500);
    },
    [
      convertSocketMessageToUIMessage,
      selectedChatId,
      scrollToBottom,
      isOptimisticMessageConfirmed,
    ]
  );

  // Handle other user typing
  const handleOtherUserTyping = useCallback(() => {
    setIsOtherUserTyping(true);

    // Clear existing timeout
    if (otherUserTypingTimeoutRef.current) {
      clearTimeout(otherUserTypingTimeoutRef.current);
    }

    // Auto-hide typing indicator after 3 seconds if no stoppedTyping event received
    otherUserTypingTimeoutRef.current = setTimeout(() => {
      setIsOtherUserTyping(false);
    }, 3000);
  }, []);

  // Handle other user stopped typing
  const handleOtherUserStoppedTyping = useCallback(() => {
    setIsOtherUserTyping(false);

    // Clear timeout since we got explicit stoppedTyping event
    if (otherUserTypingTimeoutRef.current) {
      clearTimeout(otherUserTypingTimeoutRef.current);
      otherUserTypingTimeoutRef.current = null;
    }
  }, []);

  // WebSocket hook
  const {
    sendMessage: sendSocketMessage,
    requestChatHistory,
    sendTyping,
    sendStoppedTyping,
    isConnected,
  } = useChatSocket({
    chatId: selectedChatId,
    userId,
    onMessage: handleReceivedMessage,
    onHistory: handleChatHistory,
    onTyping: handleOtherUserTyping,
    onStoppedTyping: handleOtherUserStoppedTyping,
  });

  // Global WebSocket connections to listen to all chats
  const chatSocketsRef = useRef<Map<string, Socket>>(new Map());

  useEffect(() => {
    if (!userId || contacts.length === 0) return;

    // Capture ref value at the start to avoid stale closure
    const chatSockets = chatSocketsRef.current;
    const currentSelectedChatId = selectedChatId;

    const wsUrl = BaseWebSocketURL;
    if (!wsUrl) {
      return;
    }

    // Connect to all chats in the contact list
    contacts?.forEach((contact) => {
      if (!contact?._id) return;

      // Skip if already connected to this chat
      if (chatSockets.has(contact?._id)) return;

      // Skip if this is the currently selected chat (it has its own connection)
      if (contact?._id === currentSelectedChatId) return;

      // Create socket connection for this chat
      const socket = io(wsUrl, {
        query: {
          chat_id: contact?._id ?? "",
        },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      // Store socket reference
      chatSockets.set(contact?._id ?? "", socket);

      // Listen to messages from this chat
      socket.on("receivedMessage", (message: SocketMessage) => {
        // Handle message - this will update the contact list
        handleReceivedMessage(message);
      });

      socket.on("connect", () => {
        // Connected to chat for listening
      });

      socket.on("connect_error", (error) => {
        errorHandler(error);
      });
    });

    // Cleanup: disconnect from chats that are no longer in the contact list
    const currentChatIds = new Set(
      contacts?.map((c) => c?._id).filter(Boolean) ?? []
    );
    chatSockets.forEach((socket, chatId) => {
      // Don't disconnect if it's the selected chat (handled by useChatSocket)
      if (chatId === currentSelectedChatId) return;

      // Disconnect if chat is no longer in contact list
      if (!currentChatIds.has(chatId)) {
        socket.disconnect();
        chatSockets.delete(chatId);
      }
    });

    return () => {
      // Cleanup on unmount - use captured variables
      const socketsToCleanup = new Map(chatSockets);

      socketsToCleanup.forEach((socket, chatId) => {
        // Don't disconnect the selected chat (handled by useChatSocket)
        if (chatId !== currentSelectedChatId) {
          socket.disconnect();
          chatSockets.delete(chatId);
        }
      });
    };
  }, [userId, contacts, selectedChatId, handleReceivedMessage]);

  // Load chat list on mount
  useEffect(() => {
    if (userId && !hasLoadedChatListRef.current) {
      loadChatList();
    }
  }, [userId, loadChatList]);

  // Fetch business data from Redux or API
  const fetchBusinessData = useCallback(
    async (businessId: string) => {
      // First try to get from Redux receivedOffers
      if (receivedOffers?.items) {
        const businessOffer = receivedOffers.items?.find(
          (offer) => offer?.business_id === businessId
        );
        if (businessOffer?.business_id) {
          setTempBusinessData({
            business_id: businessOffer.business_id,
            business_name: businessOffer.business_name ?? "",
            business_image: businessOffer.business_image ?? null,
          });
          return;
        }
      }

      // If not found in Redux, try to fetch from API using Redux action
      const projectId = currentProjectDetails?._id;
      if (projectId) {
        await dispatch(
          ListOfReceivedOffer({
            projectId,
            payload: {
              sortKey: "_id",
              sortValue: "desc",
              page: 1,
              limit: 100000,
            },
          })
        );

        // Read updated data from Redux store after dispatch
        const updatedOffers = store.getState()?.project?.receivedOffers;
        if (updatedOffers?.items) {
          const businessOffer = updatedOffers.items?.find(
            (offer) => offer?.business_id === businessId
          );
          if (businessOffer?.business_id) {
            setTempBusinessData({
              business_id: businessOffer.business_id,
              business_name: businessOffer.business_name ?? "",
              business_image: businessOffer.business_image ?? null,
            });
            return;
          }
        }
      }

      // If still not found, set default values
      setTempBusinessData({
        business_id: businessId,
        business_name: "",
        business_image: null,
      });
    },
    [receivedOffers, currentProjectDetails, dispatch]
  );

  // Handle business_id from URL - start chat with that business
  useEffect(() => {
    // Reset if business_id changed
    if (
      businessIdFromUrl &&
      hasProcessedBusinessIdRef.current !== businessIdFromUrl
    ) {
      hasProcessedBusinessIdRef.current = null;
      setTempBusinessData(null); // Clear previous temp data
    }

    const startChatWithBusiness = async () => {
      if (
        !businessIdFromUrl ||
        !userId ||
        loadingChats ||
        hasProcessedBusinessIdRef.current === businessIdFromUrl
      )
        return;

      // Mark as processed to prevent re-running
      hasProcessedBusinessIdRef.current = businessIdFromUrl;

      // Check if contact already exists in the list (match by user_id from API)
      const existingContact = contacts?.find(
        (c) => c?.user_id === businessIdFromUrl
      );

      if (existingContact) {
        // Contact exists, open the chat directly - NO NEED TO CALL createSession
        setTempBusinessData(null); // Clear temp data since we have a contact
        setSelectedContactId(existingContact?._id ?? null);
        setShowChatView(true);
        setMessages([]);
        setLoading(true);

        try {
          // Use the _id from the existing contact (which is the chat_id from API)
          const chatId = existingContact?._id;
          if (chatId) {
            setSelectedChatId(chatId);
            // Loading will be set to false when chat history loads
          } else {
            setLoading(false);
          }
        } catch (error) {
          errorHandler(error);
          setLoading(false);
        }
      } else {
        // Contact doesn't exist, fetch business data and create session
        await fetchBusinessData(businessIdFromUrl);

        // Create new chat session with the business
        setLoading(true);
        setShowChatView(true);
        try {
          const response = dispatch(
            createChatSession({
              receiver_id: businessIdFromUrl,
            })
          );

          const sessionData = await response;

          if (sessionData?.id) {
            // Reload chat list to get the new contact (only once)
            hasLoadedChatListRef.current = false;
            await loadChatList();
            setSelectedChatId(sessionData?.id);
            // Loading will be set to false when chat history loads
            // Temp business data will be cleared when contact is added to list
          } else {
            setLoading(false);
          }
        } catch (error) {
          errorHandler(error);
          setLoading(false);
        }
      }
    };

    // Only run if we have contacts loaded (or empty array) and haven't processed this business_id yet
    if (
      businessIdFromUrl &&
      userId &&
      !loadingChats &&
      hasLoadedChatListRef.current
    ) {
      startChatWithBusiness();
    }
  }, [
    businessIdFromUrl,
    userId,
    loadingChats,
    contacts,
    fetchBusinessData,
    dispatch,
    loadChatList,
  ]);

  // Handle contact click
  const handleContactClick = useCallback(
    async (contact: ChatContact) => {
      setSelectedContactId(contact._id);
      setShowChatView(true);
      setMessages([]);
      setMessageText("");
      setLoading(true);

      // Clear typing timeouts when switching chats
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      try {
        // Check if chat session exists, if not create one
        let chatId = contact._id;

        if (!chatId) {
          // Create new chat session
          const response = dispatch(
            createChatSession({
              receiver_id: contact?.user_id ?? "",
            })
          );

          // The thunk returns a promise, await it
          const sessionData = await response;

          if (sessionData?.id) {
            chatId = sessionData.id;
            // Update contact with new chatId (update _id)
            setContacts(
              (prev) =>
                prev?.map((c) =>
                  c?._id === contact?._id ? { ...c, _id: chatId } : c
                ) ?? []
            );
          }
        }

        setSelectedChatId(chatId);
      } catch (error) {
        errorHandler(error);
      } finally {
        setLoading(false);
      }
    },
    [dispatch]
  );

  // Clear all timeout refs
  const clearAllTimeouts = useCallback(() => {
    if (otherUserTypingTimeoutRef.current) {
      clearTimeout(otherUserTypingTimeoutRef.current);
      otherUserTypingTimeoutRef.current = null;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    if (contactSearchTimeoutRef.current) {
      clearTimeout(contactSearchTimeoutRef.current);
      contactSearchTimeoutRef.current = null;
    }
    // Clear all scroll timeout refs
    scrollTimeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    scrollTimeoutRefs.current.clear();
  }, []);

  // Request chat history when chatId changes
  useEffect(() => {
    if (selectedChatId && isConnected) {
      // Reset history loaded flag when chatId changes
      hasLoadedChatHistoryRef.current = null;
      setIsOtherUserTyping(false);
      setMessageText("");
      setLoading(true);
      // Reset search when switching chats
      setIsSearchMode(false);
      setSearchQuery("");
      setShowScrollToBottom(false);

      // Clear typing timeouts when switching chats
      clearAllTimeouts();

      // Small delay to ensure socket is ready
      setTimeout(() => {
        requestChatHistory();
      }, 500);
    } else if (!selectedChatId) {
      // Reset when no chat selected
      hasLoadedChatHistoryRef.current = null;
      setMessages([]);
      setAllMessages([]);
      setMessageText("");
      setIsOtherUserTyping(false);
      setLoading(false);
      setIsSearchMode(false);
      setSearchQuery("");
      setShowScrollToBottom(false);

      // Clear typing timeouts
      clearAllTimeouts();
    }
  }, [selectedChatId, isConnected, requestChatHistory, clearAllTimeouts]);

  // Scroll to bottom when typing indicator appears
  useEffect(() => {
    if (isOtherUserTyping && !loading) {
      // Small delay to ensure typing indicator is rendered in DOM
      const timer = setTimeout(() => {
        scrollToBottom(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOtherUserTyping, scrollToBottom, loading]);

  // Scroll to bottom when messages change (only for outgoing messages or if user is at bottom)
  // Skip during initial load - handleChatHistory handles that
  // This handles edge cases where optimistic messages need scrolling
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      // Check if the last message is outgoing (user sent it) - always show own messages
      const lastMessage = messages.at(-1);
      const isLastMessageOutgoing = lastMessage?.isOutgoing ?? false;

      // Only auto-scroll if:
      // 1. Last message is outgoing (user wants to see their own message), OR
      // 2. User is already at bottom (don't interrupt if reading old messages)
      if (isLastMessageOutgoing || isAtBottom()) {
        scrollToBottom(false);
      }
    }
  }, [messages, scrollToBottom, loading, isAtBottom]);

  // Scroll to bottom instantly when chat view opens or chat changes
  useEffect(() => {
    if (showChatView && selectedChatId && messages.length > 0 && !loading) {
      // Small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        scrollToBottom(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [showChatView, selectedChatId, loading, messages.length, scrollToBottom]);

  // Set chat background image CSS variable
  useEffect(() => {
    if (chat_bg_image?.src) {
      const bgImage = `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url(${chat_bg_image.src})`;
      if (messagesContainerRef.current) {
        messagesContainerRef.current.style.setProperty(
          "--chat-bg-image",
          bgImage
        );
      }
      if (messageInputAreaRef.current) {
        messageInputAreaRef.current.style.setProperty(
          "--chat-bg-image",
          bgImage
        );
      }
    }
  }, [showChatView]);

  // Handle scroll detection for scroll-to-bottom button
  useEffect(() => {
    if (!showChatView) {
      setShowScrollToBottom(false);
      return;
    }

    const container = messagesContainerRef.current;
    
    if (!container) {
      setShowScrollToBottom(false);
      return;
    }

    const checkScrollPosition = () => {
      if (!container) {
        setShowScrollToBottom(false);
        return;
      }
      
      // Don't show button if loading or no messages
      if (loading || messages.length === 0) {
        setShowScrollToBottom(false);
        return;
      }
      
      const scrollHeight = container.scrollHeight;
      const scrollTop = container.scrollTop;
      const clientHeight = container.clientHeight;
      
      // Check if container is scrollable (has overflow)
      const isScrollable = scrollHeight > clientHeight;
      
      if (!isScrollable) {
        setShowScrollToBottom(false);
        return;
      }
      
      // Check if user is at bottom (within 50px threshold for better UX)
      const threshold = 50;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const atBottom = distanceFromBottom <= threshold;
      
      setShowScrollToBottom(!atBottom);
    };

    // Use passive listener for better performance
    container.addEventListener("scroll", checkScrollPosition, { passive: true });
    
    // Check initial state with delays to handle async rendering
    const timeouts: NodeJS.Timeout[] = [];
    [100, 300, 500, 800].forEach((delay) => {
      timeouts.push(setTimeout(checkScrollPosition, delay));
    });
    
    // Also check when container resizes
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(checkScrollPosition, 50);
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      timeouts.forEach(clearTimeout);
      resizeObserver.disconnect();
    };
  }, [showChatView, loading, messages.length, selectedChatId]);

  // Update scroll button visibility when messages change or after scroll completes
  useEffect(() => {
    if (!messagesContainerRef.current || !showChatView) {
      return;
    }

    const container = messagesContainerRef.current;
    
    const checkScrollPosition = () => {
      if (!container || loading || messages.length === 0) {
        setShowScrollToBottom(false);
        return;
      }
      
      const scrollHeight = container.scrollHeight;
      const scrollTop = container.scrollTop;
      const clientHeight = container.clientHeight;
      
      const isScrollable = scrollHeight > clientHeight;
      if (!isScrollable) {
        setShowScrollToBottom(false);
        return;
      }
      
      const threshold = 50;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const atBottom = distanceFromBottom <= threshold;
      
      setShowScrollToBottom(!atBottom);
    };

    // Check multiple times to catch DOM updates
    const timeouts: NodeJS.Timeout[] = [];
    [100, 300, 500, 1000].forEach((delay) => {
      timeouts.push(setTimeout(checkScrollPosition, delay));
    });
    
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [messages, showChatView, loading, selectedChatId]);

  // Handle image loading - re-scroll when images load (ResizeObserver detects size changes)
  useEffect(() => {
    if (!messagesContainerRef.current || messages.length === 0 || loading)
      return;

    const container = messagesContainerRef.current;
    let previousHeight = container.scrollHeight;
    let scrollTimeoutId: NodeJS.Timeout | null = null;
    let isScrolling = false;

    const resetScrollingFlag = () => {
      isScrolling = false;
    };

    const doScroll = (cont: HTMLElement) => {
      if (cont && !isScrolling) {
        isScrolling = true;
        cont.scrollTop = cont.scrollHeight;
        // Reset scrolling flag after animation completes
        setTimeout(resetScrollingFlag, 100);
      }
    };

    const performScroll = () => {
      if (!messagesContainerRef.current || isScrolling) return;
      const cont = messagesContainerRef.current;
      // Use requestAnimationFrame for smoother scrolling instead of direct assignment
      requestAnimationFrame(() => doScroll(cont));
    };

    const handleDelayedScroll = (lastMessage: Message | undefined) => {
      if (
        messagesContainerRef.current &&
        (lastMessage?.isOutgoing || isAtBottom())
      ) {
        performScroll();
      }
    };

    const checkAndScroll = () => {
      if (!messagesContainerRef.current) return;

      const currentHeight = messagesContainerRef.current.scrollHeight;
      const lastMessage = messages.at(-1);
      const heightChanged = currentHeight > previousHeight;
      const shouldScroll =
        heightChanged && (lastMessage?.isOutgoing || isAtBottom());

      if (shouldScroll) {
        // Debounce scroll attempts to prevent flickering
        if (scrollTimeoutId) clearTimeout(scrollTimeoutId);

        // Immediate smooth scroll
        performScroll();

        // Single debounced retry for layout stabilization - significantly increased delay for better stability
        scrollTimeoutId = setTimeout(
          () => handleDelayedScroll(lastMessage),
          500
        );
      }

      previousHeight = currentHeight;
    };

    const resizeObserver = new ResizeObserver(checkAndScroll);
    resizeObserver.observe(container);

    return () => {
      if (scrollTimeoutId) clearTimeout(scrollTimeoutId);
      resizeObserver.disconnect();
      isScrolling = false;
    };
  }, [messages, loading, isAtBottom]);

  // Handle back to contacts
  const handleBackToContacts = () => {
    setShowChatView(false);
    setSelectedContactId(null);
    setSelectedChatId(null);
    setMessages([]);
    setAllMessages([]);
    setMessageText("");
    setTempBusinessData(null);
    setIsOtherUserTyping(false);
    hasLoadedChatHistoryRef.current = null;
    setLoading(false);
    setIsSearchMode(false);
    setSearchQuery("");
    setShowScrollToBottom(false);

    // Clear typing timeouts
    if (otherUserTypingTimeoutRef.current) {
      clearTimeout(otherUserTypingTimeoutRef.current);
      otherUserTypingTimeoutRef.current = null;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  };

  // Group messages by date
  const groupedMessages = () => {
    const groups: { date: string; messages: Message[]; id: string }[] = [];
    let currentDate = "";
    let currentGroup: Message[] = [];

    messages?.forEach((message) => {
      // Use createdAt ISO string for date grouping, not the formatted timestamp
      const messageDate = chatFormate(message?.createdAt);

      if (messageDate === currentDate) {
        currentGroup.push(message);
      } else {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate,
            messages: currentGroup,
            id: `${currentDate}-${currentGroup[0]?.id ?? Date.now()}`,
          });
        }
        currentDate = messageDate;
        currentGroup = [message];
      }
    });

    if (currentGroup.length > 0) {
      groups.push({
        date: currentDate,
        messages: currentGroup,
        id: `${currentDate}-${currentGroup[0]?.id ?? Date.now()}`,
      });
    }

    return groups;
  };

  // Handle file selection (images or files)
  const handleFileSelect = useCallback(
    async (file: File | null) => {
      if (!file) {
        return;
      }

      // Determine if it's an image or file (for UI display)
      const isImage = file.type.startsWith("image/");
      // Always use "images" type for both images and files
      const messageType = "images";

      // Create immediate preview URL for instant UI display
      const previewUrl = URL.createObjectURL(file);
      const tempMessageId = `temp-${Date.now()}`;

      // Clear other user's typing indicator when sending a message
      setIsOtherUserTyping(false);
      if (otherUserTypingTimeoutRef.current) {
        clearTimeout(otherUserTypingTimeoutRef.current);
        otherUserTypingTimeoutRef.current = null;
      }

      // Send stopped typing event since we're sending the message
      sendStoppedTyping();

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Optimistically add message to UI immediately with preview URL
      const optimisticMessage: Message = {
        id: tempMessageId,
        text: "",
        isOutgoing: true,
        timestamp: "Now",
        createdAt: new Date().toISOString(),
        type: messageType,
        image: previewUrl, // Use preview URL for instant display
        isImage: isImage,
      };
      setMessages((prev) => [...prev, optimisticMessage]);
      setAllMessages((prev) => [...prev, optimisticMessage]);
      scrollToBottom();

      setUploadingImage(true);
      try {
        // Upload file in background
        const filePath = await dispatch(UploadFile(file));

        // Clean up preview URL
        URL.revokeObjectURL(previewUrl);

        if (filePath && selectedChatId && isConnected) {
          // Update optimistic message with server URL
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempMessageId ? { ...msg, image: filePath } : msg
            )
          );
          setAllMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempMessageId ? { ...msg, image: filePath } : msg
            )
          );

          // Send message via WebSocket with type "images" and file name
          const success = sendSocketMessage("", messageType, filePath);

          if (success) {
            // Update contact list: move contact to top and update lastMessage
            setContacts((prev) => {
              if (!prev) return [];

              const contactIndex = prev.findIndex(
                (contact) => contact?._id === selectedChatId
              );

              if (contactIndex === -1) {
                return prev;
              }

              const contact = prev[contactIndex];
              const updatedContact: ChatContact = {
                ...contact,
                last_message: filePath ?? "Media",
              };

              const newContacts = [...prev];
              newContacts.splice(contactIndex, 1);
              return [updatedContact, ...newContacts];
            });

            // Request chat history after a delay to sync with server
            // Use longer delay for file/image messages to ensure server has processed them
            setTimeout(() => {
              if (isConnected && selectedChatId) {
                requestChatHistory();
              }
            }, 1500);
          } else {
            // Remove optimistic message if send failed
            setMessages(
              (prev) => prev?.filter((msg) => msg.id !== tempMessageId) ?? []
            );
            setAllMessages(
              (prev) => prev?.filter((msg) => msg.id !== tempMessageId) ?? []
            );
          }
        } else {
          // Remove optimistic message if upload failed
          setMessages(
            (prev) => prev?.filter((msg) => msg.id !== tempMessageId) ?? []
          );
          setAllMessages(
            (prev) => prev?.filter((msg) => msg.id !== tempMessageId) ?? []
          );
        }
      } catch (error) {
        // Clean up preview URL on error
        URL.revokeObjectURL(previewUrl);
        // Remove optimistic message on error
        setMessages(
          (prev) => prev?.filter((msg) => msg.id !== tempMessageId) ?? []
        );
        setAllMessages(
          (prev) => prev?.filter((msg) => msg.id !== tempMessageId) ?? []
        );
        errorHandler(error);
      } finally {
        setUploadingImage(false);
      }
    },
    [
      dispatch,
      selectedChatId,
      isConnected,
      sendSocketMessage,
      requestChatHistory,
      scrollToBottom,
      sendStoppedTyping,
    ]
  );

  // Handle send message
  const handleSendMessage = useCallback(async () => {
    if (
      !messageText.trim() ||
      !selectedChatId ||
      sendingMessage ||
      !isConnected
    ) {
      return;
    }

    const messageToSend = messageText.trim();
    setMessageText("");
    setSendingMessage(true);

    // Clear other user's typing indicator when sending a message
    setIsOtherUserTyping(false);
    if (otherUserTypingTimeoutRef.current) {
      clearTimeout(otherUserTypingTimeoutRef.current);
      otherUserTypingTimeoutRef.current = null;
    }

    // Send stopped typing event since we're sending the message
    sendStoppedTyping();

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    try {
      // Optimistically add message to UI immediately (so sender sees it right away)
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        text: messageToSend,
        isOutgoing: true,
        timestamp: "Now",
        createdAt: new Date().toISOString(),
        type: "normal",
      };
      setMessages((prev) => [...prev, optimisticMessage]);
      setAllMessages((prev) => [...prev, optimisticMessage]);
      scrollToBottom();

      // Send message via WebSocket
      const success = sendSocketMessage(messageToSend, "normal", "");

      if (success) {
        // Update contact list: move contact to top and update lastMessage (like WhatsApp)
        setContacts((prev) => {
          if (!prev) return [];

          const contactIndex = prev.findIndex(
            (contact) => contact?._id === selectedChatId
          );

          if (contactIndex === -1) {
            // Contact not found, return as is
            return prev;
          }

          // Get the contact
          const contact = prev[contactIndex];

          // Update contact with new message
          const updatedContact: ChatContact = {
            ...contact,
            last_message: messageToSend ?? "",
          };

          // Remove contact from current position and add to top
          const newContacts = [...prev];
          newContacts.splice(contactIndex, 1);
          return [updatedContact, ...newContacts];
        });

        // Request chat history after a short delay to sync with server
        setTimeout(() => {
          if (isConnected && selectedChatId) {
            requestChatHistory();
          }
        }, 500);
      } else {
        // Remove optimistic message if send failed
        setMessages(
          (prev) => prev?.filter((msg) => msg.id !== optimisticMessage.id) ?? []
        );
        setMessageText(messageToSend); // Restore message if failed
      }
    } catch (error) {
      errorHandler(error);
      // Remove optimistic message on error
      setMessages(
        (prev) => prev?.filter((msg) => msg?.id?.startsWith("temp-")) ?? []
      );
      setMessageText(messageToSend); // Restore message if failed
    } finally {
      setSendingMessage(false);
    }
  }, [
    messageText,
    selectedChatId,
    sendSocketMessage,
    sendingMessage,
    isConnected,
    requestChatHistory,
    scrollToBottom,
    sendStoppedTyping,
  ]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    if (e.target.value.trim() && selectedChatId) {
      sendTyping();
    }

    // Send stopped typing after 2 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedChatId) {
        sendStoppedTyping();
      }
    }, 2000);
  };

  // Handle Enter key
  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Highlight search terms in text
  const highlightSearchText = useCallback(
    (text: string, searchQuery: string) => {
      if (!searchQuery.trim()) {
        return <>{text}</>;
      }

      const escapedQuery = searchQuery.replace(
        escapeRegexSpecialChars,
        String.raw`\$&`
      );
      const regex = new RegExp(`(${escapedQuery})`, "gi");
      const parts = text.split(regex);
      const searchLower = searchQuery.toLowerCase();

      return (
        <>
          {parts.map((part, idx) => {
            // Check if this part matches the search (case-insensitive)
            if (part.toLowerCase() === searchLower) {
              return (
                <mark
                  key={`highlight-${part}-${idx}-${text.length}`}
                  className="bg-yellowPrimary px-0 py-0 rounded-[2px]"
                >
                  {part}
                </mark>
              );
            }
            return (
              <span key={`text-${part}-${idx}-${text.length}`}>{part}</span>
            );
          })}
        </>
      );
    },
    []
  );

  // Check if message matches search query
  const messageMatchesSearch = (
    message: Message,
    searchQuery: string
  ): boolean => {
    if (!searchQuery.trim()) {
      return false;
    }
    return (
      message?.text?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
    );
  };

  // Handle contact search input change with debounce
  const handleContactSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const query = e.target.value;
    setContactSearchQuery(query);

    // Clear existing timeout
    if (contactSearchTimeoutRef.current) {
      clearTimeout(contactSearchTimeoutRef.current);
    }

    // Debounce the API call
    contactSearchTimeoutRef.current = setTimeout(() => {
      hasLoadedChatListRef.current = false; // Allow reload when searching
      loadChatList(query);
    }, 300);
  };

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // For local highlighting, we don't need to call API
    // Just update the search query and messages will be highlighted
    searchTimeoutRef.current = setTimeout(() => {
      // Keep all messages but they will be highlighted in render
      setMessages(allMessages);

      if (query.trim()) {
        // Scroll to first matching message
        const firstMatch = allMessages?.find((msg) =>
          messageMatchesSearch(msg, query)
        );
        if (firstMatch) {
          // Scroll to first match after a short delay
          setTimeout(() => {
            const element = document.getElementById(
              `message-${firstMatch?.id ?? ""}`
            );
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 100);
        }
      }
    }, 300);
  };

  // Handle search mode toggle
  const handleToggleSearch = () => {
    if (isSearchMode) {
      // Exit search mode
      setIsSearchMode(false);
      setSearchQuery("");
      // Restore all messages without highlighting
      setMessages(allMessages);
    } else {
      // Enter search mode
      setIsSearchMode(true);
    }
  };

  // Focus search input when search mode is enabled
  useEffect(() => {
    if (isSearchMode) {
      const input = document.querySelector(
        'input[name="message-search"]'
      ) as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }
  }, [isSearchMode]);

  // Focus contact search input when it becomes visible
  useEffect(() => {
    if (isContactSearchVisible) {
      const input = document.querySelector(
        'input[name="contact-search"]'
      ) as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }
  }, [isContactSearchVisible]);

  const selectedContact = contacts?.find((c) => c?._id === selectedContactId);

  // Render contacts list content
  const renderContactsListContent = () => {
    if (loadingChats) {
      return (
        <div className="flex justify-center items-center py-8">
          <BaseLoader />
        </div>
      );
    }

    if ((contacts?.length ?? 0) === 0) {
      return (
        <div className="flex justify-center items-center py-8">
          <p className="text-textSm text-obsidianBlack text-opacity-50">
            {t("chatPageConstants.noChatsYet")}
          </p>
        </div>
      );
    }

    return contacts?.map((contact) => (
      <BaseButton
        key={contact?._id}
        onClick={() => handleContactClick(contact)}
        className={`w-full gap-[5px] sm:gap-[7px] px-[10px] xxs:px-[20px] xs:px-[40px] md:px-[20px] py-[12px] sm:py-[14px] lg:py-[16px] rounded-none border-solid border-0 border-b border-graySoft border-opacity-50 flex items-center hover:bg-graySoft hover:bg-opacity-30 transition-colors justify-start ${
          selectedContactId === contact?._id
            ? "bg-graySoft bg-opacity-30"
            : "bg-transparent"
        }`}
      >
        <div className="relative w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] lg:w-[48px] lg:h-[48px] border-[2px] border-solid border-obsidianBlack border-opacity-20 rounded-full overflow-hidden flex-shrink-0">
          <SafeImage
            src={
              (handleImagePreview({ imagePath: contact?.profile_image }) ??
                user_image?.src) ||
              ""
            }
            alt={contact?.name ?? ""}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-textBase font-light text-obsidianBlack mb-[2px] sm:mb-[3px] truncate xl:leading-[100%] xl:tracking-[0px]">
              {contact?.name ?? ""}
            </h3>
          </div>
          <p className="text-textSm font-light text-obsidianBlack text-opacity-50 truncate xl:leading-[100%] xl:tracking-[0.3px]">
            {contact?.last_message ?? t("chatPageConstants.noMessagesYet")}
          </p>
        </div>
      </BaseButton>
    ));
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-[8px] sm:gap-[12px] lg:gap-[16px]">
      {/* Left Panel - Contacts List */}
      <div
        className={`w-full lg:w-[326px] flex flex-col bg-white md:rounded-[16px] ${
          showChatView ? "hidden lg:flex lg:h-auto" : "flex h-full lg:h-auto"
        }`}
      >
        {/* Contacts Header */}
        <div
          className={`border-solid border-t md:border-t-0 border-0 border-b border-graySoft border-opacity-50 px-[10px] xxs:px-[20px] xs:px-[40px] md:px-[20px] ${
            isContactSearchVisible
              ? "py-[4px] sm:py-[9px] md:py-[13px]"
              : "py-[12px] sm:py-[16px] md:py-[20px]"
          }`}
        >
          {isContactSearchVisible ? (
            <div className="flex items-center gap-[8px] sm:gap-[12px] w-full">
              <BaseButton
                onClick={() => {
                  setIsContactSearchVisible(false);
                  setContactSearchQuery("");
                  hasLoadedChatListRef.current = false;
                  loadChatList("");
                }}
                className="border-none bg-transparent p-1 flex-shrink-0"
                startIcon={
                  <BackArrowIcon size={20} className="text-obsidianBlack" />
                }
              />
              <div className="flex-1 relative">
                <BaseInput
                  name="contact-search"
                  type="text"
                  placeholder={t("chatPageConstants.searchContacts")}
                  value={contactSearchQuery}
                  onChange={handleContactSearchChange}
                  className="w-full px-3 sm:px-4 py-2 border border-graySoft border-opacity-50 rounded-full text-textBase text-obsidianBlack placeholder-stoneGray ring-0"
                />
                {contactSearchQuery && (
                  <BaseButton
                    onClick={() => {
                      setContactSearchQuery("");
                      hasLoadedChatListRef.current = false;
                      loadChatList("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 border-none bg-transparent p-1"
                    startIcon={
                      <CloseIcon className="text-obsidianBlack w-[14px] h-[14px]" />
                    }
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <h2 className="text-textSm font-light text-opacity-50 text-obsidianBlack xl:leading-[100%] xl:tracking-[0.3px]">
                {t("chatPageConstants.contacts")}
              </h2>
              <BaseButton
                onClick={() => setIsContactSearchVisible(true)}
                className="border-none bg-transparent"
                startIcon={
                  <SearchIcon className="text-obsidianBlack w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
                }
              />
            </div>
          )}
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {renderContactsListContent()}
        </div>
      </div>

      {/* Right Panel - Chat Window */}
      <div
        ref={chatWindowRef}
        className={`flex-1 flex flex-col bg-white md:rounded-[16px] min-h-0 relative ${
          showChatView ? "flex" : "hidden lg:flex"
        }`}
      >
        {!selectedContact && !tempBusinessData ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-textBase text-obsidianBlack text-opacity-50">
              {t("chatPageConstants.selectContactToStartChatting")}
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div
              className={`flex items-center justify-between border-solid border-t md:border-t-0 border-0 border-b border-graySoft border-opacity-50 px-[10px] xxs:px-[20px] xs:px-[40px] md:px-[32px] xl:px-[42px] ${
                isSearchMode
                  ? "py-[7px] sm:py-[10.5px] md:py-[13px]"
                  : "py-[10px] sm:py-[12px]"
              }`}
            >
              {isSearchMode ? (
                <div className="flex items-center gap-[8px] sm:gap-[12px] w-full">
                  <BaseButton
                    onClick={handleToggleSearch}
                    className="border-none bg-transparent p-1 flex-shrink-0"
                    startIcon={
                      <BackArrowIcon size={20} className="text-obsidianBlack" />
                    }
                  />
                  <div className="flex-1 relative">
                    <BaseInput
                      name="message-search"
                      type="text"
                      placeholder={t("chatPageConstants.searchMessages")}
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full px-3 sm:px-4 py-2 border border-graySoft border-opacity-50 rounded-full text-textBase text-obsidianBlack placeholder-stoneGray ring-0"
                    />
                    {searchQuery && (
                      <BaseButton
                        onClick={() => {
                          setSearchQuery("");
                          setMessages(allMessages);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 border-none bg-transparent p-1"
                        startIcon={
                          <CloseIcon className="text-obsidianBlack w-[14px] h-[14px]" />
                        }
                      />
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-[5px] sm:gap-[7px]">
                    {/* Back Button - Only visible on mobile */}
                    <BaseButton
                      onClick={handleBackToContacts}
                      className="lg:hidden border-none bg-transparent mr-[8px] p-1"
                      startIcon={
                        <BackArrowIcon
                          size={20}
                          className="text-obsidianBlack"
                        />
                      }
                    />
                    <div className="relative w-[32px] h-[32px] sm:w-[36px] sm:h-[36px] border-[2px] border-solid border-obsidianBlack border-opacity-20 rounded-full overflow-hidden flex-shrink-0">
                      <SafeImage
                        src={
                          (handleImagePreview({
                            imagePath: selectedContact?.profile_image,
                          }) ??
                            handleImagePreview({
                              imagePath: tempBusinessData?.business_image,
                            }) ??
                            user_image?.src) ||
                          ""
                        }
                        alt={
                          selectedContact?.name ??
                          tempBusinessData?.business_name ??
                          ""
                        }
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h3 className="text-textSm font-light text-obsidianBlack xl:leading-[100%] xl:tracking-[0px]">
                      {selectedContact?.name ??
                        tempBusinessData?.business_name ??
                        ""}
                    </h3>
                  </div>
                  <div className="flex items-center">
                    <BaseButton
                      onClick={handleToggleSearch}
                      className="border-none bg-transparent"
                      startIcon={
                        <SearchIcon className="text-obsidianBlack w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
                      }
                    />
                  </div>
                </>
              )}
            </div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto relative chat-background"
            >
              <div className="relative z-10 px-[10px] xxs:px-[20px] xs:px-[40px] md:px-[32px] xl:px-[42px] py-[16px] sm:py-[24px] lg:py-[30px]">
                {loading ||
                (selectedChatId && !isConnected) ||
                (selectedChatId &&
                  hasLoadedChatHistoryRef.current !== selectedChatId) ? (
                  <div className="flex justify-center items-center h-full">
                    <TypingIndicator />
                  </div>
                ) : (
                  <div>
                    {groupedMessages().length === 0 ? (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-textBase text-obsidianBlack text-opacity-50">
                          {t(
                            "chatPageConstants.noMessagesYetStartConversation"
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-[12px] sm:gap-[16px] lg:gap-[20px]">
                        {(groupedMessages() ?? []).map((group, groupIndex) => {
                          const isFirstGroup = groupIndex === 0;
                          return (
                            <div
                              key={group.id}
                              className={
                                isFirstGroup ? "" : "mt-[24px] sm:mt-[30px]"
                              }
                            >
                              {group.date &&
                                group.date !== commonLabels?.today && (
                                  <div className="flex justify-center my-[20px] sm:my-[24px] lg:my-[30px]">
                                    <span className="text-textSm px-[16px] sm:px-[20px] lg:px-[26px] py-[6px] sm:py-[7px] text-obsidianBlack font-light text-opacity-70 bg-graySoft bg-opacity-25 rounded-[12px] sm:rounded-[16px] xl:leading-[100%] xl:tracking-[0.3px]">
                                      {group.date}
                                    </span>
                                  </div>
                                )}
                              {group.date === commonLabels?.today &&
                                !isFirstGroup && (
                                  <div className="flex justify-center my-[20px] sm:my-[24px] lg:my-[30px]">
                                    <span className="text-textSm px-[16px] sm:px-[20px] lg:px-[26px] py-[6px] sm:py-[7px] text-obsidianBlack font-light text-opacity-70 bg-graySoft bg-opacity-25 rounded-[12px] sm:rounded-[16px] xl:leading-[100%] xl:tracking-[0.3px]">
                                      {commonLabels?.today ?? ""}
                                    </span>
                                  </div>
                                )}
                              <div className="flex flex-col gap-[12px] sm:gap-[16px] lg:gap-[20px]">
                                {(group.messages ?? []).map((message) => {
                                  const isMatch =
                                    searchQuery.trim() &&
                                    messageMatchesSearch(message, searchQuery);
                                  // Check if it's an image message: type === "images" AND isImage === true
                                  const isImageMessage =
                                    message?.type === "images" &&
                                    message?.isImage === true;
                                  // Check if message has an image/file to display
                                  const hasFileOrImage =
                                    message?.type === "images" &&
                                    message?.image;
                                  return (
                                    <div
                                      key={message?.id}
                                      id={`message-${message?.id ?? ""}`}
                                      className={`flex ${
                                        message?.isOutgoing
                                          ? "justify-end"
                                          : "justify-start"
                                      }`}
                                    >
                                      <div
                                        className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] py-[10px] sm:py-[12px] lg:py-[14px] px-[14px] sm:px-[16px] lg:px-[20px] ${
                                          message?.isOutgoing
                                            ? "bg-deepTeal text-white rounded-t-[12px] sm:rounded-t-[16px] rounded-bl-[12px] sm:rounded-bl-[16px]"
                                            : "bg-deepTeal bg-opacity-10 text-obsidianBlack rounded-b-[12px] sm:rounded-b-[16px] rounded-tr-[12px] sm:rounded-tr-[16px]"
                                        } ${
                                          isMatch
                                            ? "ring-2 ring-yellowPrimary ring-opacity-75"
                                            : ""
                                        }`}
                                      >
                                        {hasFileOrImage && (
                                          <div className="mb-[8px]">
                                            <div className="relative w-full max-w-[300px] overflow-hidden">
                                              {isImageMessage ? (
                                                <SafeImage
                                                  src={
                                                    message.image?.startsWith(
                                                      "blob:"
                                                    )
                                                      ? message.image
                                                      : `${BaseImageURL}${message.image}`
                                                  }
                                                  alt=""
                                                  width={300}
                                                  height={300}
                                                  className="object-cover w-full h-auto max-h-[400px]"
                                                />
                                              ) : (
                                                <BaseButton
                                                  onClick={() =>
                                                    handleFileDownload(
                                                      message.image ?? ""
                                                    )
                                                  }
                                                  className="w-full border-none bg-transparent p-0 hover:opacity-80 transition-opacity"
                                                >
                                                  <SafeImage
                                                    src={
                                                      dummy_file_image?.src ??
                                                      dummy_file_image
                                                    }
                                                    alt=""
                                                    width={100}
                                                    height={100}
                                                    className="object-cover w-full h-auto max-h-[400px]"
                                                  />
                                                </BaseButton>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                        {message?.text && (
                                          <p className="text-textBase font-light xl:leading-[100%] xl:tracking-[0.3px] break-words">
                                            {searchQuery.trim()
                                              ? highlightSearchText(
                                                  message?.text ?? "",
                                                  searchQuery
                                                )
                                              : message?.text ?? ""}
                                          </p>
                                        )}
                                        <p
                                          className={`mt-[3px] sm:mt-[4px] text-textSm text-opacity-50 font-light xl:leading-[100%] xl:tracking-[0.3px] ${
                                            message?.isOutgoing
                                              ? "text-white text-opacity-50 text-end"
                                              : "text-obsidianBlack text-opacity-50 text-start"
                                          }`}
                                        >
                                          {message?.timestamp ?? ""}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {/* Typing Indicator */}
                        {isOtherUserTyping && (
                          <div className="flex justify-start mt-[12px] sm:mt-[16px]">
                            <div className="max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] py-[10px] sm:py-[12px] lg:py-[14px] px-[14px] sm:px-[16px] lg:px-[20px] bg-deepTeal bg-opacity-10 rounded-b-[12px] sm:rounded-b-[16px] rounded-tr-[12px] sm:rounded-tr-[16px]">
                              <div className="flex items-center gap-[6px]">
                                <TypingIndicator />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>
            
            {/* Scroll to Bottom Button - Overlaps messages */}
            {showScrollToBottom && (
              <div className="absolute bottom-[80px] sm:bottom-[90px] right-[16px] sm:right-[24px] md:right-[32px] xl:right-[42px] z-[9999] pointer-events-auto">
                <BaseButton
                  onClick={() => scrollToBottom(true)}
                  className="w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] rounded-full bg-graySoft text-white shadow-2xl hover:bg-opacity-90 hover:scale-105 transition-all flex items-center justify-center border-none p-0 cursor-pointer"
                >
                  <ChevronDownIcon className="text-white w-[20px] h-[20px] sm:w-[22px] sm:h-[22px]" />
                </BaseButton>
              </div>
            )}

            {/* Message Input Area */}
            <div 
              ref={messageInputAreaRef}
              className="chat-background px-[10px] xxs:px-[20px] xs:px-[40px] md:px-[32px] xl:px-[42px] py-[8px] sm:py-[10px]"
            >
              <div className="flex items-center gap-[6px] sm:gap-[8px]">
                <div className="flex items-center flex-1 min-w-0 shadow-md bg-white rounded-[20px] sm:rounded-[24px] px-[12px] sm:px-[16px] py-[8px] sm:py-[10px]">
                  <BaseInput
                    type="text"
                    placeholder={t("chatPageConstants.writeMessage")}
                    value={messageText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    disabled={!isConnected || sendingMessage || uploadingImage}
                    className="flex-1 bg-transparent border-none px-0 py-0 text-textBase text-obsidianBlack placeholder-stoneGray ring-0 min-w-0 focus:ring-0 focus:outline-none"
                    fullWidth
                  />
                  <BaseFileUpload
                    name="chat-file-upload"
                    accept="*/*"
                    disabled={!isConnected || uploadingImage}
                    onFileChange={handleFileSelect}
                    customUI={true}
                    showEditButton={false}
                    uploadPlaceholder={
                      <BaseButton
                        className="border-none bg-transparent p-1 flex-shrink-0"
                        startIcon={
                          <AttachmentIcon className="text-obsidianBlack w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
                        }
                      />
                    }
                    containerClassName="w-auto h-auto"
                    className="w-auto h-auto"
                  />
                </div>

                <BaseButton
                  onClick={handleSendMessage}
                  disabled={
                    !messageText.trim() ||
                    !isConnected ||
                    sendingMessage ||
                    uploadingImage
                  }
                  className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] lg:w-auto lg:h-auto lg:px-[14px] lg:py-[10px] lg:gap-[6px] rounded-full lg:rounded-[24px] bg-deepTeal text-white flex items-center justify-center border-none disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 p-0"
                >
                  <span className="hidden lg:inline text-textBase">
                    {t("chatPageConstants.send")}
                  </span>
                  <SendIcon className="text-white w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
                </BaseButton>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
