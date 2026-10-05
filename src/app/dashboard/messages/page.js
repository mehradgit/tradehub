// src/app/dashboard/messages/page.js
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import EmojiPickerWrapper from "@/components/ui/EmojiPicker";

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const conversationsRef = useRef([]);
  const textareaRef = useRef(null);

  const userId = searchParams.get("userId");

  // ===== Session =====
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setCurrentUser(session.user);
    }
  }, [session, status]);

  // ===== Fetch conversations =====
  const fetchConversations = async () => {
    setConversationsLoading(true);
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (res.ok) {
        const convs = data.conversations || [];
        setConversations(convs);
        conversationsRef.current = convs;
      } else {
        toast.error(data.message || "Failed to load conversations");
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setConversationsLoading(false);
    }
  };

  // ===== Fetch messages =====
  const fetchMessages = async (otherUserId) => {
    if (!otherUserId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/messages?userId=${otherUserId}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      } else {
        toast.error(data.message || "Failed to load messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  // ===== Mark as read =====
  const markMessagesAsRead = async (senderId) => {
    try {
      const res = await fetch("/api/messages/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId }),
      });
      if (res.ok) {
        window.dispatchEvent(new Event("messages-read"));
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // ===== Scroll to bottom =====
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ===== Auto-resize textarea =====
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [newMessage]);

  // ===== Initial load =====
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }

    fetchConversations();

    if (userId) {
      setSelectedUserId(userId);
      fetchMessages(userId);
      markMessagesAsRead(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, userId]);

  // ===== Send message =====
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;
    if (sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedUserId,
          content: messageText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      setNewMessage("");
      const newMsg = data.data;
      setMessages((prev) => [...prev, newMsg]);

      // Update conversation in list
      const updateConv = (conv) =>
        conv.user.id === selectedUserId
          ? {
              ...conv,
              lastMessage: newMsg.content,
              lastMessageAt: newMsg.createdAt,
            }
          : conv;

      setConversations((prev) => prev.map(updateConv));
      conversationsRef.current = conversationsRef.current.map(updateConv);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  // ===== Select conversation =====
  const selectConversation = (otherUserId) => {
    setSelectedUserId(otherUserId);
    setMessages([]);
    fetchMessages(otherUserId);
    markMessagesAsRead(otherUserId);
    router.push(`/dashboard/messages?userId=${otherUserId}`, { scroll: false });
  };

  // ===== Back to list (mobile) =====
  const handleBackToList = () => {
    setSelectedUserId(null);
    setMessages([]);
    router.push("/dashboard/messages", { scroll: false });
  };

  // ===== Format helpers =====
  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);

    if (diffDays === 0) return formatTime(d);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7)
      return d.toLocaleDateString("en-US", { weekday: "short" });
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name) =>
    (name || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const selectedConv = conversations.find((c) => c.user.id === selectedUserId);

  // ===== Loading =====
  if (status === "loading") {
    return (
      <div className="messages-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <>
      <div className="messages-page">
        {/* ===== Page Header ===== */}
        <div className="messages-header">
          <div className="messages-header-left">
            <h1>
              <i className="fas fa-comment-dots"></i>
              Messages
            </h1>
            <p>
              {conversations.length > 0
                ? `${conversations.length} conversation${
                    conversations.length !== 1 ? "s" : ""
                  }`
                : "Your conversations will appear here"}
            </p>
          </div>
        </div>

        {/* ===== Layout ===== */}
        <div
          className={`messages-layout ${
            selectedUserId ? "has-selection" : ""
          }`}
        >
          {/* ===== Conversations List ===== */}
          <aside className="conversations-panel">
            <div className="conversations-header">
              <h2>Inbox</h2>
              <span className="conversations-count">
                {conversations.length}
              </span>
            </div>

            <div className="conversations-list">
              {conversationsLoading ? (
                <div className="conversations-loading">
                  <div className="spinner-small"></div>
                  <span>Loading conversations...</span>
                </div>
              ) : conversations.length > 0 ? (
                conversations.map((conv) => {
                  const otherUser = conv.user;
                  const isActive = selectedUserId === otherUser.id;

                  return (
                    <button
                      key={otherUser.id}
                      type="button"
                      className={`conversation-item ${
                        isActive ? "active" : ""
                      }`}
                      onClick={() => selectConversation(otherUser.id)}
                    >
                      <div className="conversation-avatar">
                        {otherUser.image ? (
                          <img
                            src={otherUser.image}
                            alt={otherUser.name}
                            loading="lazy"
                          />
                        ) : (
                          <span>{getInitials(otherUser.name)}</span>
                        )}
                      </div>

                      <div className="conversation-content">
                        <div className="conversation-top">
                          <span className="conversation-name">
                            {otherUser.name || "Unknown User"}
                          </span>
                          {conv.lastMessageAt && (
                            <span className="conversation-time">
                              {formatDate(conv.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        <div className="conversation-preview">
                          {conv.lastMessage || "No messages yet"}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="conversations-empty">
                  <i className="fas fa-inbox"></i>
                  <h4>No conversations</h4>
                  <p>Start a new conversation from a product or request.</p>
                </div>
              )}
            </div>
          </aside>

          {/* ===== Chat Panel ===== */}
          <section className="chat-panel">
            {selectedUserId ? (
              <>
                {/* Chat Header */}
                <div className="chat-header">
                  {/* Back button - mobile only */}
                  <button
                    type="button"
                    className="chat-back-btn"
                    onClick={handleBackToList}
                    aria-label="Back to conversations"
                  >
                    <i className="fas fa-arrow-left"></i>
                  </button>

                  <div className="chat-header-avatar">
                    {selectedConv?.user?.image ? (
                      <img
                        src={selectedConv.user.image}
                        alt={selectedConv.user.name}
                      />
                    ) : (
                      <span>
                        {getInitials(selectedConv?.user?.name || "U")}
                      </span>
                    )}
                  </div>

                  <div className="chat-header-info">
                    <div className="chat-header-name">
                      {selectedConv?.user?.name || "User"}
                    </div>
                    <div className="chat-header-sub">
                      {messages.length} message
                      {messages.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="chat-messages">
                  {loading ? (
                    <div className="chat-loading">
                      <div className="spinner-small"></div>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((msg, index) => {
                      const isOwn = msg.senderId === currentUser?.id;
                      const showDate =
                        index === 0 ||
                        new Date(msg.createdAt).toDateString() !==
                          new Date(messages[index - 1].createdAt).toDateString();

                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="chat-date-divider">
                              <span>
                                {new Date(msg.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "long",
                                    day: "numeric",
                                    year:
                                      new Date().getFullYear() !==
                                      new Date(msg.createdAt).getFullYear()
                                        ? "numeric"
                                        : undefined,
                                  }
                                )}
                              </span>
                            </div>
                          )}

                          <div
                            className={`chat-message ${
                              isOwn ? "own" : "other"
                            }`}
                          >
                            <div className="chat-bubble">
                              {msg.content}
                              <div className="chat-time">
                                {formatTime(msg.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="chat-empty">
                      <i className="fas fa-comment-dots"></i>
                      <h4>No messages yet</h4>
                      <p>Start the conversation by sending a message.</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="chat-input-area">
                  <form className="chat-input-form" onSubmit={handleSendMessage}>
                    <div className="chat-input-wrapper">
                      <EmojiPickerWrapper
                        onEmojiSelect={(emoji) => {
                          setNewMessage((prev) => prev + emoji);
                          textareaRef.current?.focus();
                        }}
                      />
                      <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        rows="1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="chat-send-btn"
                      disabled={sending || !newMessage.trim()}
                      aria-label="Send message"
                    >
                      {sending ? (
                        <span className="spinner-tiny"></span>
                      ) : (
                        <i className="fas fa-paper-plane"></i>
                      )}
                    </button>
                  </form>

                  <div className="chat-input-hint">
                    <kbd>Enter</kbd> to send · <kbd>Shift + Enter</kbd> for new
                    line
                  </div>
                </div>
              </>
            ) : (
              <div className="chat-placeholder">
                <i className="fas fa-comment-dots"></i>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the list to start chatting.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ====== Styles ====== */}
      <style jsx>{`
        /* ============================================================
           Page Container
           ============================================================ */
        .messages-page {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ============================================================
           Header
           ============================================================ */
        .messages-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .messages-header-left h1 {
          font-size: 24px;
          font-weight: 800;
          color: #0b1f18;
          margin: 0;
          font-family: "Manrope", sans-serif;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .messages-header-left h1 i {
          color: #13795b;
          background: rgba(19, 121, 91, 0.08);
          padding: 8px;
          border-radius: 10px;
          font-size: 18px;
        }

        .messages-header-left p {
          font-size: 13.5px;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        /* ============================================================
           Layout
           ============================================================ */
        .messages-layout {
          display: grid;
          grid-template-columns: 340px minmax(0, 1fr);
          height: calc(100vh - 220px);
          min-height: 500px;
          max-height: 780px;
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
        }

        /* ============================================================
           Conversations Panel
           ============================================================ */
        .conversations-panel {
          display: flex;
          flex-direction: column;
          border-right: 1px solid #e8edf0;
          background: #fafcfb;
          min-width: 0;
          height: 100%;
        }

        .conversations-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px;
          border-bottom: 1px solid #e8edf0;
          background: white;
          flex-shrink: 0;
        }

        .conversations-header h2 {
          font-size: 14px;
          font-weight: 800;
          color: #0b1f18;
          margin: 0;
          font-family: "Manrope", sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .conversations-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 24px;
          padding: 0 8px;
          background: #eaf7f1;
          color: #0b5b43;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 800;
        }

        .conversations-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          scrollbar-width: thin;
        }

        .conversations-list::-webkit-scrollbar {
          width: 5px;
        }

        .conversations-list::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }

        /* ===== Conversation Item ===== */
        :global(.conversation-item) {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          font-family: inherit;
          margin-bottom: 2px;
        }

        :global(.conversation-item:hover) {
          background: white;
          border-color: #e8edf0;
        }

        :global(.conversation-item.active) {
          background: white;
          border-color: #13795b;
          box-shadow: 0 4px 12px rgba(19, 121, 91, 0.08);
        }

        .conversation-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #13795b, #0d9469);
          color: white;
          display: grid;
          place-items: center;
          font-size: 14px;
          font-weight: 800;
          overflow: hidden;
          flex-shrink: 0;
          font-family: "Manrope", sans-serif;
        }

        .conversation-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .conversation-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .conversation-top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 8px;
          min-width: 0;
        }

        .conversation-name {
          font-size: 13.5px;
          font-weight: 700;
          color: #0b1f18;
          font-family: "Manrope", sans-serif;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        .conversation-time {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .conversation-preview {
          font-size: 12.5px;
          color: #64748b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        /* ===== Empty / Loading ===== */
        .conversations-empty,
        .conversations-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          color: #94a3b8;
          gap: 8px;
        }

        .conversations-empty i {
          font-size: 36px;
          opacity: 0.4;
          margin-bottom: 6px;
        }

        .conversations-empty h4 {
          font-size: 14px;
          font-weight: 800;
          color: #334155;
          margin: 0;
          font-family: "Manrope", sans-serif;
        }

        .conversations-empty p {
          font-size: 12.5px;
          color: #94a3b8;
          margin: 0;
          max-width: 200px;
        }

        /* ============================================================
           Chat Panel
           ============================================================ */
        .chat-panel {
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          min-width: 0;
          height: 100%;
        }

        /* ===== Chat Header ===== */
        .chat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          background: white;
          border-bottom: 1px solid #e8edf0;
          flex-shrink: 0;
        }

        .chat-back-btn {
          display: none;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #f1f5f7;
          color: #334155;
          border: none;
          cursor: pointer;
          font-size: 14px;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .chat-back-btn:hover {
          background: #13795b;
          color: white;
        }

        .chat-header-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #13795b, #0d9469);
          color: white;
          display: grid;
          place-items: center;
          font-size: 13px;
          font-weight: 800;
          overflow: hidden;
          flex-shrink: 0;
          font-family: "Manrope", sans-serif;
        }

        .chat-header-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .chat-header-info {
          flex: 1;
          min-width: 0;
        }

        .chat-header-name {
          font-size: 14.5px;
          font-weight: 800;
          color: #0b1f18;
          font-family: "Manrope", sans-serif;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chat-header-sub {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        /* ===== Messages Area ===== */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          scrollbar-width: thin;
        }

        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }

        /* ===== Date Divider ===== */
        .chat-date-divider {
          text-align: center;
          margin: 14px 0 10px;
          display: flex;
          justify-content: center;
        }

        .chat-date-divider span {
          display: inline-block;
          padding: 4px 14px;
          background: white;
          border: 1px solid #e8edf0;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        /* ===== Message Bubble ===== */
        :global(.chat-message) {
          display: flex;
          margin-bottom: 2px;
        }

        :global(.chat-message.own) {
          justify-content: flex-end;
        }

        :global(.chat-message.other) {
          justify-content: flex-start;
        }

        .chat-bubble {
          max-width: 72%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 13.5px;
          line-height: 1.5;
          word-wrap: break-word;
          overflow-wrap: break-word;
          position: relative;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }

        :global(.chat-message.own) .chat-bubble {
          background: linear-gradient(135deg, #13795b, #0d9469);
          color: white;
          border-bottom-right-radius: 4px;
        }

        :global(.chat-message.other) .chat-bubble {
          background: white;
          color: #0b1f18;
          border-bottom-left-radius: 4px;
          border: 1px solid #e8edf0;
        }

        .chat-time {
          font-size: 10px;
          margin-top: 4px;
          text-align: right;
        }

        :global(.chat-message.own) .chat-time {
          color: rgba(255, 255, 255, 0.75);
        }

        :global(.chat-message.other) .chat-time {
          color: #94a3b8;
        }

        /* ===== Chat Empty / Loading ===== */
        .chat-empty,
        .chat-loading,
        .chat-placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #94a3b8;
          gap: 10px;
          padding: 40px 20px;
        }

        .chat-placeholder i,
        .chat-empty i {
          font-size: 46px;
          opacity: 0.35;
          margin-bottom: 4px;
        }

        .chat-placeholder h3,
        .chat-empty h4 {
          font-size: 15px;
          font-weight: 800;
          color: #334155;
          margin: 0;
          font-family: "Manrope", sans-serif;
        }

        .chat-placeholder p,
        .chat-empty p {
          font-size: 13px;
          color: #94a3b8;
          margin: 0;
          max-width: 260px;
        }

        /* ===== Input Area ===== */
        .chat-input-area {
          padding: 12px 16px 14px;
          background: white;
          border-top: 1px solid #e8edf0;
          flex-shrink: 0;
        }

        .chat-input-form {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .chat-input-wrapper {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: flex-end;
          gap: 4px;
          background: #f1f5f7;
          border: 1.5px solid transparent;
          border-radius: 20px;
          padding: 6px 12px;
          transition: all 0.2s ease;
        }

        .chat-input-wrapper:focus-within {
          background: white;
          border-color: #13795b;
          box-shadow: 0 0 0 3px rgba(19, 121, 91, 0.1);
        }

        .chat-input-wrapper textarea {
          flex: 1;
          min-width: 0;
          background: transparent;
          border: none;
          outline: none;
          font-size: 13.5px;
          padding: 6px 4px;
          resize: none;
          font-family: inherit;
          color: #0b1f18;
          line-height: 1.5;
          max-height: 140px;
          overflow-y: auto;
        }

        .chat-input-wrapper textarea::placeholder {
          color: #94a3b8;
        }

        .chat-send-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #13795b, #0d9469);
          color: white;
          border: none;
          cursor: pointer;
          font-size: 14px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(19, 121, 91, 0.25);
        }

        .chat-send-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(19, 121, 91, 0.35);
        }

        .chat-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }

        .chat-input-hint {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 8px;
          padding-left: 4px;
        }

        .chat-input-hint kbd {
          background: #f1f5f7;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 1px 5px;
          font-size: 10px;
          font-family: inherit;
          color: #475569;
        }

        /* ============================================================
           Spinners
           ============================================================ */
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e8edf0;
          border-top-color: #13795b;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .spinner-small {
          width: 24px;
          height: 24px;
          border: 2.5px solid #e8edf0;
          border-top-color: #13795b;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .spinner-tiny {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .messages-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
        }

        /* ============================================================
           Responsive
           ============================================================ */

        /* Tablet */
        @media (max-width: 992px) {
          .messages-layout {
            grid-template-columns: 280px minmax(0, 1fr);
          }
        }

        /* Mobile: single column */
        @media (max-width: 768px) {
          .messages-page {
            padding: 16px;
            gap: 14px;
          }

          .messages-header-left h1 {
            font-size: 20px;
          }

          .messages-header-left h1 i {
            padding: 6px;
            font-size: 15px;
          }

          .messages-layout {
            grid-template-columns: 1fr;
            height: calc(100vh - 200px);
            min-height: 460px;
            max-height: none;
          }

          /* On mobile:
             - when no chat is open: list only
             - when a chat is open: chat + back button only
          */
          .conversations-panel {
            border-right: none;
            border-bottom: none;
          }

          .messages-layout:not(.has-selection) .chat-panel {
            display: none;
          }

          .messages-layout.has-selection .conversations-panel {
            display: none;
          }

          .chat-back-btn {
            display: flex;
          }

          .chat-messages {
            padding: 16px;
          }

          .chat-bubble {
            max-width: 85%;
            font-size: 13px;
          }

          .chat-input-area {
            padding: 10px 12px 12px;
          }

          .chat-input-hint {
            display: none;
          }

          .chat-input-wrapper {
            border-radius: 18px;
          }
        }

        /* Small mobile */
        @media (max-width: 500px) {
          .messages-page {
            padding: 12px;
          }

          .messages-header-left h1 {
            font-size: 18px;
          }

          .messages-header-left p {
            font-size: 12.5px;
          }

          .messages-layout {
            border-radius: 14px;
          }

          .conversations-header {
            padding: 12px 14px;
          }

          :global(.conversation-item) {
            padding: 10px;
          }

          .conversation-avatar {
            width: 40px;
            height: 40px;
            font-size: 13px;
          }

          .conversation-name {
            font-size: 13px;
          }

          .conversation-preview {
            font-size: 12px;
          }

          .chat-header {
            padding: 12px 14px;
          }

          .chat-header-avatar {
            width: 38px;
            height: 38px;
            font-size: 12px;
          }

          .chat-header-name {
            font-size: 13.5px;
          }

          .chat-bubble {
            font-size: 12.5px;
            padding: 9px 13px;
          }
        }
      `}</style>
    </>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="messages-loading">
          <div className="spinner"></div>
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}