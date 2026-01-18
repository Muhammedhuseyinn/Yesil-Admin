import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    getDocs,
    where
} from "firebase/firestore";
import {
    MdChat,
    MdSend,
    MdClose,
    MdSearch,
    MdPerson,
    MdShoppingCart,
    MdAccessTime,
    MdCheckCircle,
    MdError,
    MdRefresh
} from "react-icons/md";

// Theme constants matching App.jsx
const theme = {
    primary: "#01615F",
    primaryLight: "#028C89",
    accent: "#10B981",
    red: "#EF4444",
    grayLight: "#F7FAFC",
    grayMedium: "#E2E8F0",
    grayDark: "#4A5568",
    grayDarker: "#2D3748",
    white: "#FFFFFF",
};

export default function Chats() {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [orders, setOrders] = useState({});
    const messagesEndRef = useRef(null);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch all chat statuses
    useEffect(() => {
        const q = query(collection(db, "chatStatus"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const chatList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setChats(chatList);
            setLoading(false);

            // Fetch order details for each chat to get user names
            const orderIds = [...new Set(chatList.map(chat => chat.orderId))].filter(id => !!id);
            if (orderIds.length > 0) {
                const ordersData = {};
                for (const orderId of orderIds) {
                    if (!orders[orderId]) {
                        const orderDoc = await getDoc(doc(db, "orders_v2", orderId));
                        if (orderDoc.exists()) {
                            ordersData[orderId] = orderDoc.data();
                        }
                    }
                }
                setOrders(prev => ({ ...prev, ...ordersData }));
            }
        });

        return () => unsubscribe();
    }, []);

    // Fetch messages for active chat
    useEffect(() => {
        if (!activeChat) {
            setMessages([]);
            return;
        }

        const messagesRef = collection(db, "chats", activeChat.id, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [activeChat]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        try {
            const messagesRef = collection(db, "chats", activeChat.id, "messages");
            await addDoc(messagesRef, {
                text: newMessage,
                senderId: "admin",
                timestamp: new Date().toISOString(),
                isCustomer: false
            });

            // Update last message timestamp in chatStatus
            const statusRef = doc(db, 'chatStatus', activeChat.id);
            await updateDoc(statusRef, {
                lastMessageAt: new Date().toISOString(),
                lastMessageSender: 'admin'
            });

            setNewMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message");
        }
    };

    const endChat = async (chatId, isAuto = false) => {
        if (!isAuto && !window.confirm("Are you sure you want to end this chat?")) return;

        try {
            const statusRef = doc(db, "chatStatus", chatId);
            await updateDoc(statusRef, {
                status: "ended",
                endedAt: new Date().toISOString(),
                closedReason: isAuto ? 'timeout' : 'manual'
            });

            // Add system message
            const messagesRef = collection(db, "chats", chatId, "messages");
            await addDoc(messagesRef, {
                text: isAuto ? "Chat ended automatically due to 5 minutes of inactivity" : "Chat ended by admin",
                senderId: "system",
                timestamp: new Date().toISOString(),
                isSystem: true
            });

            if (activeChat?.id === chatId) {
                setActiveChat(prev => prev ? { ...prev, status: 'ended' } : null);
            }
        } catch (error) {
            console.error("Error ending chat:", error);
            if (!isAuto) alert("Failed to end chat");
        }
    };

    // Inactivity Checker (Auto-close after 5 minutes)
    useEffect(() => {
        const checkInactivity = () => {
            const now = new Date();
            const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

            chats.forEach(chat => {
                if (chat.status === 'active' && chat.lastMessageAt) {
                    const lastMsgTime = new Date(chat.lastMessageAt);
                    if (now - lastMsgTime > TIMEOUT_MS) {
                        console.log(`Auto-closing chat ${chat.id} due to inactivity`);
                        endChat(chat.id, true);
                    }
                }
            });
        };

        const interval = setInterval(checkInactivity, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [chats]);

    const filteredChats = chats.filter(chat => {
        const order = orders[chat.orderId] || {};
        const searchLower = searchTerm.toLowerCase();
        return (
            chat.orderId.toLowerCase().includes(searchLower) ||
            (order.userName && order.userName.toLowerCase().includes(searchLower)) ||
            (order.name && order.name.toLowerCase().includes(searchLower))
        );
    });

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: theme.grayDark }}>
                <p>Loading chats...</p>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", height: "calc(100vh - 140px)", gap: "20px" }}>
            {/* Chat List Sidebar */}
            <div style={{
                width: "350px",
                backgroundColor: "white",
                borderRadius: "16px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                overflow: "hidden"
            }}>
                <div style={{ padding: "20px", borderBottom: `1px solid ${theme.grayMedium}` }}>
                    <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <MdChat color={theme.primary} /> Support Chats
                    </h2>
                    <div style={{ position: "relative" }}>
                        <MdSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: theme.grayDark }} />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 10px 10px 40px",
                                borderRadius: "10px",
                                border: `1px solid ${theme.grayMedium}`,
                                fontSize: "14px",
                                backgroundColor: theme.grayLight
                            }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto" }}>
                    {filteredChats.length === 0 ? (
                        <div style={{ padding: "40px 20px", textAlign: "center", color: theme.grayDark }}>
                            <MdError size={40} style={{ opacity: 0.3, marginBottom: "10px" }} />
                            <p>No chats found</p>
                        </div>
                    ) : (
                        filteredChats.map(chat => {
                            const order = orders[chat.orderId] || {};
                            const isActive = activeChat?.id === chat.id;

                            return (
                                <div
                                    key={chat.id}
                                    onClick={() => setActiveChat(chat)}
                                    style={{
                                        padding: "15px 20px",
                                        borderBottom: `1px solid ${theme.grayLight}`,
                                        cursor: "pointer",
                                        backgroundColor: isActive ? `${theme.primary}10` : "transparent",
                                        borderLeft: isActive ? `4px solid ${theme.primary}` : "4px solid transparent",
                                        transition: "all 0.2s ease"
                                    }}
                                    onMouseOver={(e) => !isActive && (e.currentTarget.style.backgroundColor = theme.grayLight)}
                                    onMouseOut={(e) => !isActive && (e.currentTarget.style.backgroundColor = "transparent")}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                        <span style={{ fontWeight: "700", fontSize: "14px", color: theme.grayDarker }}>
                                            {order.userName || order.name || "Customer"}
                                        </span>
                                        <span style={{ fontSize: "11px", color: theme.grayDark }}>
                                            {chat.createdAt ? new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: theme.grayDark, display: "flex", alignItems: "center", gap: "5px" }}>
                                        <MdShoppingCart size={14} /> Order #{chat.orderId.substring(0, 8)}
                                    </div>
                                    <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{
                                            fontSize: "10px",
                                            padding: "2px 8px",
                                            borderRadius: "10px",
                                            backgroundColor: chat.status === "active" ? `${theme.accent}20` : `${theme.grayDark}20`,
                                            color: chat.status === "active" ? theme.accent : theme.grayDark,
                                            fontWeight: "700"
                                        }}>
                                            {chat.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Conversation Area */}
            <div style={{
                flex: 1,
                backgroundColor: "white",
                borderRadius: "16px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                overflow: "hidden"
            }}>
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div style={{
                            padding: "15px 25px",
                            borderBottom: `1px solid ${theme.grayMedium}`,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: theme.grayLight
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                <div style={{
                                    width: "45px",
                                    height: "45px",
                                    borderRadius: "50%",
                                    backgroundColor: theme.primary,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontWeight: "700"
                                }}>
                                    {(orders[activeChat.orderId]?.userName || orders[activeChat.orderId]?.name || "C").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                                        {orders[activeChat.orderId]?.userName || orders[activeChat.orderId]?.name || "Customer"}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: "12px", color: theme.grayDark }}>
                                        Order: #{activeChat.orderId}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                                {activeChat.status === 'active' && (
                                    <button
                                        onClick={() => endChat(activeChat.id)}
                                        style={{
                                            padding: "8px 15px",
                                            backgroundColor: "white",
                                            border: `1px solid ${theme.red}`,
                                            color: theme.red,
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "5px"
                                        }}
                                    >
                                        <MdClose /> End Chat
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Messages Body */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "15px", backgroundColor: "#f0f2f5" }}>
                            {messages.map((msg, idx) => (
                                <div key={idx} style={{
                                    alignSelf: msg.isSystem ? 'center' : (msg.isCustomer ? 'flex-start' : 'flex-end'),
                                    maxWidth: msg.isSystem ? '90%' : '70%',
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: msg.isSystem ? 'center' : (msg.isCustomer ? 'flex-start' : 'flex-end')
                                }}>
                                    <div style={{
                                        padding: "10px 16px",
                                        borderRadius: "18px",
                                        backgroundColor: msg.isSystem ? theme.grayMedium : (msg.isCustomer ? "white" : theme.primary),
                                        color: msg.isSystem ? theme.grayDark : (msg.isCustomer ? theme.grayDarker : "white"),
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                                        fontSize: "14px",
                                        lineHeight: "1.4",
                                        borderBottomLeftRadius: msg.isCustomer ? "4px" : "18px",
                                        borderBottomRightRadius: !msg.isCustomer && !msg.isSystem ? "4px" : "18px"
                                    }}>
                                        {msg.text}
                                    </div>
                                    <span style={{ fontSize: "10px", color: theme.grayDark, marginTop: "4px" }}>
                                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                    </span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div style={{ padding: "20px", borderTop: `1px solid ${theme.grayMedium}` }}>
                            {activeChat.status === 'active' ? (
                                <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "10px" }}>
                                    <input
                                        type="text"
                                        placeholder="Type your message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: "12px 20px",
                                            borderRadius: "25px",
                                            border: `1px solid ${theme.grayMedium}`,
                                            backgroundColor: theme.grayLight,
                                            outline: "none"
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        style={{
                                            width: "45px",
                                            height: "45px",
                                            borderRadius: "50%",
                                            backgroundColor: newMessage.trim() ? theme.primary : theme.grayMedium,
                                            color: "white",
                                            border: "none",
                                            cursor: newMessage.trim() ? "pointer" : "default",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        <MdSend size={20} />
                                    </button>
                                </form>
                            ) : (
                                <div style={{ textAlign: "center", padding: "10px", backgroundColor: theme.grayLight, borderRadius: "8px", color: theme.grayDark, fontStyle: "italic", fontSize: "14px" }}>
                                    This conversation has ended.
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", color: theme.grayDark }}>
                        <MdChat size={80} style={{ opacity: 0.1, marginBottom: "20px" }} />
                        <h3 style={{ margin: 0 }}>Select a chat to view messages</h3>
                        <p style={{ marginTop: "10px", fontSize: "14px", opacity: 0.7 }}>Choose an active customer support session from the list on the left.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
