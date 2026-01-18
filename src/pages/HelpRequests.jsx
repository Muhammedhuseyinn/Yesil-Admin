// src/pages/HelpRequests.jsx
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
  MdHelp,
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
  MdCategory,
  MdFilterList,
  MdEdit,
  MdVisibility,
  MdPriorityHigh,
  MdClose,
  MdChat,
  MdAssistWalker
} from "react-icons/md";

export default function HelpRequests() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [viewingRequest, setViewingRequest] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "pending", "in-progress", "resolved", "closed"
  const [priorityFilter, setPriorityFilter] = useState("all"); // "all", "low", "medium", "high", "urgent"

  // Form state
  const [formData, setFormData] = useState({
    status: "",
    priority: "",
    assignedTo: "",
    adminNotes: "",
    resolution: ""
  });

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    urgent: 0,
    high: 0,
    today: 0
  });

  // Available agents/staff for assignment
  const [availableAgents, setAvailableAgents] = useState([
    { id: "agent1", name: "John Doe", role: "Support Agent" },
    { id: "agent2", name: "Jane Smith", role: "Senior Agent" },
    { id: "agent3", name: "Bob Wilson", role: "Support Manager" },
    { id: "unassigned", name: "Unassigned", role: "" }
  ]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const requestsRef = collection(db, "helpRequests");
      const q = query(requestsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map(doc => {
        const docData = doc.data();

        return {
          id: doc.id,
          ...docData,
          createdAt: docData.createdAt?.toDate ? docData.createdAt.toDate() : docData.createdAt || new Date(),
          updatedAt: docData.updatedAt?.toDate ? docData.updatedAt.toDate() : docData.updatedAt || null,
          resolvedAt: docData.resolvedAt?.toDate ? docData.resolvedAt.toDate() : docData.resolvedAt || null
        };
      });

      setRequests(data);
      setFilteredRequests(data);

      // Calculate statistics
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const pendingCount = data.filter(req => req.status === "pending").length;
      const inProgressCount = data.filter(req => req.status === "in-progress").length;
      const resolvedCount = data.filter(req => req.status === "resolved").length;
      const closedCount = data.filter(req => req.status === "closed").length;
      const urgentCount = data.filter(req => req.priority === "urgent").length;
      const highCount = data.filter(req => req.priority === "high").length;
      const todayCount = data.filter(req => {
        const reqDate = req.createdAt instanceof Date ? req.createdAt : new Date(req.createdAt);
        return reqDate >= startOfToday;
      }).length;

      setStats({
        total: data.length,
        pending: pendingCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount,
        urgent: urgentCount,
        high: highCount,
        today: todayCount
      });

    } catch (err) {
      console.error("Error fetching help requests:", err);
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
        (req.email && req.email.toLowerCase().includes(searchLower)) ||
        (req.helpTopic && req.helpTopic.toLowerCase().includes(searchLower)) ||
        (req.helpDescription && req.helpDescription.toLowerCase().includes(searchLower)) ||
        (req.orderId && req.orderId.toLowerCase().includes(searchLower)) ||
        (req.orderStatus && req.orderStatus.toLowerCase().includes(searchLower)) ||
        (req.id && req.id.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(req => req.priority === priorityFilter);
    }

    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, priorityFilter, requests]);

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const requestRef = doc(db, "helpRequests", requestId);
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        resolvedAt: newStatus === "resolved" || newStatus === "closed" ? serverTimestamp() : null
      };

      await updateDoc(requestRef, updateData);
      alert(`Request marked as ${newStatus} successfully!`);
      fetchRequests();
    } catch (err) {
      console.error("Error updating request:", err);
      alert(`Failed to update request: ${err.message}`);
    }
  };

  const handleAssignToAgent = async (requestId, agentName) => {
    try {
      const requestRef = doc(db, "helpRequests", requestId);
      const updateData = {
        assignedTo: agentName,
        status: "in-progress",
        updatedAt: serverTimestamp()
      };

      await updateDoc(requestRef, updateData);
      alert(`Request assigned to ${agentName} successfully!`);
      fetchRequests();
    } catch (err) {
      console.error("Error assigning request:", err);
      alert(`Failed to assign request: ${err.message}`);
    }
  };

  const handleDeleteRequest = async (requestId, userName) => {
    if (!window.confirm(`Are you sure you want to delete help request from "${userName || 'this user'}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "helpRequests", requestId));
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
      const requestRef = doc(db, "helpRequests", editingId);
      const updateData = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(requestRef, updateData);
      alert("Request updated successfully!");
      setEditingId(null);
      setFormData({ status: "", priority: "", assignedTo: "", adminNotes: "", resolution: "" });
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
      priority: request.priority || "",
      assignedTo: request.assignedTo || "",
      adminNotes: request.adminNotes || "",
      resolution: request.resolution || ""
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return { bg: "#FEF3C7", text: "#92400E", icon: <MdPending /> };
      case "in-progress": return { bg: "#DBEAFE", text: "#1E40AF", icon: <MdAccessTime /> };
      case "resolved": return { bg: "#D1FAE5", text: "#065F46", icon: <MdCheckCircle /> };
      case "closed": return { bg: "#E5E7EB", text: "#374151", icon: <MdCheckCircle /> };
      default: return { bg: "#E5E7EB", text: "#374151", icon: <MdHelp /> };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent": return { bg: "#FEE2E2", text: "#991B1B", icon: <MdPriorityHigh /> };
      case "high": return { bg: "#FEF3C7", text: "#92400E", icon: <MdPriorityHigh /> };
      case "medium": return { bg: "#DBEAFE", text: "#1E40AF", icon: <MdPriorityHigh /> };
      case "low": return { bg: "#D1FAE5", text: "#065F46", icon: <MdPriorityHigh /> };
      default: return { bg: "#E5E7EB", text: "#374151", icon: <MdPriorityHigh /> };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "Pending";
      case "in-progress": return "In Progress";
      case "resolved": return "Resolved";
      case "closed": return "Closed";
      default: return "Unknown";
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case "urgent": return "Urgent";
      case "high": return "High";
      case "medium": return "Medium";
      case "low": return "Low";
      default: return "Not Set";
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

  const truncateText = (text, maxLength = 50) => {
    if (!text) return "";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
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
            <MdHelp style={{ color: "#01615F" }} />
            Help Requests
          </h1>
          <p style={{
            margin: "8px 0 0",
            color: "#718096",
            fontSize: "14px"
          }}>
            Manage customer support and assistance requests
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
              <MdHelp size={20} />
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
              <MdAccessTime size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>In Progress</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {stats.inProgress}
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
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Resolved</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {stats.resolved}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Stats */}
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
          alignItems: "center",
          gap: "10px"
        }}>
          <div style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "#991B1B"
          }}></div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#718096" }}>Urgent Priority</p>
            <p style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: "600", color: "#2D3748" }}>
              {stats.urgent}
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
            backgroundColor: "#92400E"
          }}></div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#718096" }}>High Priority</p>
            <p style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: "600", color: "#2D3748" }}>
              {stats.high}
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
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#DBEAFE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#1D4ED8"
          }}>
            <MdAccessTime size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#718096" }}>Today's Requests</p>
            <p style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: "600", color: "#2D3748" }}>
              {stats.today}
            </p>
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
              placeholder="Search by name, email, phone, subject, or message..."
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
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <MdPriorityHigh style={{ color: "#718096" }} />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
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
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
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
            <h3 style={{ margin: 0, color: "#2D3748" }}>Update Help Request</h3>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ status: "", priority: "", assignedTo: "", adminNotes: "", resolution: "" });
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
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
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
                  Priority *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
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
                  <option value="">Select Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
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
                  Assign To
                </label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "#F7FAFC"
                  }}
                >
                  <option value="">Unassigned</option>
                  {availableAgents.map(agent => (
                    <option key={agent.id} value={agent.name}>
                      {agent.name} {agent.role ? `(${agent.role})` : ''}
                    </option>
                  ))}
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
                  Resolution Notes
                </label>
                <textarea
                  name="resolution"
                  value={formData.resolution}
                  onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "#F7FAFC",
                    resize: "vertical",
                    minHeight: "100px"
                  }}
                  placeholder="Describe how the issue was resolved..."
                />
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
                  onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
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
                  placeholder="Internal notes for the support team..."
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ status: "", priority: "", assignedTo: "", adminNotes: "", resolution: "" });
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
          <p style={{ color: "#718096", fontWeight: "500" }}>Loading help requests...</p>
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
            <MdHelp size={40} />
          </div>
          <h3 style={{ margin: "0 0 10px", color: "#2D3748" }}>
            {searchTerm || statusFilter !== "all" || priorityFilter !== "all" ? "No matching requests found" : "No help requests found"}
          </h3>
          <p style={{ color: "#718096", marginBottom: "20px" }}>
            {searchTerm || statusFilter !== "all" || priorityFilter !== "all" ? "Try a different search or filter" : "No help requests have been submitted yet"}
          </p>
          {(searchTerm || statusFilter !== "all" || priorityFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPriorityFilter("all");
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
                  }}>User & Subject</th>
                  <th style={{
                    padding: "16px 20px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#4A5568",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Message</th>
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
                  }}>Priority</th>
                  <th style={{
                    padding: "16px 20px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#4A5568",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Assigned To</th>
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
                  const priorityColor = getPriorityColor(request.priority);

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
                            <strong style={{ color: "#2D3748" }}>{request.email || "Unknown User"}</strong>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", fontSize: "13px" }}>
                            <MdEmail size={14} color="#718096" />
                            <span style={{ color: "#4A5568" }}>{request.orderId ? `Order: ${request.orderId.substring(0, 8)}...` : "N/A"}</span>
                          </div>
                          {request.helpTopic && (
                            <div style={{
                              marginTop: "8px",
                              padding: "4px 8px",
                              backgroundColor: "#EDF2F7",
                              borderRadius: "4px",
                              fontSize: "13px",
                              color: "#2D3748",
                              fontWeight: "500"
                            }}>
                              {truncateText(request.helpTopic, 40)}
                            </div>
                          )}
                          {request.orderStatus && (
                            <div style={{
                              marginTop: "6px",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "12px",
                              color: "#718096"
                            }}>
                              <MdCategory size={12} />
                              {request.orderStatus}
                            </div>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: "16px 20px" }}>
                        <div style={{
                          color: "#4A5568",
                          fontSize: "13px",
                          lineHeight: "1.4",
                          maxHeight: "60px",
                          overflow: "hidden"
                        }}>
                          {request.helpDescription ? (
                            <>
                              <MdMessage size={14} color="#718096" style={{ float: "left", marginRight: "6px", marginTop: "2px" }} />
                              {truncateText(request.helpDescription, 120)}
                            </>
                          ) : "No message provided"}
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

                      <td style={{ padding: "16px 20px" }}>
                        <div style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          backgroundColor: priorityColor.bg,
                          color: priorityColor.text,
                          borderRadius: "20px",
                          fontSize: "13px",
                          fontWeight: "600"
                        }}>
                          {priorityColor.icon}
                          {getPriorityText(request.priority)}
                        </div>
                      </td>

                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#4A5568" }}>
                        {request.assignedTo ? (
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            backgroundColor: "#E0E7FF",
                            color: "#3730A3",
                            borderRadius: "4px",
                            fontWeight: "500"
                          }}>
                            <MdAssistWalker size={12} />
                            {request.assignedTo}
                          </div>
                        ) : (
                          <span style={{ color: "#A0AEC0", fontStyle: "italic" }}>Unassigned</span>
                        )}
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
                          <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(request.id, "in-progress");
                              }}
                              style={{
                                padding: "4px 10px",
                                backgroundColor: "#3B82F6",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "opacity 0.2s ease",
                                flex: 1
                              }}
                              onMouseOver={(e) => e.target.style.opacity = "0.8"}
                              onMouseOut={(e) => e.target.style.opacity = "1"}
                            >
                              Start
                            </button>
                            {availableAgents.slice(0, 2).map(agent => (
                              <button
                                key={agent.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAssignToAgent(request.id, agent.name);
                                }}
                                style={{
                                  padding: "4px 8px",
                                  backgroundColor: "#E0E7FF",
                                  color: "#3730A3",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight: "500",
                                  cursor: "pointer",
                                  transition: "opacity 0.2s ease"
                                }}
                                onMouseOver={(e) => e.target.style.opacity = "0.8"}
                                onMouseOut={(e) => e.target.style.opacity = "1"}
                              >
                                {agent.name.split(' ')[0]}
                              </button>
                            ))}
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
            maxWidth: "800px",
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
              <h3 style={{ margin: 0, color: "#2D3748" }}>Help Request Details</h3>
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
              {/* Header with Status and Priority */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" }}>
                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
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
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    backgroundColor: getPriorityColor(viewingRequest.priority).bg,
                    color: getPriorityColor(viewingRequest.priority).text,
                    borderRadius: "20px",
                    fontSize: "14px",
                    fontWeight: "600"
                  }}>
                    {getPriorityColor(viewingRequest.priority).icon}
                    {getPriorityText(viewingRequest.priority)} Priority
                  </div>
                </div>
                <div style={{ fontSize: "14px", color: "#718096" }}>
                  ID: <strong>{viewingRequest.id.substring(0, 8)}...</strong>
                </div>
              </div>

              {/* User Information */}
              <div style={{ marginBottom: "30px" }}>
                <h4 style={{ margin: "0 0 15px", color: "#2D3748", fontSize: "18px" }}>
                  <MdPerson style={{ marginRight: "8px", verticalAlign: "middle" }} />
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
                        <strong style={{ color: "#4A5568" }}>Name:</strong>
                      </div>
                      <p style={{ margin: 0, color: "#2D3748", fontSize: "15px" }}>{viewingRequest.userName || "N/A"}</p>
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                        <strong style={{ color: "#4A5568" }}>Email:</strong>
                      </div>
                      <p style={{ margin: 0, color: "#2D3748", fontSize: "15px" }}>{viewingRequest.userEmail || "N/A"}</p>
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                        <strong style={{ color: "#4A5568" }}>Phone:</strong>
                      </div>
                      <p style={{ margin: 0, color: "#2D3748", fontSize: "15px" }}>{formatPhoneNumber(viewingRequest.userPhone)}</p>
                    </div>

                    {viewingRequest.category && (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                          <strong style={{ color: "#4A5568" }}>Category:</strong>
                        </div>
                        <div style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          backgroundColor: "#EDE9FE",
                          color: "#5B21B6",
                          borderRadius: "20px",
                          fontSize: "14px",
                          fontWeight: "500"
                        }}>
                          {viewingRequest.category}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div style={{ marginBottom: "30px" }}>
                <h4 style={{ margin: "0 0 15px", color: "#2D3748", fontSize: "18px" }}>
                  <MdChat style={{ marginRight: "8px", verticalAlign: "middle" }} />
                  Request Details
                </h4>
                <div style={{
                  backgroundColor: "#F7FAFC",
                  borderRadius: "8px",
                  padding: "20px"
                }}>
                  {viewingRequest.subject && (
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <strong style={{ color: "#4A5568" }}>Subject:</strong>
                      </div>
                      <p style={{ margin: 0, color: "#2D3748", fontSize: "16px", fontWeight: "500" }}>
                        {viewingRequest.subject}
                      </p>
                    </div>
                  )}

                  {viewingRequest.message && (
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <strong style={{ color: "#4A5568" }}>Message:</strong>
                      </div>
                      <div style={{
                        backgroundColor: "white",
                        borderRadius: "6px",
                        padding: "15px",
                        border: "1px solid #E2E8F0"
                      }}>
                        <p style={{ margin: 0, color: "#2D3748", fontSize: "15px", lineHeight: "1.6" }}>
                          {viewingRequest.message}
                        </p>
                      </div>
                    </div>
                  )}

                  {viewingRequest.assignedTo && (
                    <div style={{ marginTop: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <MdAssistWalker color="#01615F" />
                        <strong style={{ color: "#4A5568" }}>Assigned To:</strong>
                      </div>
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 16px",
                        backgroundColor: "#E0E7FF",
                        color: "#3730A3",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "600"
                      }}>
                        {viewingRequest.assignedTo}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution & Admin Notes */}
              {(viewingRequest.resolution || viewingRequest.adminNotes) && (
                <div style={{ marginBottom: "30px" }}>
                  <h4 style={{ margin: "0 0 15px", color: "#2D3748", fontSize: "18px" }}>
                    Resolution & Notes
                  </h4>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "20px"
                  }}>
                    {viewingRequest.resolution && (
                      <div>
                        <div style={{
                          backgroundColor: "#D1FAE5",
                          borderRadius: "8px",
                          padding: "20px",
                          borderLeft: "4px solid #10B981"
                        }}>
                          <strong style={{ color: "#065F46", fontSize: "14px", display: "block", marginBottom: "8px" }}>
                            Resolution:
                          </strong>
                          <p style={{ margin: 0, color: "#065F46", fontSize: "15px", lineHeight: "1.6" }}>
                            {viewingRequest.resolution}
                          </p>
                        </div>
                      </div>
                    )}

                    {viewingRequest.adminNotes && (
                      <div>
                        <div style={{
                          backgroundColor: "#FFF7ED",
                          borderRadius: "8px",
                          padding: "20px",
                          borderLeft: "4px solid #F59E0B"
                        }}>
                          <strong style={{ color: "#92400E", fontSize: "14px", display: "block", marginBottom: "8px" }}>
                            Admin Notes:
                          </strong>
                          <p style={{ margin: 0, color: "#92400E", fontSize: "15px", lineHeight: "1.6" }}>
                            {viewingRequest.adminNotes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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