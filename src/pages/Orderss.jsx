// src/pages/Orderss.jsx
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  getDoc
} from "firebase/firestore";
import {
  MdShoppingCart,
  MdRefresh,
  MdSearch,
  MdDelete,
  MdCheckCircle,
  MdCancel,
  MdPending,
  MdAccessTime,
  MdPerson,
  MdLocalShipping,
  MdStore,
  MdFilterList,
  MdEdit,
  MdVisibility,
  MdClose,
  MdReceipt,
  MdPayment,
  MdLocationOn,
  MdPhone,
  MdEmail,
  MdAttachMoney,
  MdArrowUpward,
  MdArrowDownward
} from "react-icons/md";

export default function Orderss() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [usersData, setUsersData] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    status: "",
    trackingNumber: "",
    adminNotes: "",
    shippingAddress: "",
    paymentMethod: ""
  });

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    totalRevenue: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    todayRevenue: 0,
    avgOrderValue: 0
  });

  // Fetch ALL users first and store in cache
  const fetchAllUsers = async () => {
    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const usersMap = {};

      snapshot.forEach(doc => {
        const userData = doc.data();
        usersMap[doc.id] = {
          id: doc.id,
          name: userData.name || userData.displayName || userData.username || "",
          email: userData.email || "",
          phone: userData.phone || userData.phoneNumber || ""
        };
      });

      setUsersData(usersMap);
      return usersMap;
    } catch (err) {
      console.error("Error fetching users:", err);
      return {};
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all users first
      const usersMap = await fetchAllUsers();

      const ordersRef = collection(db, "orders_v2");
      const q = query(ordersRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const data = [];

      snapshot.forEach(docSnap => {
        const docData = docSnap.data();

        // Get user data based on userId
        const user = docData.userId ? usersMap[docData.userId] : null;

        // Calculate total price - check multiple possible fields
        let totalPrice = parseFloat(docData.priceafter) ||
          parseFloat(docData.totalPrice) ||
          parseFloat(docData.total) ||
          parseFloat(docData.amount) || 0;

        // Fallback: Calculate from items if price is missing
        if (totalPrice === 0 && docData.items && Array.isArray(docData.items)) {
          totalPrice = docData.items.reduce((sum, item) => {
            const itemPrice = parseFloat(item.priceAfter) || parseFloat(item.price) || 0;
            const itemQty = parseInt(item.quantity) || 1;
            return sum + (itemPrice * itemQty);
          }, 0);

          // Add delivery fee if paymentMethod is Card (as seen in mobile app)
          if (docData.paymentMethod === 'Card') {
            totalPrice += 40;
          }
        }

        const orderData = {
          id: docSnap.id,
          ...docData,
          // User information
          userName: user?.name || docData.userName || docData.name || "Unknown User",
          userEmail: user?.email || docData.userEmail || docData.email || "",
          userPhone: user?.phone || docData.userPhone || docData.phone || "",
          // Price information
          totalPrice: totalPrice,
          // Dates
          createdAt: docData.createdAt?.toDate ? docData.createdAt.toDate() : docData.createdAt || new Date(),
          updatedAt: docData.updatedAt?.toDate ? docData.updatedAt.toDate() : docData.updatedAt || null,
          // Items
          items: docData.items || docData.cartItems || []
        };

        data.push(orderData);
      });

      setOrders(data);
      setFilteredOrders(data);

      // Calculate statistics
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const pendingCount = data.filter(order => order.status === "pending").length;
      const processingCount = data.filter(order => order.status === "processing").length;
      const shippedCount = data.filter(order => order.status === "shipped").length;
      const deliveredCount = data.filter(order => order.status === "delivered").length;
      const cancelledCount = data.filter(order => order.status === "cancelled").length;

      const totalRevenue = data.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

      const todayRevenue = data
        .filter(order => {
          const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
          return orderDate >= startOfToday;
        })
        .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

      const avgOrderValue = data.length > 0 ? totalRevenue / data.length : 0;

      setStats({
        total: data.length,
        totalRevenue,
        pending: pendingCount,
        processing: processingCount,
        shipped: shippedCount,
        delivered: deliveredCount,
        cancelled: cancelledCount,
        todayRevenue,
        avgOrderValue
      });

    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(`Failed to fetch orders: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = [...orders];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        (order.userName && order.userName.toLowerCase().includes(searchLower)) ||
        (order.userEmail && order.userEmail.toLowerCase().includes(searchLower)) ||
        (order.id && order.id.toLowerCase().includes(searchLower)) ||
        (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchLower)) ||
        (order.userPhone && order.userPhone.toString().toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply date filter
    const now = new Date();
    if (dateFilter === "today") {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
        return orderDate >= startOfToday;
      });
    } else if (dateFilter === "week") {
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
        return orderDate >= startOfWeek;
      });
    } else if (dateFilter === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
        return orderDate >= startOfMonth;
      });
    }

    // Apply sorting
    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0));
    } else if (sortBy === "price-low") {
      filtered.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));
    }

    setFilteredOrders(filtered);
  }, [searchTerm, statusFilter, dateFilter, sortBy, orders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders_v2", orderId);
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };

      await updateDoc(orderRef, updateData);
      alert(`Order marked as ${newStatus} successfully!`);
      fetchOrders();
    } catch (err) {
      console.error("Error updating order:", err);
      alert(`Failed to update order: ${err.message}`);
    }
  };

  const handleDeleteOrder = async (orderId, userName) => {
    if (!window.confirm(`Are you sure you want to delete order from "${userName || 'this user'}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "orders_v2", orderId));
      alert("Order deleted successfully!");
      fetchOrders();
      if (viewingOrder?.id === orderId) {
        setViewingOrder(null);
      }
    } catch (err) {
      console.error("Error deleting order:", err);
      alert(`Failed to delete order: ${err.message}`);
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      const orderRef = doc(db, "orders_v2", editingId);
      const updateData = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(orderRef, updateData);
      alert("Order updated successfully!");
      setEditingId(null);
      setFormData({ status: "", trackingNumber: "", adminNotes: "", shippingAddress: "", paymentMethod: "" });
      fetchOrders();
    } catch (err) {
      console.error("Error updating order:", err);
      alert(`Failed to update order: ${err.message}`);
    }
  };

  const startEditing = (order) => {
    setEditingId(order.id);
    setFormData({
      status: order.status || "",
      trackingNumber: order.trackingNumber || "",
      adminNotes: order.adminNotes || "",
      shippingAddress: order.shippingAddress || "",
      paymentMethod: order.paymentMethod || ""
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "placed": return { bg: "#FEF3C7", text: "#92400E", icon: <MdPending /> };
      case "processing":
      case "accepted":
      case "preparing": return { bg: "#DBEAFE", text: "#1E40AF", icon: <MdAccessTime /> };
      case "shipped":
      case "delivered": return { bg: "#E0E7FF", text: "#3730A3", icon: <MdLocalShipping /> };
      case "reached":
      case "completed": return { bg: "#D1FAE5", text: "#065F46", icon: <MdCheckCircle /> };
      case "cancelled": return { bg: "#FEE2E2", text: "#991B1B", icon: <MdCancel /> };
      default: return { bg: "#E5E7EB", text: "#374151", icon: <MdAccessTime /> };
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "placed": return "Pending";
      case "processing":
      case "accepted":
      case "preparing": return "Processing";
      case "shipped": return "Shipped";
      case "delivered": return "Delivered";
      case "reached": return "Reached";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      default: return status || "Unknown";
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(numAmount);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return "Invalid Date";
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return "N/A";
    const cleaned = phone.toString().replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone.toString();
  };

  const getItemsCount = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.length;
  };

  const getTotalItems = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + (parseInt(item.quantity) || 1), 0);
  };

  const renderOrderDetailsModal = () => {
    if (!viewingOrder) return null;

    const statusColor = getStatusColor(viewingOrder.status);
    const orderItems = viewingOrder.items || viewingOrder.cartItems || [];

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
        padding: '20px'
      }} onClick={() => setViewingOrder(null)}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }} onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#F8FAFC'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1E293B' }}>
                Order Details
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748B' }}>
                ID: #{viewingOrder.id}
              </p>
            </div>
            <button
              onClick={() => setViewingOrder(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748B',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <MdClose size={24} />
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', marginBottom: '24px' }}>
              {/* Customer Info */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B' }}>
                  <MdPerson color="#01615F" /> Customer Information
                </h3>
                <div style={{ backgroundColor: '#F1F5F9', padding: '16px', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '14px' }}><strong>Name:</strong> {viewingOrder.userName || viewingOrder.name}</p>
                  <p style={{ margin: '0 0 8px', fontSize: '14px' }}><strong>Email:</strong> {viewingOrder.userEmail || viewingOrder.email}</p>
                  <p style={{ margin: '0 0 8px', fontSize: '14px' }}><strong>Phone:</strong> {formatPhoneNumber(viewingOrder.userPhone || viewingOrder.phone)}</p>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748B', wordBreak: 'break-all' }}><strong>User ID:</strong> {viewingOrder.userId}</p>
                  <p style={{ margin: '0', fontSize: '11px', color: '#64748B', wordBreak: 'break-all' }}><strong>Restaurant ID:</strong> {viewingOrder.restaurantId || 'No ID'}</p>
                </div>
              </div>

              {/* Order Status & Payment */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B' }}>
                  <MdPayment color="#01615F" /> Payment & Status
                </h3>
                <div style={{ backgroundColor: '#F1F5F9', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', marginRight: '8px' }}><strong>Status:</strong></span>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: statusColor.bg,
                      color: statusColor.text,
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}>
                      {getStatusText(viewingOrder.status)}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: '14px' }}><strong>Method:</strong> {viewingOrder.paymentMethod || 'Cash'}</p>
                  <p style={{ margin: '0 0 8px', fontSize: '14px' }}><strong>Total:</strong> <span style={{ color: '#01615F', fontWeight: '700' }}>{formatCurrency(viewingOrder.totalPrice)}</span></p>
                  <p style={{ margin: '0', fontSize: '12px', color: '#64748B' }}><strong>Created:</strong> {formatDate(viewingOrder.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B' }}>
                <MdLocationOn color="#01615F" /> Delivery Address
              </h3>
              <div style={{ backgroundColor: '#F1F5F9', padding: '16px', borderRadius: '12px' }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                  {viewingOrder.address || viewingOrder.shippingAddress || 'No address provided'}
                </p>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B' }}>
                <MdStore color="#01615F" /> Order Items ({orderItems.length})
              </h3>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                {orderItems.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: idx === orderItems.length - 1 ? 'none' : '1px solid #E2E8F0',
                    backgroundColor: idx % 2 === 0 ? 'white' : '#F8FAFC'
                  }}>
                    {item.image && (
                      <img src={item.image} alt={item.name} style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover', marginRight: '16px' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{item.name || item.title}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>Quantity: {item.quantity || 1}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#01615F' }}>
                        {formatCurrency((parseFloat(item.priceAfter) || parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1))}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748B' }}>
                        {formatCurrency(item.priceAfter || item.price || 0)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Notes */}
            {viewingOrder.adminNotes && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Admin Notes</h3>
                <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', padding: '16px', borderRadius: '12px', color: '#92400E', fontSize: '14px' }}>
                  {viewingOrder.adminNotes}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              onClick={() => startEditing(viewingOrder)}
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <MdEdit /> Edit Status
            </button>
            <button
              onClick={() => setViewingOrder(null)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#01615F',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Debug: Log orders data to console
  useEffect(() => {
    if (orders.length > 0) {
      console.log("Orders data:", orders);
      console.log("First order details:", orders[0]);
      console.log("Users data:", usersData);
    }
  }, [orders]);

  return (
    <div style={{ padding: "0 10px" }}>
      {/* Header Section */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 30,
        padding: "20px 0"
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: "600",
            color: "#2D3748",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <MdShoppingCart style={{ color: "#01615F" }} />
            Orders Management
          </h1>
          <p style={{
            margin: "8px 0 0",
            color: "#718096",
            fontSize: "14px"
          }}>
            Manage and track all customer orders
          </p>
        </div>

        <button
          onClick={fetchOrders}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            backgroundColor: "#01615F",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "14px",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = "#028C89"}
          onMouseOut={(e) => e.target.style.backgroundColor = "#01615F"}
        >
          <MdRefresh />
          Refresh
        </button>
      </div>

      {/* Debug button to check data */}
      <button
        onClick={() => {
          console.log("Orders:", orders);
          console.log("Users Data:", usersData);
          alert(`Loaded ${orders.length} orders. Check console for details.`);
        }}
        style={{
          padding: "8px 16px",
          backgroundColor: "#4F46E5",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "12px",
          marginBottom: "20px",
          cursor: "pointer"
        }}
      >
        Debug Data
      </button>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px"
        }}>
          <MdCancel style={{ color: "#DC2626", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ color: "#DC2626" }}>Error:</strong>
            <p style={{ margin: "4px 0 0", color: "#7F1D1D" }}>{error}</p>
            <button
              onClick={fetchOrders}
              style={{
                marginTop: "8px",
                padding: "6px 12px",
                backgroundColor: "#DC2626",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: 30
      }}>
        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          borderLeft: "4px solid #01615F"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#E6FFFA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#01615F"
            }}>
              <MdShoppingCart size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Total Orders</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          borderLeft: "4px solid #10B981"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#D1FAE5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10B981"
            }}>
              <MdAttachMoney size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Total Revenue</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          borderLeft: "4px solid #F59E0B"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#FEF3C7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#F59E0B"
            }}>
              <MdAttachMoney size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Today's Revenue</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {formatCurrency(stats.todayRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          borderLeft: "4px solid #8B5CF6"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#EDE9FE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#8B5CF6"
            }}>
              <MdReceipt size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Avg. Order Value</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {formatCurrency(stats.avgOrderValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        marginBottom: 20
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "300px" }}>
            <MdSearch style={{
              position: "absolute",
              left: "15px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#A0AEC0"
            }} />
            <input
              type="text"
              placeholder="Search orders by user name, email, phone, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 20px 12px 45px",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "#F7FAFC",
                transition: "all 0.2s ease"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#01615F";
                e.target.style.backgroundColor = "white";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E2E8F0";
                e.target.style.backgroundColor = "#F7FAFC";
              }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <MdFilterList style={{ color: "#718096" }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "10px 15px",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "white",
                color: "#4A5568",
                cursor: "pointer",
                minWidth: "120px"
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <MdAccessTime style={{ color: "#718096" }} />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: "10px 15px",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "white",
                color: "#4A5568",
                cursor: "pointer",
                minWidth: "100px"
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "10px 15px",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "white",
                color: "#4A5568",
                cursor: "pointer",
                minWidth: "140px"
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
            </select>
          </div>

          <div style={{
            padding: "8px 16px",
            backgroundColor: "#EDF2F7",
            borderRadius: "6px",
            fontSize: "14px",
            color: "#4A5568",
            fontWeight: "500",
            whiteSpace: "nowrap"
          }}>
            Showing {filteredOrders.length} of {orders.length}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && !error && (
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "60px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
        }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: "4px solid #E2E8F0",
            borderTopColor: "#01615F",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px"
          }} />
          <p style={{ color: "#718096", fontWeight: "500" }}>Loading orders...</p>
        </div>
      )}

      {/* Error or Empty State */}
      {!loading && error && (
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "60px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "#FEF2F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            color: "#DC2626"
          }}>
            <MdCancel size={40} />
          </div>
          <h3 style={{ margin: "0 0 10px", color: "#2D3748" }}>Failed to Load Orders</h3>
          <p style={{ color: "#718096", marginBottom: "20px" }}>
            {error}
          </p>
          <button
            onClick={fetchOrders}
            style={{
              padding: "10px 24px",
              backgroundColor: "#DC2626",
              border: "none",
              color: "white",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <MdRefresh />
            Retry Loading
          </button>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && filteredOrders.length === 0 && orders.length === 0 && (
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "60px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "#F7FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            color: "#A0AEC0"
          }}>
            <MdShoppingCart size={40} />
          </div>
          <h3 style={{ margin: "0 0 10px", color: "#2D3748" }}>
            {searchTerm || statusFilter !== "all" || dateFilter !== "all" ? "No matching orders found" : "No orders found"}
          </h3>
          <p style={{ color: "#718096", marginBottom: "20px" }}>
            {searchTerm || statusFilter !== "all" || dateFilter !== "all" ? "Try a different search or filter" : "No orders have been placed yet"}
          </p>
          {(searchTerm || statusFilter !== "all" || dateFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setDateFilter("all");
                setSortBy("newest");
              }}
              style={{
                padding: "10px 24px",
                backgroundColor: "#01615F",
                border: "none",
                color: "white",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Orders Table */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          overflow: "hidden"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "1200px"
            }}>
              <thead>
                <tr style={{
                  backgroundColor: "#F7FAFC",
                  borderBottom: "2px solid #E2E8F0"
                }}>
                  <th style={{
                    padding: "16px 20px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#4A5568",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Order & Customer</th>
                  <th style={{
                    padding: "16px 20px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#4A5568",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Items</th>
                  <th style={{
                    padding: "16px 20px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#4A5568",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Payment & Total</th>
                  <th style={{
                    padding: "16px 20px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#4A5568",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Status</th>
                  <th style={{
                    padding: "16px 20px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#4A5568",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Date</th>
                  <th style={{
                    padding: "16px 20px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#4A5568",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => {
                  const statusColor = getStatusColor(order.status);
                  const orderTotal = order.totalPrice || 0;
                  const orderItems = order.items || [];

                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: "1px solid #EDF2F7",
                        backgroundColor: index % 2 === 0 ? "white" : "#F9FAFB",
                        transition: "background-color 0.2s ease",
                        cursor: "pointer"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#F0FFF4"}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "white" : "#F9FAFB"}
                      onClick={() => setViewingOrder(order)}
                    >
                      <td style={{ padding: "16px 20px" }}>
                        <div>
                          <div style={{ marginBottom: "8px" }}>
                            <div style={{
                              padding: "4px 8px",
                              backgroundColor: "#EDF2F7",
                              borderRadius: "4px",
                              fontSize: "12px",
                              color: "#4A5568",
                              fontWeight: "600",
                              display: "inline-block",
                              marginBottom: "6px"
                            }}>
                              #{order.id.substring(0, 8)}...
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <MdPerson size={16} color="#718096" />
                            <strong style={{ color: "#2D3748", fontSize: "14px" }}>{order.userName}</strong>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", fontSize: "13px" }}>
                            <MdEmail size={14} color="#718096" />
                            <span style={{ color: "#4A5568" }}>{order.userEmail || "No email"}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                            <MdPhone size={14} color="#718096" />
                            <span style={{ color: "#4A5568" }}>{formatPhoneNumber(order.userPhone)}</span>
                          </div>
                          {order.userId && (
                            <div style={{
                              marginTop: "6px",
                              fontSize: "11px",
                              color: "#718096",
                              backgroundColor: "#EDF2F7",
                              padding: "2px 6px",
                              borderRadius: "3px",
                              display: "inline-block"
                            }}>
                              User ID: {order.userId.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: "16px 20px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <MdStore size={16} color="#718096" />
                            <span style={{ color: "#4A5568", fontSize: "14px", fontWeight: "500" }}>
                              {getItemsCount(orderItems)} items
                            </span>
                          </div>
                          {orderItems.length > 0 && (
                            <div style={{
                              backgroundColor: "#F7FAFC",
                              borderRadius: "6px",
                              padding: "8px",
                              fontSize: "12px",
                              color: "#4A5568"
                            }}>
                              <div style={{ fontWeight: "600", marginBottom: "4px" }}>Items:</div>
                              {orderItems.slice(0, 2).map((item, idx) => (
                                <div key={idx} style={{ marginBottom: "2px" }}>
                                  • {item.name || item.title || `Item ${idx + 1}`} {item.quantity ? `(x${item.quantity})` : ''}
                                </div>
                              ))}
                              {orderItems.length > 2 && (
                                <div style={{ color: "#718096", fontStyle: "italic", marginTop: "4px" }}>
                                  +{orderItems.length - 2} more items
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: "16px 20px" }}>
                        <div>
                          <div style={{ marginBottom: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                              <MdPayment size={16} color="#718096" />
                              <span style={{ color: "#4A5568", fontSize: "13px" }}>
                                {order.paymentMethod || "Not specified"}
                              </span>
                            </div>
                            {order.paymentStatus && (
                              <div style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                backgroundColor: order.paymentStatus === "paid" ? "#D1FAE5" : "#FEF3C7",
                                color: order.paymentStatus === "paid" ? "#065F46" : "#92400E",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "600"
                              }}>
                                {order.paymentStatus === "paid" ? "Paid" : "Pending"}
                              </div>
                            )}
                          </div>
                          <div style={{
                            fontSize: "18px",
                            fontWeight: "700",
                            color: "#01615F",
                            marginTop: "8px"
                          }}>
                            {formatCurrency(orderTotal)}
                          </div>
                          {order.priceafter && (
                            <div style={{
                              fontSize: "12px",
                              color: "#718096",
                              marginTop: "4px"
                            }}>
                              Price: {formatCurrency(order.priceafter)}
                            </div>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: "16px 20px" }}>
                        <select
                          value={order.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(order.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 12px",
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                            borderRadius: "20px",
                            fontSize: "13px",
                            fontWeight: "600",
                            border: "none",
                            cursor: "pointer",
                            appearance: "none",
                            WebkitAppearance: "none",
                            textAlign: "center"
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="placed">Placed</option>
                          <option value="processing">Processing</option>
                          <option value="accepted">Accepted</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="on_the_way">On the Way</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="reached">Reached</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="refused">Refused</option>
                        </select>
                        {order.trackingNumber && (
                          <div style={{
                            marginTop: "8px",
                            fontSize: "12px",
                            color: "#4A5568",
                            backgroundColor: "#EDF2F7",
                            padding: "4px 8px",
                            borderRadius: "4px"
                          }}>
                            📦 {order.trackingNumber.substring(0, 12)}...
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#718096" }}>
                        {formatDate(order.createdAt)}
                      </td>

                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingOrder(order);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#01615F",
                              cursor: "pointer",
                              fontSize: "18px",
                              padding: "4px",
                              borderRadius: "4px",
                              transition: "background-color 0.2s ease"
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = "#E6FFFA"}
                            onMouseOut={(e) => e.target.style.backgroundColor = "transparent"}
                            title="View Details"
                          >
                            <MdVisibility />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(order);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#01615F",
                              cursor: "pointer",
                              fontSize: "18px",
                              padding: "4px",
                              borderRadius: "4px",
                              transition: "background-color 0.2s ease"
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = "#E6FFFA"}
                            onMouseOut={(e) => e.target.style.backgroundColor = "transparent"}
                            title="Edit"
                          >
                            <MdEdit />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrder(order.id, order.userName);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#F56565",
                              cursor: "pointer",
                              fontSize: "18px",
                              padding: "4px",
                              borderRadius: "4px",
                              transition: "background-color 0.2s ease"
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = "#FFF5F5"}
                            onMouseOut={(e) => e.target.style.backgroundColor = "transparent"}
                            title="Delete"
                          >
                            <MdDelete />
                          </button>
                        </div>

                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {renderOrderDetailsModal()}

      {/* Add CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}