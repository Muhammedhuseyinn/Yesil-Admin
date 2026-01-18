// src/pages/Users.jsx
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
  where
} from "firebase/firestore";
import { 
  MdPerson, 
  MdRefresh, 
  MdSearch, 
  MdDelete, 
  MdCheckCircle,
  MdCancel,
  MdLocationOn,
  MdPhone,
  MdEmail,
  MdFilterList,
  MdEdit,
  MdVisibility,
  MdClose,
  MdAccessTime,
  MdShoppingCart,
  MdStar,
  MdVerified,
  MdNotifications,
  MdRestaurant,
  MdRestaurantMenu,
  MdLocalDining,
  MdGroup,
  MdStore,
  MdAdminPanelSettings,
  MdBlock,
  MdLockOpen,
  MdLock,
  MdCalendarToday,
  MdAttachMoney
} from "react-icons/md";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "active", "inactive", "blocked"
  const [userTypeFilter, setUserTypeFilter] = useState("all"); // "all", "client", "restaurant", "admin"
  const [activeTab, setActiveTab] = useState("all"); // "all", "clients", "restaurants"
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    type: "",
    status: "",
    emailVerified: false,
    phoneVerified: false,
    restaurantName: "",
    restaurantType: "",
    cuisineType: "",
    deliveryFee: "",
    minOrder: "",
    adminNotes: ""
  });

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    clients: 0,
    restaurants: 0,
    admins: 0,
    active: 0,
    inactive: 0,
    blocked: 0,
    verified: 0,
    todayRegistered: 0,
    totalOrders: 0,
    totalRevenue: 0
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map(doc => { 
        const docData = doc.data();
        
        return {
          id: doc.id, 
          ...docData,
          createdAt: docData.createdAt?.toDate ? docData.createdAt.toDate() : docData.createdAt || new Date(),
          updatedAt: docData.updatedAt?.toDate ? docData.updatedAt.toDate() : docData.updatedAt || null,
          lastLogin: docData.lastLogin?.toDate ? docData.lastLogin.toDate() : docData.lastLogin || null
        };
      });
      
      setUsers(data);
      setFilteredUsers(data);
      
      // Calculate statistics
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const clientsCount = data.filter(u => u.type === "client").length;
      const restaurantsCount = data.filter(u => u.type === "restaurant").length;
      const adminsCount = data.filter(u => u.type === "admin").length;
      const activeCount = data.filter(u => u.status === "active").length;
      const inactiveCount = data.filter(u => u.status === "inactive").length;
      const blockedCount = data.filter(u => u.status === "blocked").length;
      const verifiedCount = data.filter(u => u.emailVerified === true || u.phoneVerified === true).length;
      const todayRegistered = data.filter(u => {
        const userDate = u.createdAt instanceof Date ? u.createdAt : new Date(u.createdAt);
        return userDate >= startOfToday;
      }).length;
      
      // Calculate orders and revenue (these would come from a separate orders collection)
      const totalOrders = 0; // You would fetch this from orders collection
      const totalRevenue = 0; // You would fetch this from orders collection
      
      setStats({
        total: data.length,
        clients: clientsCount,
        restaurants: restaurantsCount,
        admins: adminsCount,
        active: activeCount,
        inactive: inactiveCount,
        blocked: blockedCount,
        verified: verifiedCount,
        todayRegistered,
        totalOrders,
        totalRevenue
      });
      
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(`Failed to fetch users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = [...users];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        (user.name && user.name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.phone && user.phone.includes(searchTerm)) ||
        (user.address && user.address.toLowerCase().includes(searchLower)) ||
        (user.restaurantName && user.restaurantName.toLowerCase().includes(searchLower)) ||
        (user.id && user.id.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.status === statusFilter);
    }
    
    // Apply type filter
    if (userTypeFilter !== "all") {
      filtered = filtered.filter(user => user.type === userTypeFilter);
    }
    
    // Apply tab filter
    if (activeTab === "clients") {
      filtered = filtered.filter(user => user.type === "client");
    } else if (activeTab === "restaurants") {
      filtered = filtered.filter(user => user.type === "restaurant");
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, statusFilter, userTypeFilter, activeTab, users]);

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      const userRef = doc(db, "users", userId);
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(userRef, updateData);
      alert(`User status updated to ${newStatus} successfully!`);
      fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      alert(`Failed to update user: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name || 'this user'}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, "users", userId));
      alert("User deleted successfully!");
      fetchUsers();
      if (viewingUser?.id === userId) {
        setViewingUser(null);
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(`Failed to delete user: ${err.message}`);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const userRef = doc(db, "users", editingId);
      const updateData = {
        ...formData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(userRef, updateData);
      alert("User updated successfully!");
      setEditingId(null);
      resetFormData();
      fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      alert(`Failed to update user: ${err.message}`);
    }
  };

  const startEditing = (user) => {
    setEditingId(user.id);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      type: user.type || "",
      status: user.status || "",
      emailVerified: user.emailVerified || false,
      phoneVerified: user.phoneVerified || false,
      restaurantName: user.restaurantName || "",
      restaurantType: user.restaurantType || "",
      cuisineType: user.cuisineType || "",
      deliveryFee: user.deliveryFee || "",
      minOrder: user.minOrder || "",
      adminNotes: user.adminNotes || ""
    });
  };

  const resetFormData = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      type: "",
      status: "",
      emailVerified: false,
      phoneVerified: false,
      restaurantName: "",
      restaurantType: "",
      cuisineType: "",
      deliveryFee: "",
      minOrder: "",
      adminNotes: ""
    });
  };

  const getUserTypeColor = (type) => {
    switch(type) {
      case "client": return { bg: "#DBEAFE", text: "#1E40AF", icon: <MdPerson /> };
      case "restaurant": return { bg: "#D1FAE5", text: "#065F46", icon: <MdRestaurant /> };
      case "admin": return { bg: "#FEF3C7", text: "#92400E", icon: <MdAdminPanelSettings /> };
      default: return { bg: "#E5E7EB", text: "#374151", icon: <MdPerson /> };
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "active": return { bg: "#D1FAE5", text: "#065F46", icon: <MdCheckCircle /> };
      case "inactive": return { bg: "#FEE2E2", text: "#991B1B", icon: <MdCancel /> };
      case "blocked": return { bg: "#FEF3C7", text: "#92400E", icon: <MdBlock /> };
      default: return { bg: "#E5E7EB", text: "#374151", icon: <MdAccessTime /> };
    }
  };

  const getUserTypeText = (type) => {
    switch(type) {
      case "client": return "Client";
      case "restaurant": return "Restaurant";
      case "admin": return "Admin";
      default: return "Unknown";
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case "active": return "Active";
      case "inactive": return "Inactive";
      case "blocked": return "Blocked";
      default: return "Unknown";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
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
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

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
            <MdGroup style={{ color: "#01615F" }} />
            Users Management
          </h1>
          <p style={{ 
            margin: "8px 0 0", 
            color: "#718096", 
            fontSize: "14px" 
          }}>
            Manage all users including clients, restaurants, and admins
          </p>
        </div>
        
        <button
          onClick={fetchUsers}
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
              onClick={fetchUsers}
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
              <MdGroup size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Total Users</p>
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
          borderLeft: "4px solid #3B82F6"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#DBEAFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3B82F6"
            }}>
              <MdPerson size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Clients</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {stats.clients}
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
              <MdRestaurant size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Restaurants</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {stats.restaurants}
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
              <MdVerified size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Verified</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {stats.verified}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Type Tabs */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
      }}>
        <div style={{ 
          display: "flex", 
          gap: "10px", 
          marginBottom: "20px",
          borderBottom: "1px solid #E2E8F0",
          paddingBottom: "10px"
        }}>
          <button
            onClick={() => setActiveTab("all")}
            style={{
              padding: "10px 20px",
              backgroundColor: activeTab === "all" ? "#01615F" : "transparent",
              color: activeTab === "all" ? "white" : "#4A5568",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <MdGroup />
            All Users ({stats.total})
          </button>
          
          <button
            onClick={() => setActiveTab("clients")}
            style={{
              padding: "10px 20px",
              backgroundColor: activeTab === "clients" ? "#3B82F6" : "transparent",
              color: activeTab === "clients" ? "white" : "#4A5568",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <MdPerson />
            Clients ({stats.clients})
          </button>
          
          <button
            onClick={() => setActiveTab("restaurants")}
            style={{
              padding: "10px 20px",
              backgroundColor: activeTab === "restaurants" ? "#10B981" : "transparent",
              color: activeTab === "restaurants" ? "white" : "#4A5568",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <MdRestaurant />
            Restaurants ({stats.restaurants})
          </button>
        </div>

        {/* Search and Filter Section */}
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
              placeholder="Search users by name, email, phone, or restaurant name..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          
          {/* User Type Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <MdGroup style={{ color: "#718096" }} />
            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
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
              <option value="all">All Types</option>
              <option value="client">Client</option>
              <option value="restaurant">Restaurant</option>
              <option value="admin">Admin</option>
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
            Showing {filteredUsers.length} of {users.length}
          </div>
        </div>
      </div>

      {/* Quick Stats for Active Tab */}
      {activeTab === "clients" && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
          gap: "15px", 
          marginBottom: 20 
        }}>
          <div style={{ 
            backgroundColor: "white", 
            padding: "15px", 
            borderRadius: "10px",
            boxShadow: "0 1px 5px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <div style={{ 
              width: "12px", 
              height: "12px", 
              borderRadius: "50%", 
              backgroundColor: "#10B981" 
            }}></div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096" }}>Active Clients</p>
              <p style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: "600", color: "#2D3748" }}>
                {users.filter(u => u.type === "client" && u.status === "active").length}
              </p>
            </div>
          </div>

          <div style={{ 
            backgroundColor: "white", 
            padding: "15px", 
            borderRadius: "10px",
            boxShadow: "0 1px 5px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <div style={{ 
              width: "12px", 
              height: "12px", 
              borderRadius: "50%", 
              backgroundColor: "#EF4444" 
            }}></div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096" }}>Blocked Clients</p>
              <p style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: "600", color: "#2D3748" }}>
                {users.filter(u => u.type === "client" && u.status === "blocked").length}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "restaurants" && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
          gap: "15px", 
          marginBottom: 20 
        }}>
          <div style={{ 
            backgroundColor: "white", 
            padding: "15px", 
            borderRadius: "10px",
            boxShadow: "0 1px 5px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <div style={{ 
              width: "12px", 
              height: "12px", 
              borderRadius: "50%", 
              backgroundColor: "#10B981" 
            }}></div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096" }}>Active Restaurants</p>
              <p style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: "600", color: "#2D3748" }}>
                {users.filter(u => u.type === "restaurant" && u.status === "active").length}
              </p>
            </div>
          </div>

          <div style={{ 
            backgroundColor: "white", 
            padding: "15px", 
            borderRadius: "10px",
            boxShadow: "0 1px 5px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <div style={{ 
              width: "12px", 
              height: "12px", 
              borderRadius: "50%", 
              backgroundColor: "#F59E0B" 
            }}></div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096" }}>Pending Restaurants</p>
              <p style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: "600", color: "#2D3748" }}>
                {users.filter(u => u.type === "restaurant" && u.status === "pending").length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editingId && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "30px", 
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          marginBottom: 30
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: 25
          }}>
            <h3 style={{ margin: 0, color: "#2D3748" }}>Update User Details</h3>
            <button
              onClick={() => {
                setEditingId(null);
                resetFormData();
              }}
              style={{
                background: "none",
                border: "none",
                color: "#718096",
                cursor: "pointer",
                fontSize: "20px",
                padding: "5px"
              }}
            >
              <MdClose />
            </button>
          </div>
          
          <form onSubmit={handleUpdateUser}>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
              gap: "20px",
              marginBottom: "25px"
            }}>
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontSize: "14px", 
                  fontWeight: "600",
                  color: "#4A5568"
                }}>
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "#F7FAFC"
                  }}
                  placeholder="Enter user name"
                />
              </div>
              
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontSize: "14px", 
                  fontWeight: "600",
                  color: "#4A5568"
                }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "#F7FAFC"
                  }}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontSize: "14px", 
                  fontWeight: "600",
                  color: "#4A5568"
                }}>
                  User Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "#F7FAFC"
                  }}
                >
                  <option value="">Select Type</option>
                  <option value="client">Client</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontSize: "14px", 
                  fontWeight: "600",
                  color: "#4A5568"
                }}>
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "#F7FAFC"
                  }}
                >
                  <option value="">Select Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              {/* Restaurant-specific fields */}
              {formData.type === "restaurant" && (
                <>
                  <div>
                    <label style={{ 
                      display: "block", 
                      marginBottom: "8px", 
                      fontSize: "14px", 
                      fontWeight: "600",
                      color: "#4A5568"
                    }}>
                      Restaurant Name
                    </label>
                    <input
                      type="text"
                      name="restaurantName"
                      value={formData.restaurantName}
                      onChange={(e) => setFormData({...formData, restaurantName: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                        fontSize: "14px",
                        backgroundColor: "#F7FAFC"
                      }}
                      placeholder="Enter restaurant name"
                    />
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: "block", 
                      marginBottom: "8px", 
                      fontSize: "14px", 
                      fontWeight: "600",
                      color: "#4A5568"
                    }}>
                      Restaurant Type
                    </label>
                    <input
                      type="text"
                      name="restaurantType"
                      value={formData.restaurantType}
                      onChange={(e) => setFormData({...formData, restaurantType: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                        fontSize: "14px",
                        backgroundColor: "#F7FAFC"
                      }}
                      placeholder="e.g., Fast Food, Fine Dining"
                    />
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: "block", 
                      marginBottom: "8px", 
                      fontSize: "14px", 
                      fontWeight: "600",
                      color: "#4A5568"
                    }}>
                      Cuisine Type
                    </label>
                    <input
                      type="text"
                      name="cuisineType"
                      value={formData.cuisineType}
                      onChange={(e) => setFormData({...formData, cuisineType: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                        fontSize: "14px",
                        backgroundColor: "#F7FAFC"
                      }}
                      placeholder="e.g., Italian, Chinese, Mexican"
                    />
                  </div>
                </>
              )}
              
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontSize: "14px", 
                  fontWeight: "600",
                  color: "#4A5568"
                }}>
                  Admin Notes
                </label>
                <textarea
                  name="adminNotes"
                  value={formData.adminNotes}
                  onChange={(e) => setFormData({...formData, adminNotes: e.target.value})}
                  rows="4"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "#F7FAFC",
                    resize: "vertical",
                    minHeight: "120px"
                  }}
                  placeholder="Internal notes about this user..."
                />
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  resetFormData();
                }}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "transparent",
                  border: "1px solid #E2E8F0",
                  color: "#4A5568",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#01615F",
                  border: "none",
                  color: "white",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <MdCheckCircle />
                Update User
              </button>
            </div>
          </form>
        </div>
      )}

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
          <p style={{ color: "#718096", fontWeight: "500" }}>Loading users...</p>
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
          <h3 style={{ margin: "0 0 10px", color: "#2D3748" }}>Failed to Load Users</h3>
          <p style={{ color: "#718096", marginBottom: "20px" }}>
            {error}
          </p>
          <button
            onClick={fetchUsers}
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
      {!loading && !error && filteredUsers.length === 0 && users.length === 0 && (
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
            <MdGroup size={40} />
          </div>
          <h3 style={{ margin: "0 0 10px", color: "#2D3748" }}>
            {searchTerm || statusFilter !== "all" || userTypeFilter !== "all" || activeTab !== "all" ? "No matching users found" : "No users found"}
          </h3>
          <p style={{ color: "#718096", marginBottom: "20px" }}>
            {searchTerm || statusFilter !== "all" || userTypeFilter !== "all" || activeTab !== "all" ? "Try a different search or filter" : "No users have been registered yet"}
          </p>
          {(searchTerm || statusFilter !== "all" || userTypeFilter !== "all" || activeTab !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setUserTypeFilter("all");
                setActiveTab("all");
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

      {/* Users Table - Only show when there's data */}
      {!loading && !error && filteredUsers.length > 0 && (
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
                  }}>User Info</th>
                  <th style={{ 
                    padding: "16px 20px", 
                    textAlign: "left", 
                    fontWeight: "600", 
                    color: "#4A5568",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Type & Status</th>
                  <th style={{ 
                    padding: "16px 20px", 
                    textAlign: "left", 
                    fontWeight: "600", 
                    color: "#4A5568",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Contact Details</th>
                  <th style={{ 
                    padding: "16px 20px", 
                    textAlign: "left", 
                    fontWeight: "600", 
                    color: "#4A5568",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Restaurant Info</th>
                  <th style={{ 
                    padding: "16px 20px", 
                    textAlign: "left", 
                    fontWeight: "600", 
                    color: "#4A5568",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Registration Date</th>
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
                {filteredUsers.map((user, index) => {
                  const userTypeColor = getUserTypeColor(user.type);
                  const statusColor = getStatusColor(user.status);
                  
                  return (
                    <tr 
                      key={user.id}
                      style={{ 
                        borderBottom: "1px solid #EDF2F7",
                        backgroundColor: index % 2 === 0 ? "white" : "#F9FAFB",
                        transition: "background-color 0.2s ease",
                        cursor: "pointer"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#F0FFF4"}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "white" : "#F9FAFB"}
                      onClick={() => setViewingUser(user)}
                    >
                      <td style={{ padding: "16px 20px" }}>
                        <div>
                          <div style={{ 
                            padding: "4px 8px",
                            backgroundColor: "#EDF2F7",
                            borderRadius: "4px",
                            fontSize: "12px",
                            color: "#4A5568",
                            fontWeight: "600",
                            display: "inline-block",
                            marginBottom: "8px"
                          }}>
                            #{user.id.substring(0, 8)}...
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                            <div style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              backgroundColor: userTypeColor.bg,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: userTypeColor.text,
                              fontWeight: "bold",
                              fontSize: "16px"
                            }}>
                              {user.name?.charAt(0)?.toUpperCase() || userTypeColor.icon}
                            </div>
                            <div>
                              <div style={{ fontSize: "16px", fontWeight: "600", color: "#2D3748", marginBottom: "2px" }}>
                                {user.name || "Unnamed User"}
                              </div>
                              <div style={{ fontSize: "13px", color: "#718096" }}>
                                {user.email || "No email"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            backgroundColor: userTypeColor.bg,
                            color: userTypeColor.text,
                            borderRadius: "20px",
                            fontSize: "13px",
                            fontWeight: "600",
                            width: "fit-content"
                          }}>
                            {userTypeColor.icon}
                            {getUserTypeText(user.type)}
                          </div>
                          
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                            borderRadius: "20px",
                            fontSize: "13px",
                            fontWeight: "600",
                            width: "fit-content"
                          }}>
                            {statusColor.icon}
                            {getStatusText(user.status)}
                          </div>
                          
                          <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                            {user.emailVerified && (
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "12px",
                                color: "#10B981"
                              }}>
                                <MdVerified size={14} />
                                Email
                              </div>
                            )}
                            {user.phoneVerified && (
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "12px",
                                color: "#10B981"
                              }}>
                                <MdVerified size={14} />
                                Phone
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#4A5568" }}>
                        <div style={{ marginBottom: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <MdPhone size={14} color="#718096" />
                            <span>{formatPhoneNumber(user.phone)}</span>
                          </div>
                          {user.address && (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                              <MdLocationOn size={14} color="#718096" style={{ flexShrink: 0, marginTop: "2px" }} />
                              <span>{user.address.length > 30 ? `${user.address.substring(0, 30)}...` : user.address}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td style={{ padding: "16px 20px" }}>
                        {user.type === "restaurant" ? (
                          <div>
                            <div style={{ fontWeight: "600", color: "#2D3748", marginBottom: "6px" }}>
                              {user.restaurantName || "Unnamed Restaurant"}
                            </div>
                            {user.restaurantType && (
                              <div style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                backgroundColor: "#EDE9FE",
                                color: "#5B21B6",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "500",
                                marginBottom: "6px"
                              }}>
                                {user.restaurantType}
                              </div>
                            )}
                            {user.cuisineType && (
                              <div style={{ fontSize: "12px", color: "#718096" }}>
                                {user.cuisineType}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ color: "#A0AEC0", fontStyle: "italic" }}>
                            Not a restaurant
                          </div>
                        )}
                      </td>
                      
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#718096" }}>
                        {formatDate(user.createdAt)}
                        {user.lastLogin && (
                          <div style={{ marginTop: "6px", fontSize: "12px", color: "#4A5568" }}>
                            Last login: {formatDate(user.lastLogin)}
                          </div>
                        )}
                      </td>
                      
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingUser(user);
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
                              startEditing(user);
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
                              handleDeleteUser(user.id, user.name || user.restaurantName);
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
                        
                        {/* Quick Action Buttons */}
                        <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                          {user.status === "active" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(user.id, "blocked");
                              }}
                              style={{
                                padding: "4px 10px",
                                backgroundColor: "#FEF3C7",
                                color: "#92400E",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "opacity 0.2s ease"
                              }}
                              onMouseOver={(e) => e.target.style.opacity = "0.8"}
                              onMouseOut={(e) => e.target.style.opacity = "1"}
                            >
                              Block
                            </button>
                          )}
                          {user.status === "blocked" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(user.id, "active");
                              }}
                              style={{
                                padding: "4px 10px",
                                backgroundColor: "#D1FAE5",
                                color: "#065F46",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "opacity 0.2s ease"
                              }}
                              onMouseOver={(e) => e.target.style.opacity = "0.8"}
                              onMouseOut={(e) => e.target.style.opacity = "1"}
                            >
                              Unblock
                            </button>
                          )}
                          {user.status === "inactive" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(user.id, "active");
                              }}
                              style={{
                                padding: "4px 10px",
                                backgroundColor: "#3B82F6",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "opacity 0.2s ease"
                              }}
                              onMouseOver={(e) => e.target.style.opacity = "0.8"}
                              onMouseOut={(e) => e.target.style.opacity = "1"}
                            >
                              Activate
                            </button>
                          )}
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