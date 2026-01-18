// src/pages/Addresses.jsx
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { MdSearch, MdRefresh, MdLocationOn, MdHome, MdApartment, MdBusiness } from "react-icons/md";

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [filteredAddresses, setFilteredAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total: 0, cities: 0, states: 0 });

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "addresses"));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setAddresses(data);
      setFilteredAddresses(data);
      
      // Calculate stats
      const uniqueCities = new Set(data.map(addr => addr.city).filter(Boolean));
      const uniqueStates = new Set(data.map(addr => addr.state).filter(Boolean));
      
      setStats({
        total: data.length,
        cities: uniqueCities.size,
        states: uniqueStates.size
      });
    } catch (err) {
      console.error("Error fetching addresses:", err);
      alert("Failed to fetch addresses. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAddresses(addresses);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = addresses.filter(addr => 
      (addr.street && addr.street.toLowerCase().includes(searchLower)) ||
      (addr.city && addr.city.toLowerCase().includes(searchLower)) ||
      (addr.state && addr.state.toLowerCase().includes(searchLower)) ||
      (addr.zip && addr.zip.includes(searchTerm)) ||
      (addr.id && addr.id.toLowerCase().includes(searchLower))
    );
    setFilteredAddresses(filtered);
  }, [searchTerm, addresses]);

  const getAddressIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'home': return <MdHome />;
      case 'apartment': return <MdApartment />;
      case 'business': return <MdBusiness />;
      default: return <MdLocationOn />;
    }
  };

  const formatAddress = (addr) => {
    const parts = [
      addr.street,
      addr.city && `${addr.city},`,
      addr.state,
      addr.zip && `(${addr.zip})`
    ].filter(Boolean);
    return parts.join(' ');
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
            <MdLocationOn style={{ color: "#01615F" }} />
            Address Management
          </h1>
          <p style={{ 
            margin: "8px 0 0", 
            color: "#718096", 
            fontSize: "14px" 
          }}>
            View and manage all delivery and billing addresses
          </p>
        </div>
        
        <button
          onClick={fetchAddresses}
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
              <MdLocationOn size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Total Addresses</p>
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
          borderLeft: "4px solid #4299E1"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#EBF8FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#4299E1"
            }}>
              <MdHome size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Unique Cities</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {stats.cities}
              </p>
            </div>
          </div>
        </div>

        <div style={{ 
          backgroundColor: "white", 
          padding: "20px", 
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          borderLeft: "4px solid #9F7AEA"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#FAF5FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9F7AEA"
            }}>
              <MdBusiness size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>States/Provinces</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {stats.states}
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
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <MdSearch style={{ 
              position: "absolute", 
              left: "15px", 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: "#A0AEC0" 
            }} />
            <input
              type="text"
              placeholder="Search addresses by street, city, state, zip, or ID..."
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
                e.target.style.boxShadow = "0 0 0 3px rgba(1, 97, 95, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E2E8F0";
                e.target.style.backgroundColor = "#F7FAFC";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
          <div style={{ 
            padding: "8px 16px", 
            backgroundColor: "#EDF2F7", 
            borderRadius: "6px", 
            fontSize: "14px",
            color: "#4A5568",
            fontWeight: "500"
          }}>
            Showing {filteredAddresses.length} of {addresses.length}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        overflow: "hidden"
      }}>
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <div style={{
              width: "50px",
              height: "50px",
              border: "4px solid #E2E8F0",
              borderTopColor: "#01615F",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px"
            }} />
            <p style={{ color: "#718096", fontWeight: "500" }}>Loading addresses...</p>
          </div>
        ) : filteredAddresses.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
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
              <MdLocationOn size={40} />
            </div>
            <h3 style={{ margin: "0 0 10px", color: "#2D3748" }}>
              {searchTerm ? "No matching addresses found" : "No addresses found"}
            </h3>
            <p style={{ color: "#718096", marginBottom: "20px" }}>
              {searchTerm ? "Try a different search term" : "Start by adding your first address"}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "transparent",
                  border: "1px solid #01615F",
                  color: "#01615F",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              minWidth: "800px"
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
                  }}>Address ID</th>
                  <th style={{ 
                    padding: "16px 20px", 
                    textAlign: "left", 
                    fontWeight: "600", 
                    color: "#4A5568",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Full Address</th>
                  <th style={{ 
                    padding: "16px 20px", 
                    textAlign: "left", 
                    fontWeight: "600", 
                    color: "#4A5568",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>City</th>
                  <th style={{ 
                    padding: "16px 20px", 
                    textAlign: "left", 
                    fontWeight: "600", 
                    color: "#4A5568",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>State</th>
                  <th style={{ 
                    padding: "16px 20px", 
                    textAlign: "left", 
                    fontWeight: "600", 
                    color: "#4A5568",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>ZIP/Postal</th>
                  <th style={{ 
                    padding: "16px 20px", 
                    textAlign: "left", 
                    fontWeight: "600", 
                    color: "#4A5568",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredAddresses.map((addr, index) => (
                  <tr 
                    key={addr.id}
                    style={{ 
                      borderBottom: "1px solid #EDF2F7",
                      backgroundColor: index % 2 === 0 ? "white" : "#F9FAFB",
                      transition: "background-color 0.2s ease"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#F0FFF4"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "white" : "#F9FAFB"}
                  >
                    <td style={{ 
                      padding: "16px 20px", 
                      color: "#2D3748",
                      fontSize: "14px",
                      fontWeight: "500"
                    }}>
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px" 
                      }}>
                        <span style={{
                          padding: "4px 8px",
                          backgroundColor: "#EBF8FF",
                          color: "#2B6CB0",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}>
                          {addr.id.substring(0, 8)}...
                        </span>
                      </div>
                    </td>
                    <td style={{ 
                      padding: "16px 20px", 
                      color: "#2D3748",
                      fontSize: "14px"
                    }}>
                      <div>
                        <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                          {addr.street || "No street specified"}
                        </div>
                        <div style={{ color: "#718096", fontSize: "13px" }}>
                          {formatAddress(addr)}
                        </div>
                      </div>
                    </td>
                    <td style={{ 
                      padding: "16px 20px", 
                      color: "#2D3748",
                      fontSize: "14px"
                    }}>
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        backgroundColor: "#E6FFFA",
                        color: "#01615F",
                        borderRadius: "20px",
                        fontSize: "13px",
                        fontWeight: "500"
                      }}>
                        <MdLocationOn size={12} />
                        {addr.city || "-"}
                      </div>
                    </td>
                    <td style={{ 
                      padding: "16px 20px", 
                      color: "#2D3748",
                      fontSize: "14px"
                    }}>
                      <span style={{
                        padding: "4px 10px",
                        backgroundColor: "#FAF5FF",
                        color: "#6B46C1",
                        borderRadius: "4px",
                        fontSize: "13px",
                        fontWeight: "600"
                      }}>
                        {addr.state || "-"}
                      </span>
                    </td>
                    <td style={{ 
                      padding: "16px 20px", 
                      color: "#2D3748",
                      fontSize: "14px",
                      fontWeight: "600"
                    }}>
                      {addr.zip ? (
                        <span style={{
                          fontFamily: "'Courier New', monospace",
                          letterSpacing: "1px"
                        }}>
                          {addr.zip}
                        </span>
                      ) : "-"}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#718096"
                      }}>
                        {getAddressIcon(addr.type)}
                        <span style={{ fontSize: "13px" }}>
                          {addr.type || "Unknown"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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