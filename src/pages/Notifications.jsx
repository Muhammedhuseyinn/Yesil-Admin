// src/pages/Notifications.jsx
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  getDoc,
  doc
} from "firebase/firestore";
import {
  httpsCallable
} from "firebase/functions";
import { getFunctions } from "firebase/functions";
import {
  MdNotifications,
  MdSend,
  MdPerson,
  MdStore,
  MdGroup,
  MdLocalOffer,
  MdMessage,
  MdRefresh,
  MdClose,
  MdCheckCircle,
  MdError,
  MdInfo,
  MdAccessTime,
  MdVisibility
} from "react-icons/md";

const theme = {
  primary: "#01615F",
  primaryLight: "#028C89",
  primaryDark: "#014947",
  secondary: "#8B5CF6",
  accent: "#10B981",
  red: "#EF4444",
  yellow: "#F59E0B",
  blue: "#3B82F6",
  grayLight: "#F7FAFC",
  grayMedium: "#E2E8F0",
  grayDark: "#4A5568",
  grayDarker: "#2D3748",
  white: "#FFFFFF",
  black: "#1A202C"
};

export default function Notifications() {
  const [activeTab, setActiveTab] = useState("send"); // "send" or "history"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Send notification form
  const [notificationType, setNotificationType] = useState("direct"); // "direct", "promotional", "broadcast"
  const [targetType, setTargetType] = useState("user"); // "user", "restaurant", "all", "clients", "restaurants"
  const [targetUserId, setTargetUserId] = useState("");
  const [targetRestaurantId, setTargetRestaurantId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [offerId, setOfferId] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // User/Restaurant search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Notification history
  const [notifications, setNotifications] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const functions = getFunctions();

  // Search users/restaurants
  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", ">=", searchQuery),
        where("email", "<=", searchQuery + "\uf8ff")
      );

      const snapshot = await getDocs(q);
      const results = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        results.push({
          id: doc.id,
          name: data.name || data.displayName || data.email || "Unknown",
          email: data.email || "",
          type: data.type || "client",
          phone: data.phone || data.phoneNumber || ""
        });
      });

      // Also search by name
      const nameQuery = query(
        usersRef,
        where("name", ">=", searchQuery),
        where("name", "<=", searchQuery + "\uf8ff")
      );
      const nameSnapshot = await getDocs(nameQuery);

      nameSnapshot.forEach((doc) => {
        if (!results.find(r => r.id === doc.id)) {
          const data = doc.data();
          results.push({
            id: doc.id,
            name: data.name || data.displayName || data.email || "Unknown",
            email: data.email || "",
            type: data.type || "client",
            phone: data.phone || data.phoneNumber || ""
          });
        }
      });

      setSearchResults(results);
    } catch (err) {
      console.error("Error searching users:", err);
      setError("Error searching users");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Send notification
  const handleSendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      setError("Please enter title and content");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let result;

      if (notificationType === "promotional") {
        // Send promotional offer
        const sendOffer = httpsCallable(functions, 'sendPromotionalOffer');
        result = await sendOffer({
          title,
          body,
          offerId: offerId || "",
          imageUrl: imageUrl || "",
          targetUsers: targetType === "all" ? "all" :
            targetType === "clients" ? "clients" :
              targetType === "restaurants" ? "restaurants" : "all"
        });
      } else if (notificationType === "direct") {
        // Send direct message
        const sendMessage = httpsCallable(functions, 'sendDirectMessage');
        result = await sendMessage({
          userId: targetType === "user" ? targetUserId : null,
          restaurantId: targetType === "restaurant" ? targetRestaurantId : null,
          title,
          body,
          messageType: "direct_message"
        });
      } else {
        // Broadcast notification
        const sendNotification = httpsCallable(functions, 'sendNotificationFromAdmin');
        result = await sendNotification({
          userId: targetType === "user" ? targetUserId : null,
          restaurantId: targetType === "restaurant" ? targetRestaurantId : null,
          title,
          body,
          type: "admin_broadcast"
        });
      }

      setSuccess(`Notification sent successfully to ${result.data.sentTo || 1} user(s)`);

      // Reset form
      setTitle("");
      setBody("");
      setTargetUserId("");
      setTargetRestaurantId("");
      setOfferId("");
      setImageUrl("");
      setSearchQuery("");
      setSearchResults([]);

      // Refresh history
      fetchNotificationHistory();
    } catch (err) {
      console.error("Error sending notification:", err);
      setError(err.message || "An error occurred while sending the notification");
    } finally {
      setLoading(false);
    }
  };

  // Fetch notification history
  const fetchNotificationHistory = async () => {
    setLoadingHistory(true);
    try {
      const notificationsRef = collection(db, "notifications");
      const q = query(notificationsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const notificationsList = [];
      snapshot.forEach((doc) => {
        notificationsList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setNotifications(notificationsList);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("An error occurred while fetching notification history");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchNotificationHistory();
    }
  }, [activeTab]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationTypeLabel = (type) => {
    const types = {
      'order_status': 'Order Status',
      'new_order': 'New Order',
      'promotional_offer': 'Promotional Offer',
      'direct_message': 'Direct Message',
      'admin_broadcast': 'Admin Broadcast'
    };
    return types[type] || type;
  };

  return (
    <div style={{ padding: "0" }}>
      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "12px",
        marginBottom: "32px",
        borderBottom: `2px solid ${theme.grayMedium}`
      }}>
        <button
          onClick={() => setActiveTab("send")}
          style={{
            padding: "12px 24px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "send" ? `3px solid ${theme.primary}` : "3px solid transparent",
            color: activeTab === "send" ? theme.primary : theme.grayDark,
            fontWeight: activeTab === "send" ? "600" : "500",
            cursor: "pointer",
            fontSize: "16px",
            transition: "all 0.2s ease"
          }}
        >
          <MdSend style={{ marginRight: "8px", verticalAlign: "middle" }} />
          Send Notification
        </button>
        <button
          onClick={() => setActiveTab("history")}
          style={{
            padding: "12px 24px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "history" ? `3px solid ${theme.primary}` : "3px solid transparent",
            color: activeTab === "history" ? theme.primary : theme.grayDark,
            fontWeight: activeTab === "history" ? "600" : "500",
            cursor: "pointer",
            fontSize: "16px",
            transition: "all 0.2s ease"
          }}
        >
          <MdAccessTime style={{ marginRight: "8px", verticalAlign: "middle" }} />
          Notification History
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div style={{
          padding: "16px",
          backgroundColor: theme.red + "10",
          border: `1px solid ${theme.red}30`,
          borderRadius: "12px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: theme.red
        }}>
          <MdError size={20} />
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: theme.red,
              cursor: "pointer"
            }}
          >
            <MdClose />
          </button>
        </div>
      )}

      {success && (
        <div style={{
          padding: "16px",
          backgroundColor: theme.accent + "10",
          border: `1px solid ${theme.accent}30`,
          borderRadius: "12px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: theme.accent
        }}>
          <MdCheckCircle size={20} />
          <span>{success}</span>
          <button
            onClick={() => setSuccess("")}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: theme.accent,
              cursor: "pointer"
            }}
          >
            <MdClose />
          </button>
        </div>
      )}

      {/* Send Notification Tab */}
      {activeTab === "send" && (
        <div>
          {/* Notification Type Selection */}
          <div style={{ marginBottom: "32px" }}>
            <label style={{
              display: "block",
              marginBottom: "12px",
              fontSize: "14px",
              fontWeight: "600",
              color: theme.grayDarker
            }}>
              Notification Type
            </label>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                onClick={() => setNotificationType("direct")}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: `2px solid ${notificationType === "direct" ? theme.primary : theme.grayMedium}`,
                  backgroundColor: notificationType === "direct" ? theme.primary + "10" : theme.white,
                  color: notificationType === "direct" ? theme.primary : theme.grayDark,
                  cursor: "pointer",
                  fontWeight: notificationType === "direct" ? "600" : "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <MdMessage />
                Direct Message
              </button>
              <button
                onClick={() => setNotificationType("promotional")}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: `2px solid ${notificationType === "promotional" ? theme.primary : theme.grayMedium}`,
                  backgroundColor: notificationType === "promotional" ? theme.primary + "10" : theme.white,
                  color: notificationType === "promotional" ? theme.primary : theme.grayDark,
                  cursor: "pointer",
                  fontWeight: notificationType === "promotional" ? "600" : "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <MdLocalOffer />
                Promotional Offer
              </button>
              <button
                onClick={() => setNotificationType("broadcast")}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: `2px solid ${notificationType === "broadcast" ? theme.primary : theme.grayMedium}`,
                  backgroundColor: notificationType === "broadcast" ? theme.primary + "10" : theme.white,
                  color: notificationType === "broadcast" ? theme.primary : theme.grayDark,
                  cursor: "pointer",
                  fontWeight: notificationType === "broadcast" ? "600" : "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <MdGroup />
                General Announcement
              </button>
            </div>
          </div>

          {/* Target Selection */}
          {notificationType === "direct" && (
            <div style={{ marginBottom: "32px" }}>
              <label style={{
                display: "block",
                marginBottom: "12px",
                fontSize: "14px",
                fontWeight: "600",
                color: theme.grayDarker
              }}>
                Target
              </label>
              <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                <button
                  onClick={() => {
                    setTargetType("user");
                    setTargetUserId("");
                    setTargetRestaurantId("");
                  }}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: `2px solid ${targetType === "user" ? theme.primary : theme.grayMedium}`,
                    backgroundColor: targetType === "user" ? theme.primary + "10" : theme.white,
                    color: targetType === "user" ? theme.primary : theme.grayDark,
                    cursor: "pointer"
                  }}
                >
                  <MdPerson style={{ marginRight: "6px", verticalAlign: "middle" }} />
                  User
                </button>
                <button
                  onClick={() => {
                    setTargetType("restaurant");
                    setTargetUserId("");
                    setTargetRestaurantId("");
                  }}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: `2px solid ${targetType === "restaurant" ? theme.primary : theme.grayMedium}`,
                    backgroundColor: targetType === "restaurant" ? theme.primary + "10" : theme.white,
                    color: targetType === "restaurant" ? theme.primary : theme.grayDark,
                    cursor: "pointer"
                  }}
                >
                  <MdStore style={{ marginRight: "6px", verticalAlign: "middle" }} />
                  Restaurant
                </button>
              </div>

              {/* User/Restaurant Search */}
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder={`Search for ${targetType === "user" ? "user" : "restaurant"}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${theme.grayMedium}`,
                    borderRadius: "8px",
                    fontSize: "14px"
                  }}
                />
                {searchResults.length > 0 && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: theme.white,
                    border: `1px solid ${theme.grayMedium}`,
                    borderRadius: "8px",
                    marginTop: "4px",
                    maxHeight: "300px",
                    overflowY: "auto",
                    zIndex: 1000,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}>
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => {
                          if (targetType === "user") {
                            setTargetUserId(user.id);
                          } else {
                            setTargetRestaurantId(user.id);
                          }
                          setSearchQuery(user.name);
                          setSearchResults([]);
                        }}
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          borderBottom: `1px solid ${theme.grayLight}`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.grayLight}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.white}
                      >
                        <div>
                          <div style={{ fontWeight: "600", color: theme.grayDarker }}>
                            {user.name}
                          </div>
                          <div style={{ fontSize: "12px", color: theme.grayDark }}>
                            {user.email} • {user.type}
                          </div>
                        </div>
                        <MdCheckCircle style={{ color: theme.accent }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {notificationType === "promotional" && (
            <div style={{ marginBottom: "32px" }}>
              <label style={{
                display: "block",
                marginBottom: "12px",
                fontSize: "14px",
                fontWeight: "600",
                color: theme.grayDarker
              }}>
                Target Audience
              </label>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setTargetType("all")}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: `2px solid ${targetType === "all" ? theme.primary : theme.grayMedium}`,
                    backgroundColor: targetType === "all" ? theme.primary + "10" : theme.white,
                    color: targetType === "all" ? theme.primary : theme.grayDark,
                    cursor: "pointer"
                  }}
                >
                  Everyone
                </button>
                <button
                  onClick={() => setTargetType("clients")}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: `2px solid ${targetType === "clients" ? theme.primary : theme.grayMedium}`,
                    backgroundColor: targetType === "clients" ? theme.primary + "10" : theme.white,
                    color: targetType === "clients" ? theme.primary : theme.grayDark,
                    cursor: "pointer"
                  }}
                >
                  Clients Only
                </button>
                <button
                  onClick={() => setTargetType("restaurants")}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: `2px solid ${targetType === "restaurants" ? theme.primary : theme.grayMedium}`,
                    backgroundColor: targetType === "restaurants" ? theme.primary + "10" : theme.white,
                    color: targetType === "restaurants" ? theme.primary : theme.grayDark,
                    cursor: "pointer"
                  }}
                >
                  Restaurants Only
                </button>
              </div>
            </div>
          )}

          {/* Title */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "600",
              color: theme.grayDarker
            }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${theme.grayMedium}`,
                borderRadius: "8px",
                fontSize: "14px"
              }}
            />
          </div>

          {/* Body */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "600",
              color: theme.grayDarker
            }}>
              Content *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter notification content"
              rows={5}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${theme.grayMedium}`,
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "vertical"
              }}
            />
          </div>

          {/* Offer ID (for promotional) */}
          {notificationType === "promotional" && (
            <div style={{ marginBottom: "24px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: theme.grayDarker
              }}>
                Offer ID (Optional)
              </label>
              <input
                type="text"
                value={offerId}
                onChange={(e) => setOfferId(e.target.value)}
                placeholder="Offer ID"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${theme.grayMedium}`,
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
              />
            </div>
          )}

          {/* Image URL (for promotional) */}
          {notificationType === "promotional" && (
            <div style={{ marginBottom: "24px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: theme.grayDarker
              }}>
                Image URL (Optional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${theme.grayMedium}`,
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
              />
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSendNotification}
            disabled={loading || !title.trim() || !body.trim()}
            style={{
              width: "100%",
              padding: "16px",
              backgroundColor: loading ? theme.grayMedium : theme.primary,
              color: theme.white,
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: "20px",
                  height: "20px",
                  border: `2px solid ${theme.white}30`,
                  borderTopColor: theme.white,
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }} />
                Sending...
              </>
            ) : (
              <>
                <MdSend />
                Send Notification
              </>
            )}
          </button>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px"
          }}>
            <h3 style={{ margin: 0, color: theme.grayDarker }}>Notification History</h3>
            <button
              onClick={fetchNotificationHistory}
              disabled={loadingHistory}
              style={{
                padding: "10px 16px",
                backgroundColor: theme.primary,
                color: theme.white,
                border: "none",
                borderRadius: "8px",
                cursor: loadingHistory ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: loadingHistory ? 0.6 : 1
              }}
            >
              <MdRefresh style={{ animation: loadingHistory ? "spin 1s linear infinite" : "none" }} />
              تحديث
            </button>
          </div>

          {loadingHistory ? (
            <div style={{ textAlign: "center", padding: "40px", color: theme.grayDark }}>
              جاري التحميل...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: theme.grayDark }}>
              لا توجد إشعارات
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    padding: "20px",
                    backgroundColor: theme.white,
                    border: `1px solid ${theme.grayMedium}`,
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px"
                      }}>
                        <h4 style={{ margin: 0, color: theme.grayDarker }}>
                          {notification.title}
                        </h4>
                        <span style={{
                          padding: "4px 8px",
                          backgroundColor: theme.primary + "10",
                          color: theme.primary,
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}>
                          {getNotificationTypeLabel(notification.type)}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: theme.grayDark, lineHeight: "1.6" }}>
                        {notification.body}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    display: "flex",
                    gap: "16px",
                    fontSize: "12px",
                    color: theme.grayDark,
                    alignItems: "center"
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <MdAccessTime />
                      {formatDate(notification.createdAt)}
                    </span>
                    {notification.userId && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <MdPerson />
                        مستخدم
                      </span>
                    )}
                    {notification.restaurantId && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <MdStore />
                        مطعم
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
