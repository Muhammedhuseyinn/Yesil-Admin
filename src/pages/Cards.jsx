// src/pages/Cards.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  MdCreditCard,
  MdRefresh,
  MdSearch,
  MdVisibility,
  MdVisibilityOff,
  MdCheckCircle,
  MdCancel,
  MdAccountCircle,
  MdCalendarToday,
  MdLock
} from "react-icons/md";

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCardNumbers, setShowCardNumbers] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    visa: 0,
    mastercard: 0,
    other: 0
  });

  const fetchCards = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "cards"));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setCards(data);
      setFilteredCards(data);

      // Calculate stats
      const now = new Date();
      const activeCards = data.filter(card => {
        if (!card.expiryDate) return true;
        const expiry = new Date(card.expiryDate);
        return expiry > now;
      });

      const visaCount = data.filter(card =>
        card.number?.startsWith('4') ||
        card.type?.toLowerCase().includes('visa')
      ).length;

      const mastercardCount = data.filter(card =>
        card.number?.startsWith('5') ||
        card.type?.toLowerCase().includes('mastercard')
      ).length;

      setStats({
        total: data.length,
        active: activeCards.length,
        expired: data.length - activeCards.length,
        visa: visaCount,
        mastercard: mastercardCount,
        other: data.length - (visaCount + mastercardCount)
      });
    } catch (err) {
      console.error("Error fetching cards:", err);
      alert("Failed to fetch cards. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCards(cards);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = cards.filter(card =>
      (card.name && card.name.toLowerCase().includes(searchLower)) ||
      (card.number && card.number.includes(searchTerm)) ||
      (card.type && card.type.toLowerCase().includes(searchLower)) ||
      (card.id && card.id.toLowerCase().includes(searchLower)) ||
      (card.userId && card.userId.toLowerCase().includes(searchLower))
    );
    setFilteredCards(filtered);
  }, [searchTerm, cards]);

  const getCardTypeIcon = (number, cardType) => {
    const firstDigit = number?.charAt(0);
    const type = cardType?.toLowerCase();

    if (firstDigit === '4' || type?.includes('visa')) {
      return { color: "#1A1F71", bg: "#F1F8FF", label: "Visa" };
    } else if (firstDigit === '5' || type?.includes('mastercard')) {
      return { color: "#EB001B", bg: "#FFF0F0", label: "Mastercard" };
    } else if (firstDigit === '3' || type?.includes('amex')) {
      return { color: "#2E77BB", bg: "#F0F9FF", label: "Amex" };
    } else if (firstDigit === '6' || type?.includes('discover')) {
      return { color: "#FF6600", bg: "#FFF5E6", label: "Discover" };
    } else {
      return { color: "#718096", bg: "#F7FAFC", label: "Other" };
    }
  };

  const formatCardNumber = (number) => {
    if (!number) return "•••• •••• •••• ••••";

    if (showCardNumbers) {
      // Format: XXXX XXXX XXXX XXXX
      const cleaned = number.replace(/\D/g, '');
      const parts = cleaned.match(/.{1,4}/g);
      return parts ? parts.join(' ') : cleaned;
    }

    // Show last 4 digits only
    const lastFour = number.slice(-4);
    return `•••• •••• •••• ${lastFour}`;
  };

  const formatExpiryDate = (expiry) => {
    if (!expiry) return "N/A";
    // Expiry is stored as MM/YY, just return it
    return expiry;
  };

  const isCardExpired = (expiry) => {
    if (!expiry) return false;
    // Parse MM/YY format
    const parts = expiry.split('/');
    if (parts.length !== 2) return false;
    const month = parseInt(parts[0], 10);
    const year = parseInt('20' + parts[1], 10);
    const expiryDate = new Date(year, month, 0); // Last day of the expiry month
    const now = new Date();
    return expiryDate < now;
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
            <MdCreditCard style={{ color: "#01615F" }} />
            Payment Cards
          </h1>
          <p style={{
            margin: "8px 0 0",
            color: "#718096",
            fontSize: "14px"
          }}>
            Manage and monitor all payment methods
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={() => setShowCardNumbers(!showCardNumbers)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: "transparent",
              border: "1px solid #E2E8F0",
              color: "#4A5568",
              borderRadius: "8px",
              fontWeight: "500",
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#F7FAFC"}
            onMouseOut={(e) => e.target.style.backgroundColor = "transparent"}
          >
            {showCardNumbers ? <MdVisibilityOff /> : <MdVisibility />}
            {showCardNumbers ? "Hide Numbers" : "Show Numbers"}
          </button>

          <button
            onClick={fetchCards}
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
              <MdCreditCard size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Total Cards</p>
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
          borderLeft: "4px solid #48BB78"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#F0FFF4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#48BB78"
            }}>
              <MdCheckCircle size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Active Cards</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {stats.active}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          borderLeft: "4px solid #F56565"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#FFF5F5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#F56565"
            }}>
              <MdCancel size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Expired Cards</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {stats.expired}
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
              <MdLock size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#718096", fontWeight: "600" }}>Card Types</p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color: "#2D3748" }}>
                {stats.visa + stats.mastercard + stats.other}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card Type Distribution */}
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
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#1A1F71" }}></div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#718096" }}>Visa</p>
            <p style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: "600", color: "#2D3748" }}>
              {stats.visa} <span style={{ fontSize: "12px", color: "#A0AEC0" }}>({Math.round((stats.visa / stats.total) * 100)}%)</span>
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
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#EB001B" }}></div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#718096" }}>Mastercard</p>
            <p style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: "600", color: "#2D3748" }}>
              {stats.mastercard} <span style={{ fontSize: "12px", color: "#A0AEC0" }}>({Math.round((stats.mastercard / stats.total) * 100)}%)</span>
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
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#718096" }}></div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#718096" }}>Other Types</p>
            <p style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: "600", color: "#2D3748" }}>
              {stats.other} <span style={{ fontSize: "12px", color: "#A0AEC0" }}>({Math.round((stats.other / stats.total) * 100)}%)</span>
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
              placeholder="Search cards by name, number, type, or user ID..."
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
            Showing {filteredCards.length} of {cards.length}
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
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
          <p style={{ color: "#718096", fontWeight: "500" }}>Loading payment cards...</p>
        </div>
      ) : filteredCards.length === 0 ? (
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
            <MdCreditCard size={40} />
          </div>
          <h3 style={{ margin: "0 0 10px", color: "#2D3748" }}>
            {searchTerm ? "No matching cards found" : "No payment cards found"}
          </h3>
          <p style={{ color: "#718096", marginBottom: "20px" }}>
            {searchTerm ? "Try a different search term" : "No cards have been added yet"}
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
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: "20px",
          marginBottom: "30px"
        }}>
          {filteredCards.map(card => {
            const cardType = getCardTypeIcon(card.number, card.type);
            const expired = isCardExpired(card.expiry);

            return (
              <div
                key={card.id}
                style={{
                  backgroundColor: "white",
                  borderRadius: "16px",
                  padding: "25px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  border: expired ? "1px solid #F56565" : "1px solid #E2E8F0",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                }}
              >
                {/* Card type indicator */}
                <div style={{
                  position: "absolute",
                  top: "0",
                  right: "0",
                  padding: "6px 15px",
                  backgroundColor: cardType.bg,
                  color: cardType.color,
                  fontSize: "12px",
                  fontWeight: "600",
                  borderBottomLeftRadius: "12px",
                  borderTopRightRadius: "16px"
                }}>
                  {cardType.label}
                </div>

                {/* Expired badge */}
                {expired && (
                  <div style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 12px",
                    backgroundColor: "#FFF5F5",
                    color: "#F56565",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}>
                    <MdCancel size={12} />
                    Expired
                  </div>
                )}

                {/* Card number */}
                <div style={{ marginTop: expired ? "30px" : "0", marginBottom: "25px" }}>
                  <p style={{
                    margin: "0 0 8px",
                    fontSize: "12px",
                    color: "#718096",
                    fontWeight: "500"
                  }}>
                    CARD NUMBER
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: "600",
                    color: "#2D3748",
                    letterSpacing: "2px",
                    fontFamily: "'Courier New', monospace"
                  }}>
                    {formatCardNumber(card.number)}
                  </p>
                </div>

                {/* Card holder and expiry */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "25px"
                }}>
                  <div>
                    <p style={{
                      margin: "0 0 8px",
                      fontSize: "12px",
                      color: "#718096",
                      fontWeight: "500"
                    }}>
                      CARD HOLDER
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <MdAccountCircle size={18} color="#718096" />
                      <p style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#2D3748"
                      }}>
                        {card.name || "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <p style={{
                      margin: "0 0 8px",
                      fontSize: "12px",
                      color: "#718096",
                      fontWeight: "500"
                    }}>
                      EXPIRES
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <MdCalendarToday size={18} color="#718096" />
                      <p style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: "600",
                        color: expired ? "#F56565" : "#2D3748"
                      }}>
                        {formatExpiryDate(card.expiry)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional info */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "20px",
                  borderTop: "1px solid #EDF2F7",
                  fontSize: "13px"
                }}>
                  <div>
                    <p style={{ margin: "0 0 4px", color: "#718096" }}>User ID</p>
                    <p style={{
                      margin: 0,
                      fontWeight: "500",
                      color: "#4A5568",
                      backgroundColor: "#F7FAFC",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px"
                    }}>
                      {card.userId ? card.userId.substring(0, 8) + "..." : "N/A"}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: "0 0 4px", color: "#718096" }}>CVV</p>
                    <p style={{
                      margin: 0,
                      fontWeight: "500",
                      color: "#4A5568",
                      fontFamily: "'Courier New', monospace"
                    }}>
                      •••
                    </p>
                  </div>
                </div>

                {/* Status indicator */}
                <div style={{
                  position: "absolute",
                  bottom: "0",
                  left: "0",
                  right: "0",
                  height: "4px",
                  backgroundColor: expired ? "#F56565" : "#48BB78",
                  borderBottomLeftRadius: "16px",
                  borderBottomRightRadius: "16px"
                }} />
              </div>
            );
          })}
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