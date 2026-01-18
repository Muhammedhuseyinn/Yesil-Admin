// src/pages/FreeFoodRequests.jsx
import React, { useEffect, useState } from "react";
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
  MdFastfood, 
  MdRefresh, 
  MdSearch, 
  MdDelete, 
  MdCheckCircle,
  MdCancel,
  MdPending,
  MdAccessTime,
  MdPerson,
  MdLocationOn,
  MdPhone,
  MdEmail,
  MdMessage,
  MdFilterList,
  MdEdit,
  MdVisibility,
  MdClose
} from "react-icons/md";

export default function FreeFoodRequests() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [viewingRequest, setViewingRequest] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "pending", "approved", "rejected"
  
  // Form state
  const [formData, setFormData] = useState({
    status: "",
    adminNotes: "",
  });

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    today: 0,
    thisWeek: 0
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const requestsRef = collection(db, "freeFoodRequests");
      const q = query(requestsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map(doc => { 
        const docData = doc.data();
        
        return {
          id: doc.id, 
          ...docData,
          createdAt: docData.createdAt?.toDate ? docData.createdAt.toDate() : docData.createdAt || new Date(),
          updatedAt: docData.updatedAt?.toDate ? docData.updatedAt.toDate() : docData.updatedAt || null
        };
      });
      
      setRequests(data);
      setFilteredRequests(data);
      
      // Calculate statistics
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      
      const pendingCount = data.filter(req => req.status === "pending").length;
      const approvedCount = data.filter(req => req.status === "approved").length;
      const rejectedCount = data.filter(req => req.status === "rejected").length;
      const todayCount = data.filter(req => {
        const reqDate = req.createdAt instanceof Date ? req.createdAt : new Date(req.createdAt);
        return reqDate >= startOfToday;
      }).length;
      const weekCount = data.filter(req => {
        const reqDate = req.createdAt instanceof Date ? req.createdAt : new Date(req.createdAt);
        return reqDate >= startOfWeek;
      }).length;
      
      setStats({
        total: data.length,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        today: todayCount,
        thisWeek: weekCount
      });
      
    } catch (err) {
      console.error("Error fetching free food requests:", err);
      setError(`Failed to fetch requests: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    let filtered = [...requests];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(req => 
        (req.userName && req.userName.toLowerCase().includes(searchLower)) ||
        (req.userEmail && req.userEmail.toLowerCase().includes(searchLower)) ||
        (req.userPhone && req.userPhone.includes(searchTerm)) ||
        (req.address && req.address.toLowerCase().includes(searchLower)) ||
        (req.reason && req.reason.toLowerCase().includes(searchLower)) ||
        (req.id && req.id.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    
    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, requests]);

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const requestRef = doc(db, "freeFoodRequests", requestId);
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        resolvedAt: newStatus !== "pending" ? serverTimestamp() : null
      };
      
      await updateDoc(requestRef, updateData);
      alert(`Request ${newStatus} successfully!`);
      fetchRequests();
    } catch (err) {
      console.error("Error updating request:", err);
      alert(`Failed to update request: ${err.message}`);
    }
  };

  const handleDeleteRequest = async (requestId, userName) => {
    if (!window.confirm(`Are you sure you want to delete request from "${userName || 'this user'}"?`)) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, "freeFoodRequests", requestId));
      alert("Request deleted successfully!");
      fetchRequests();
      if (viewingRequest?.id === requestId) {
        setViewingRequest(null);
      }
    } catch (err) {
      console.error("Error deleting request:", err);
      alert(`Failed to delete request: ${err.message}`);
    }
  };

  const handleUpdateRequest = async (e) => {
    e.preventDefault();
    try {
      const requestRef = doc(db, "freeFoodRequests", editingId);
      const updateData = {
        ...formData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(requestRef, updateData);
      alert("Request updated successfully!");
      setEditingId(null);
      setFormData({ status: "", adminNotes: "" });
      fetchRequests();
    } catch (err) {
      console.error("Error updating request:", err);
      alert(`Failed to update request: ${err.message}`);
    }
  };

  const startEditing = (request) => {
    setEditingId(request.id);
    setFormData({
      status: request.status || "",
      adminNotes: request.adminNotes || ""
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "pending": return { bg: "#FEF3C7", text: "#92400E", icon: <MdPending /> };
      case "approved": return { bg: "#D1FAE5", text: "#065F46", icon: <MdCheckCircle /> };
      case "rejected": return { bg: "#FEE2E2", text: "#991B1B", icon: <MdCancel /> };
      default: return { bg: "#E5E7EB", text: "#374151", icon: <MdAccessTime /> };
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case "pending": return "Pending";
      case "approved": return "Approved";
      case "rejected": return "Rejected";
      default: return "Unknown";
    }
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
            <MdFastfood style={{ color: "#01615F" }} />
            Free Food Requests
          </h1>
          <p style={{ 
            margin: "8px 0 0", 
            color: "#718096", 
            fontSize: "14px" 
          }}>
            Manage food assistance requests from users
          </p>
        </div>
        
        <button
          onClick={fetchRequests}
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
              onClick={fetchRequests}
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
              <MdFastfood size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Total Requests</p>
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
              <MdPending size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Pending</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {stats.pending}
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
              <MdCheckCircle size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Approved</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {stats.approved}
              </p>
            </div>
          </div>
        </div>

        <div style={{ 
          backgroundColor: "white", 
          padding: "20px", 
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          borderLeft: "4px solid #EF4444"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#EF4444"
            }}>
              <MdCancel size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Rejected</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {stats.rejected}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
        gap: "15px", 
        marginBottom: 30 
      }}>
        <div style={{ 
          backgroundColor: "white", 
          padding: "15px", 
          borderRadius: "10px",
          boxShadow: "0 1px 5px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center"
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#DBEAFE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#1D4ED8",
            marginBottom: "8px"
          }}>
            <MdAccessTime size={20} />
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#718096" }}>Today</p>
          <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: "700", color: "#2D3748" }}>
            {stats.today}
          </p>
        </div>

        <div style={{ 
          backgroundColor: "white", 
          padding: "15px", 
          borderRadius: "10px",
          boxShadow: "0 1px 5px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center"
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#E0E7FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#4F46E5",
            marginBottom: "8px"
          }}>
            <MdAccessTime size={20} />
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#718096" }}>This Week</p>
          <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: "700", color: "#2D3748" }}>
            {stats.thisWeek}
          </p>
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
              placeholder="Search requests by name, email, phone, address, or reason..."
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
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
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
            Showing {filteredRequests.length} of {requests.length}
          </div>
        </div>
      </div>

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
            <h3 style={{ margin: 0, color: "#2D3748" }}>Update Request Details</h3>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ status: "", adminNotes: "" });
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
          
          <form onSubmit={handleUpdateRequest}>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
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
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
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
                  placeholder="Add admin notes or instructions..."
                />
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ status: "", adminNotes: "" });
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
                <MdSave />
                Update Request
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
          <p style={{ color: "#718096", fontWeight: "500" }}>Loading requests...</p>
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
          <h3 style={{ margin: "0 0 10px", color: "#2D3748" }}>Failed to Load Requests</h3>
          <p style={{ color: "#718096", marginBottom: "20px" }}>
            {error}
          </p>
          <button
            onClick={fetchRequests}
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
      {!loading && !error && filteredRequests.length === 0 && requests.length === 0 && (
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
            <MdFastfood size={40} />
          </div>
          <h3 style={{ margin: "0 0 10px", color: "#2D3748" }}>
            {searchTerm || statusFilter !== "all" ? "No matching requests found" : "No requests found"}
          </h3>
          <p style={{ color: "#718096", marginBottom: "20px" }}>
            {searchTerm || statusFilter !== "all" ? "Try a different search or filter" : "No free food requests have been submitted yet"}
          </p>
          {(searchTerm || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
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

      {/* Requests Table - Only show when there's data */}
      {!loading && !error && filteredRequests.length > 0 && (
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
              minWidth: "1000px"
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
                  }}>Request Details</th>
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
                {filteredRequests.map((request, index) => {
                  const statusColor = getStatusColor(request.status);
                  
                  return (
                    <tr 
                      key={request.id}
                      style={{ 
                        borderBottom: "1px solid #EDF2F7",
                        backgroundColor: index % 2 === 0 ? "white" : "#F9FAFB",
                        transition: "background-color 0.2s ease",
                        cursor: "pointer"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#F0FFF4"}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "white" : "#F9FAFB"}
                      onClick={() => setViewingRequest(request)}
                    >
                      <td style={{ padding: "16px 20px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <MdPerson size={16} color="#718096" />
                            <strong style={{ color: "#2D3748" }}>{request.userName || "Unknown"}</strong>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", fontSize: "13px" }}>
                            <MdEmail size={14} color="#718096" />
                            <span style={{ color: "#4A5568" }}>{request.userEmail || "N/A"}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                            <MdPhone size={14} color="#718096" />
                            <span style={{ color: "#4A5568" }}>{formatPhoneNumber(request.userPhone)}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td style={{ padding: "16px 20px" }}>
                        <div>
                          {request.address && (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                              <MdLocationOn size={16} color="#718096" style={{ flexShrink: 0, marginTop: "2px" }} />
                              <span style={{ color: "#4A5568", fontSize: "13px" }}>{request.address}</span>
                            </div>
                          )}
                          {request.reason && (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                              <MdMessage size={16} color="#718096" style={{ flexShrink: 0, marginTop: "2px" }} />
                              <span style={{ color: "#4A5568", fontSize: "13px" }}>
                                {request.reason.length > 50 
                                  ? `${request.reason.substring(0, 50)}...` 
                                  : request.reason}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                          borderRadius: "20px",
                          fontSize: "13px",
                          fontWeight: "600"
                        }}>
                          {statusColor.icon}
                          {getStatusText(request.status)}
                        </div>
                      </td>
                      
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#718096" }}>
                        {formatDate(request.createdAt)}
                      </td>
                      
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingRequest(request);
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
                              startEditing(request);
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
                              handleDeleteRequest(request.id, request.userName);
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
                        {request.status === "pending" && (
                          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(request.id, "approved");
                              }}
                              style={{
                                padding: "4px 12px",
                                backgroundColor: "#10B981",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "opacity 0.2s ease"
                              }}
                              onMouseOver={(e) => e.target.style.opacity = "0.8"}
                              onMouseOut={(e) => e.target.style.opacity = "1"}
                            >
                              Approve
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(request.id, "rejected");
                              }}
                              style={{
                                padding: "4px 12px",
                                backgroundColor: "#EF4444",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "opacity 0.2s ease"
                              }}
                              onMouseOver={(e) => e.target.style.opacity = "0.8"}
                              onMouseOut={(e) => e.target.style.opacity = "1"}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Detail Modal */}
      {viewingRequest && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "700px",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }}>
            <div style={{
              padding: "25px 30px",
              borderBottom: "1px solid #E2E8F0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{ margin: 0, color: "#2D3748" }}>Request Details</h3>
              <button
                onClick={() => setViewingRequest(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#718096",
                  cursor: "pointer",
                  fontSize: "24px",
                  padding: "5px"
                }}
              >
                <MdClose />
              </button>
            </div>
            
            <div style={{ padding: "30px" }}>
              {/* Status Badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  backgroundColor: getStatusColor(viewingRequest.status).bg,
                  color: getStatusColor(viewingRequest.status).text,
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "600"
                }}>
                  {getStatusColor(viewingRequest.status).icon}
                  {getStatusText(viewingRequest.status)}
                </div>
                <div style={{ fontSize: "14px", color: "#718096" }}>
                  Request ID: <strong>{viewingRequest.id.substring(0, 8)}...</strong>
                </div>
              </div>
              
              {/* User Information */}
              <div style={{ marginBottom: "30px" }}>
                <h4 style={{ margin: "0 0 15px", color: "#2D3748", fontSize: "18px" }}>
                  User Information
                </h4>
                <div style={{
                  backgroundColor: "#F7FAFC",
                  borderRadius: "8px",
                  padding: "20px"
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                        <MdPerson color="#01615F" />
                        <strong style={{ color: "#4A5568" }}>Name:</strong>
                      </div>
                      <p style={{ margin: 0, color: "#2D3748", fontSize: "15px" }}>{viewingRequest.userName || "N/A"}</p>
                    </div>
                    
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                        <MdEmail color="#01615F" />
                        <strong style={{ color: "#4A5568" }}>Email:</strong>
                      </div>
                      <p style={{ margin: 0, color: "#2D3748", fontSize: "15px" }}>{viewingRequest.userEmail || "N/A"}</p>
                    </div>
                    
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                        <MdPhone color="#01615F" />
                        <strong style={{ color: "#4A5568" }}>Phone:</strong>
                      </div>
                      <p style={{ margin: 0, color: "#2D3748", fontSize: "15px" }}>{formatPhoneNumber(viewingRequest.userPhone)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Request Details */}
              <div style={{ marginBottom: "30px" }}>
                <h4 style={{ margin: "0 0 15px", color: "#2D3748", fontSize: "18px" }}>
                  Request Details
                </h4>
                <div style={{
                  backgroundColor: "#F7FAFC",
                  borderRadius: "8px",
                  padding: "20px"
                }}>
                  {viewingRequest.address && (
                    <div style={{ marginBottom: "15px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <MdLocationOn color="#01615F" />
                        <strong style={{ color: "#4A5568" }}>Delivery Address:</strong>
                      </div>
                      <p style={{ margin: 0, color: "#2D3748", fontSize: "15px" }}>{viewingRequest.address}</p>
                    </div>
                  )}
                  
                  {viewingRequest.reason && (
                    <div style={{ marginBottom: "15px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <MdMessage color="#01615F" />
                        <strong style={{ color: "#4A5568" }}>Reason for Request:</strong>
                      </div>
                      <p style={{ margin: 0, color: "#2D3748", fontSize: "15px", lineHeight: "1.6" }}>
                        {viewingRequest.reason}
                      </p>
                    </div>
                  )}
                  
                  {viewingRequest.additionalInfo && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <MdMessage color="#01615F" />
                        <strong style={{ color: "#4A5568" }}>Additional Information:</strong>
                      </div>
                      <p style={{ margin: 0, color: "#2D3748", fontSize: "15px", lineHeight: "1.6" }}>
                        {viewingRequest.additionalInfo}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Timestamps */}
              <div style={{ marginBottom: "30px" }}>
                <h4 style={{ margin: "0 0 15px", color: "#2D3748", fontSize: "18px" }}>
                  Timestamps
                </h4>
                <div style={{
                  backgroundColor: "#F7FAFC",
                  borderRadius: "8px",
                  padding: "20px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "15px"
                }}>
                  <div>
                    <strong style={{ color: "#4A5568", fontSize: "14px" }}>Created:</strong>
                    <p style={{ margin: "5px 0 0", color: "#2D3748", fontSize: "14px" }}>
                      {formatDate(viewingRequest.createdAt)}
                    </p>
                  </div>
                  
                  {viewingRequest.updatedAt && (
                    <div>
                      <strong style={{ color: "#4A5568", fontSize: "14px" }}>Last Updated:</strong>
                      <p style={{ margin: "5px 0 0", color: "#2D3748", fontSize: "14px" }}>
                        {formatDate(viewingRequest.updatedAt)}
                      </p>
                    </div>
                  )}
                  
                  {viewingRequest.resolvedAt && (
                    <div>
                      <strong style={{ color: "#4A5568", fontSize: "14px" }}>Resolved:</strong>
                      <p style={{ margin: "5px 0 0", color: "#2D3748", fontSize: "14px" }}>
                        {formatDate(viewingRequest.resolvedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Admin Notes */}
              {viewingRequest.adminNotes && (
                <div style={{ marginBottom: "30px" }}>
                  <h4 style={{ margin: "0 0 15px", color: "#2D3748", fontSize: "18px" }}>
                    Admin Notes
                  </h4>
                  <div style={{
                    backgroundColor: "#FFF7ED",
                    borderRadius: "8px",
                    padding: "20px",
                    borderLeft: "4px solid #F59E0B"
                  }}>
                    <p style={{ margin: 0, color: "#92400E", fontSize: "15px", lineHeight: "1.6" }}>
                      {viewingRequest.adminNotes}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    startEditing(viewingRequest);
                    setViewingRequest(null);
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#01615F",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <MdEdit />
                  Edit Request
                </button>
                <button
                  onClick={() => setViewingRequest(null)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "transparent",
                    border: "1px solid #E2E8F0",
                    color: "#4A5568",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  Close
                </button>
              </div>
            </div>
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