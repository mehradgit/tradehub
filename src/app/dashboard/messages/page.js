// src/app/dashboard/messages/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import Layout from "@/components/layout/Layout";

// ====== تابع تبدیل متن به JSX با لینک‌های قابل کلیک ======
function formatMessageWithLinks(text) {
  if (!text) return null;

  // تشخیص لینک‌ها (شامل http, https و /products/...)
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part && part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--primary)",
            textDecoration: "underline",
            wordBreak: "break-all",
          }}
        >
          {part}
        </a>
      );
    }
    // تشخیص و بولد کردن نام محصول (با الگوی **Product:**)
    if (part && part.includes("**Product:**")) {
      const bolded = part.replace(/\*\*Product:\*\*/g, "📦 Product:");
      return <span key={index} style={{ fontWeight: "bold" }}>{bolded}</span>;
    }
    return <span key={index}>{part}</span>;
  });
}

export default function MessagesPage() {
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

  // دریافت userId از URL
  const userId = searchParams.get("userId");

  // ====== دریافت اطلاعات کاربر جاری ======
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setCurrentUser(session.user);
    }
  }, [session, status]);

  // ====== دریافت لیست مکالمات ======
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (res.ok) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
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
        // اسکرول به پایین
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

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

      // به‌روزرسانی لیست پیام‌ها
      const newMsg = data.data;
      setMessages((prev) => [...prev, newMsg]);

      // به‌روزرسانی لیست مکالمات
      fetchConversations();

      // اسکرول به پایین
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
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
    // به‌روزرسانی URL بدون ریلود صفحه
    router.push(`/dashboard/messages?userId=${otherUserId}`);
  };

  if (status === "loading") {
    return (
      <Layout>
        <div className="container py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-4">
        <h1 className="fw-bold mb-4">
          <i className="fas fa-envelope me-2" style={{ color: "var(--primary)" }}></i>
          Messages
        </h1>

        <div className="row g-4">
          {/* ====== لیست مکالمات ====== */}
          <div className="col-md-4">
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
              <div className="card-header bg-white border-0 py-3 px-4">
                <h6 className="fw-bold mb-0">Conversations</h6>
              </div>
              <div className="card-body p-0" style={{ maxHeight: "500px", overflowY: "auto" }}>
                {conversations.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {conversations.map((conv) => {
                      const otherUser = conv.user;
                      const isActive = selectedUserId === otherUser.id;
                      return (
                        <button
                          key={otherUser.id}
                          onClick={() => selectConversation(otherUser.id)}
                          className={`list-group-item list-group-item-action d-flex align-items-center gap-3 border-0 py-3 px-4 ${
                            isActive ? "bg-primary bg-opacity-10" : ""
                          }`}
                          style={{ cursor: "pointer" }}
                        >
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                            style={{
                              width: "44px",
                              height: "44px",
                              background: otherUser.image
                                ? "transparent"
                                : "var(--primary)",
                              overflow: "hidden",
                            }}
                          >
                            {otherUser.image ? (
                              <img
                                src={otherUser.image}
                                alt={otherUser.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <span className="fw-bold">
                                {otherUser.name?.charAt(0)?.toUpperCase() || "U"}
                              </span>
                            )}
                          </div>
                          <div className="flex-grow-1 text-start">
                            <div className="fw-semibold text-truncate">
                              {otherUser.name || "Unknown User"}
                            </div>
                            <div className="small text-muted text-truncate" style={{ maxWidth: "150px" }}>
                              {conv.lastMessage || "No messages"}
                            </div>
                          </div>
                          <div className="small text-muted flex-shrink-0">
                            {conv.lastMessageAt
                              ? new Date(conv.lastMessageAt).toLocaleDateString()
                              : ""}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-inbox fa-2x text-muted mb-2"></i>
                    <p className="text-muted mb-0">No conversations yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ====== نمایش پیام‌های مکالمه ====== */}
          <div className="col-md-8">
            <div className="card shadow-sm border-0 rounded-4">
              {selectedUserId ? (
                <>
                  {/* هدر مکالمه */}
                  <div className="card-header bg-white border-0 py-3 px-4 d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "var(--primary)",
                      }}
                    >
                      {conversations.find((c) => c.user.id === selectedUserId)
                        ?.user?.name?.charAt(0)
                        ?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="fw-semibold">
                        {conversations.find((c) => c.user.id === selectedUserId)
                          ?.user?.name || "User"}
                      </div>
                      <div className="small text-muted">
                        {messages.length} messages
                      </div>
                    </div>
                  </div>

                  {/* لیست پیام‌ها */}
                  <div
                    className="card-body p-3"
                    style={{
                      maxHeight: "400px",
                      overflowY: "auto",
                      background: "#f9f7f4",
                      minHeight: "300px",
                    }}
                  >
                    {loading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" style={{ width: "30px", height: "30px" }}>
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : messages.length > 0 ? (
                      <>
                        {messages.map((msg) => {
                          const isOwn = msg.senderId === currentUser?.id;
                          return (
                            <div
                              key={msg.id}
                              className={`d-flex mb-3 ${isOwn ? "justify-content-end" : "justify-content-start"}`}
                            >
                              <div
                                style={{
                                  maxWidth: "80%",
                                  padding: "10px 16px",
                                  borderRadius: "16px",
                                  background: isOwn ? "var(--primary)" : "white",
                                  color: isOwn ? "white" : "var(--gray-dark)",
                                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                                  wordWrap: "break-word",
                                }}
                              >
                                {/* ✅ نمایش پیام با لینک‌های قابل کلیک */}
                                <div style={{ fontSize: "14px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                                  {formatMessageWithLinks(msg.content)}
                                </div>
                                <div
                                  style={{
                                    fontSize: "10px",
                                    color: isOwn ? "rgba(255,255,255,0.7)" : "var(--gray)",
                                    marginTop: "6px",
                                    textAlign: "right",
                                  }}
                                >
                                  {new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    ) : (
                      <div className="text-center py-5">
                        <i className="fas fa-comment-dots fa-2x text-muted mb-2"></i>
                        <p className="text-muted mb-0">No messages yet. Start the conversation!</p>
                      </div>
                    )}
                  </div>

                  {/* ====== فرم ارسال پیام ====== */}
                  <div className="card-footer bg-white border-0 p-3">
                    <form onSubmit={handleSendMessage} className="d-flex gap-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your reply..."
                        className="form-control"
                        rows="1"
                        style={{
                          resize: "none",
                          borderRadius: "12px",
                          border: "1.5px solid #e8e2da",
                          fontSize: "14px",
                          padding: "10px 14px",
                          fontFamily: "Inter, sans-serif",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#e85d3a";
                          e.target.style.boxShadow = "0 0 0 3px rgba(232, 93, 58, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#e8e2da";
                          e.target.style.boxShadow = "none";
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                      />
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="btn btn-primary px-4"
                        style={{
                          borderRadius: "12px",
                          background: "var(--primary)",
                          border: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sending ? (
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                        ) : (
                          <i className="fas fa-paper-plane"></i>
                        )}
                      </button>
                    </form>
                    <div className="small text-muted mt-1">
                      Press <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-comment-dots fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">Select a conversation</h5>
                  <p className="text-muted small">
                    Choose a conversation from the list to view and reply to messages.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}