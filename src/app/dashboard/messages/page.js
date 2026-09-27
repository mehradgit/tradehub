// src/app/dashboard/messages/page.js
"use client";

import { useState, useEffect, useRef ,Suspense } from "react";
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
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const conversationsRef = useRef([]);

  const userId = searchParams.get("userId");

  // ====== دریافت اطلاعات کاربر جاری ======
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setCurrentUser(session.user);
    }
  }, [session, status]);

  // ====== دریافت لیست مکالمات ======
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

  // ====== دریافت پیام‌های یک مکالمه ======
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

  // ====== علامت‌گذاری پیام‌های یک مکالمه به‌عنوان خوانده‌شده ======
  const markMessagesAsRead = async (senderId) => {
    try {
      const res = await fetch("/api/messages/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId }),
      });
      if (res.ok) {
        // ارسال رویداد به سایدبار برای به‌روزرسانی بج
        window.dispatchEvent(new Event("messages-read"));
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // ====== اسکرول به پایین پس از تغییر پیام‌ها ======
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ====== بارگذاری اولیه ======
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
  }, [session, status, router, userId]);

  // ====== ارسال پیام جدید ======
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId) {
      toast.warning("Please enter a message");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedUserId,
          content: newMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      toast.success("Message sent!");
      setNewMessage("");

      const newMsg = data.data;
      setMessages((prev) => [...prev, newMsg]);

      // به‌روزرسانی محلی مکالمات
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.user.id === selectedUserId) {
            return { ...conv, lastMessage: newMsg.content, lastMessageAt: newMsg.createdAt };
          }
          return conv;
        });
        return updated;
      });
      conversationsRef.current = conversationsRef.current.map((conv) => {
        if (conv.user.id === selectedUserId) {
          return { ...conv, lastMessage: newMsg.content, lastMessageAt: newMsg.createdAt };
        }
        return conv;
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  // ====== انتخاب یک مکالمه ======
  const selectConversation = (otherUserId) => {
    setSelectedUserId(otherUserId);
    setMessages([]);
    fetchMessages(otherUserId);
    markMessagesAsRead(otherUserId);
    router.push(`/dashboard/messages?userId=${otherUserId}`, { scroll: false });
  };

  // ====== فرمت‌دهی زمان ======
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (status === "loading") {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container py-4">
      <h1 className="fw-bold mb-4">
        <i className="fas fa-envelope me-2" style={{ color: "var(--primary)" }}></i>
        Messages
      </h1>

      <div
        className="messages-layout"
        style={{
          display: "flex",
          flexDirection: "row",
          height: "calc(100vh - 250px)",
          maxHeight: "600px",
          minHeight: "400px",
          background: "white",
          borderRadius: "20px",
          boxShadow: "var(--shadow)",
          border: "1px solid var(--gray-light)",
          overflow: "hidden",
        }}
      >
        {/* ====== لیست مکالمات ====== */}
        <div
          className="conversations-list"
          style={{
            flex: "0 0 320px",
            borderRight: "1px solid var(--gray-light)",
            overflowY: "auto",
            padding: "16px",
            height: "100%",
          }}
        >
          <h6 className="fw-bold mb-3" style={{ fontSize: "14px", color: "var(--black)" }}>
            Conversations
          </h6>
          {conversationsLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" style={{ width: "30px", height: "30px" }}>
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : conversations.length > 0 ? (
            conversations.map((conv) => {
              const otherUser = conv.user;
              const isActive = selectedUserId === otherUser.id;
              return (
                <div
                  key={otherUser.id}
                  onClick={() => selectConversation(otherUser.id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    background: isActive ? "var(--primary-light)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "8px",
                    transition: "all 0.2s ease",
                  }}
                  className="hover-bg-light"
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: otherUser.image ? "transparent" : "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "16px",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {otherUser.image ? (
                      <img
                        src={otherUser.image}
                        alt={otherUser.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      otherUser.name?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--black)" }}>
                      {otherUser.name || "Unknown User"}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--gray)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {conv.lastMessage || "No messages"}
                    </div>
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--gray)", flexShrink: 0 }}>
                    {conv.lastMessageAt ? formatDate(conv.lastMessageAt) : ""}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4">
              <i className="fas fa-inbox fa-2x text-muted mb-2"></i>
              <p className="text-muted mb-0">No conversations yet</p>
            </div>
          )}
        </div>

        {/* ====== ناحیه چت ====== */}
        <div
          className="chat-area"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {selectedUserId ? (
            <>
              {/* هدر چت */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--gray-light)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "white",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  {conversations.find((c) => c.user.id === selectedUserId)?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--black)" }}>
                    {conversations.find((c) => c.user.id === selectedUserId)?.user?.name || "User"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--gray)" }}>
                    {messages.length} messages
                  </div>
                </div>
              </div>

              {/* لیست پیام‌ها با اسکرول */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px",
                  background: "var(--light)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" style={{ width: "30px", height: "30px" }}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => {
                    const isOwn = msg.senderId === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: "flex",
                          justifyContent: isOwn ? "flex-end" : "flex-start",
                          marginBottom: "4px",
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "70%",
                            padding: "10px 16px",
                            borderRadius: "16px",
                            background: isOwn ? "var(--primary)" : "white",
                            color: isOwn ? "white" : "var(--gray-dark)",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                            fontSize: "14px",
                            wordWrap: "break-word",
                          }}
                        >
                          {msg.content}
                          <div
                            style={{
                              fontSize: "10px",
                              color: isOwn ? "rgba(255,255,255,0.7)" : "var(--gray)",
                              marginTop: "4px",
                              textAlign: "right",
                            }}
                          >
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-comment-dots fa-2x text-muted mb-2"></i>
                    <p className="text-muted mb-0">No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* فرم ارسال پیام */}
              <div
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid var(--gray-light)",
                  background: "white",
                  flexShrink: 0,
                }}
              >
                <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "var(--light)",
                      borderRadius: "24px",
                      padding: "4px 12px",
                    }}
                  >
                    <EmojiPickerWrapper
                      onEmojiSelect={(emoji) => {
                        setNewMessage((prev) => prev + emoji);
                      }}
                    />
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      rows="1"
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        fontSize: "14px",
                        padding: "8px 4px",
                        resize: "none",
                        fontFamily: "inherit",
                        minHeight: "36px",
                      }}
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
                    disabled={sending || !newMessage.trim()}
                    style={{
                      background: "var(--primary)",
                      color: "white",
                      border: "none",
                      borderRadius: "24px",
                      padding: "8px 16px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      opacity: sending || !newMessage.trim() ? 0.6 : 1,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {sending ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="fas fa-paper-plane"></i>
                    )}
                  </button>
                </form>
                <div style={{ fontSize: "11px", color: "var(--gray)", marginTop: "4px" }}>
                  Press <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gray)",
              }}
            >
              <i className="fas fa-comment-dots fa-3x mb-3"></i>
              <h5 style={{ fontWeight: 600 }}>Select a conversation</h5>
              <p style={{ fontSize: "14px" }}>Choose a conversation from the left to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
          <div className="container text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-3">Loading...</p>
          </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}