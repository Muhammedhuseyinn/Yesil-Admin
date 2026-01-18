// // src/App.jsx
// import React, { useState, useEffect } from "react";
// import { auth } from "./firebase";
// import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

// // Pages (your collections)
// import Addresses from "./pages/Addresses";
// import Cards from "./pages/Cards";
// import Categories from "./pages/Categories";
// import FreeFoodRequests from "./pages/FreeFoodRequests";
// import HelpRequests from "./pages/HelpRequests";
// import Orderss from "./pages/Orderss";
// import Users from "./pages/Users";

// // Icons
// import { MdDashboard, MdCategory, MdStore, MdPeople, MdShoppingCart, MdHelp, MdFreeBreakfast } from "react-icons/md";

// // Theme
// const theme = {
//   primary: "#01615F",
//   primaryLight: "#028C89",
//   red: "#E74C3C",
//   grayLight: "#f5f5f5",
//   grayDark: "#333",
//   white: "#fff",
// };

// const tabs = [
//   { id: "addresses", icon: <MdDashboard />, label: "Addresses" },
//   { id: "cards", icon: <MdCategory />, label: "Cards" },
//   { id: "categories", icon: <MdStore />, label: "Categories" },
//   { id: "freeFoodRequests", icon: <MdFreeBreakfast />, label: "Free Food Requests" },
//   { id: "helpRequests", icon: <MdHelp />, label: "Help Requests" },
//   { id: "orderss", icon: <MdShoppingCart />, label: "Orders" },
//   { id: "users", icon: <MdPeople />, label: "Users" },
// ];

// export default function App() {
//   const [activeTab, setActiveTab] = useState("addresses");
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Check auth
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (u) => {
//       setUser(u);
//       setLoading(false);
//     });
//     return () => unsubscribe();
//   }, []);

//   const handleLogin = async (email, password) => {
//     try {
//       await signInWithEmailAndPassword(auth, email, password);
//     } catch (err) {
//       alert("Login failed: " + err.message);
//     }
//   };

//   const handleLogout = async () => await signOut(auth);

//   if (loading)
//     return (
//       <div style={{ 
//         display: "flex", 
//         justifyContent: "center", 
//         alignItems: "center", 
//         height: "100vh",
//         width: "100vw"
//       }}>
//         Loading...
//       </div>
//     );

//   if (!user) return <LoginForm onLogin={handleLogin} />;

//   const renderContent = () => {
//     switch (activeTab) {
//       case "addresses": return <Addresses />;
//       case "cards": return <Cards />;
//       case "categories": return <Categories />;
//       case "freeFoodRequests": return <FreeFoodRequests />;
//       case "helpRequests": return <HelpRequests />;
//       case "orderss": return <Orderss />;
//       case "users": return <Users />;
//       default: return <Addresses />;
//     }
//   };

//   return (
//     <div style={{ 
//       display: "flex", 
//       height: "100vh", 
//       width: "100vw", // Add this
//       fontFamily: "Arial, sans-serif",
//       margin: 0,
//       padding: 0,
//       position: "fixed", // Make it cover entire viewport
//       top: 0,
//       left: 0,
//       right: 0,
//       bottom: 0,
//       overflow: "hidden"
//     }}>

//       {/* Sidebar */}
//       <div style={{
//         width: 240,
//         backgroundColor: theme.primary,
//         color: theme.white,
//         display: "flex",
//         flexDirection: "column",
//         padding: "20px 0",
//         height: "100vh",
//         boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
//         flexShrink: 0 // Prevent sidebar from shrinking
//       }}>
//         <div style={{ fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 40 }}>Admin Panel</div>
//         <div style={{ flex: 1, overflowY: "auto" }}>
//           {tabs.map(tab => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 16,
//                 width: "90%",
//                 margin: "0 auto 10px",
//                 padding: "12px 16px",
//                 border: "none",
//                 borderRadius: 10,
//                 cursor: "pointer",
//                 fontSize: 16,
//                 backgroundColor: activeTab === tab.id ? theme.primaryLight : "transparent",
//                 color: theme.white,
//                 transition: "0.2s",
//                 textAlign: "left"
//               }}
//             >
//               {tab.icon} {tab.label}
//             </button>
//           ))}
//         </div>

//         <button
//           onClick={handleLogout}
//           style={{
//             width: "90%",
//             margin: "0 auto 20px",
//             padding: 12,
//             borderRadius: 10,
//             backgroundColor: theme.red,
//             border: "none",
//             color: "white",
//             fontWeight: "bold",
//             cursor: "pointer",
//           }}
//         >
//           Logout
//         </button>
//       </div>

//       {/* Main */}
//       <div style={{ 
//         flex: 1, 
//         display: "flex", 
//         flexDirection: "column", 
//         height: "100vh", 
//         backgroundColor: theme.grayLight,
//         overflow: "hidden",
//         minWidth: 0 // Allow content area to shrink properly
//       }}>
//         {/* Header */}
//         <div style={{
//           height: 70,
//           minHeight: 70,
//           backgroundColor: theme.white,
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "0 30px",
//           borderBottom: `1px solid #ddd`,
//           boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
//           flexShrink: 0
//         }}>
//           <h2 style={{ margin: 0, color: theme.grayDark }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
//           <div style={{ fontWeight: "bold", color: theme.primary }}>Admin</div>
//         </div>

//         {/* Content */}
//         <div style={{ 
//           flex: 1, 
//           padding: 30, 
//           overflowY: "auto",
//           overflowX: "hidden"
//         }}>
//           {renderContent()}
//         </div>
//       </div>
//     </div>
//   );
// }

// // Login form
// function LoginForm({ onLogin }) {
//   const [email, setEmail] = React.useState("");
//   const [password, setPassword] = React.useState("");

//   return (
//     <div style={{
//       display: "flex",
//       justifyContent: "center",
//       alignItems: "center",
//       height: "100vh",
//       width: "100vw",
//       backgroundColor: "#f0f2f5",
//       position: "fixed",
//       top: 0,
//       left: 0,
//       right: 0,
//       bottom: 0
//     }}>
//       <div style={{
//         width: 420,
//         maxWidth: "90%",
//         backgroundColor: "#fff",
//         padding: 50,
//         borderRadius: 16,
//         boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
//       }}>
//         <h2 style={{ textAlign: "center", marginBottom: 30, color: "#01615F" }}>Admin Login</h2>
//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={e => setEmail(e.target.value)}
//           style={{ width: "100%", padding: 14, marginBottom: 15, borderRadius: 8, border: "1px solid #ccc" }}
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={e => setPassword(e.target.value)}
//           style={{ width: "100%", padding: 14, marginBottom: 25, borderRadius: 8, border: "1px solid #ccc" }}
//         />
//         <button
//           onClick={() => onLogin(email, password)}
//           style={{
//             width: "100%",
//             padding: 14,
//             borderRadius: 8,
//             backgroundColor: "#01615F",
//             color: "#01615F",
//             fontWeight: "bold",
//             border: "none",
//             cursor: "pointer",
//             fontSize: 16
//           }}
//         >
//           Login
//         </button>
//       </div>
//     </div>
//   );
// }
import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

// Import only existing pages - make sure these files exist
import Addresses from "./pages/Addresses";
import Cards from "./pages/Cards";
import Categories from "./pages/Categories";
import FreeFoodRequests from "./pages/FreeFoodRequests";
import HelpRequests from "./pages/HelpRequests";
import Orderss from "./pages/Orderss";
import Users from "./pages/Users";
import Chats from "./pages/Chats";
import Notifications from "./pages/Notifications";
import Banners from "./pages/Banners";

// Icons - only import what we use
import {
  MdDashboard,
  MdCategory,
  MdStore,
  MdPeople,
  MdShoppingCart,
  MdHelp,
  MdChat,
  MdFreeBreakfast,
  MdLogout,
  MdMenu,
  MdNotifications,
  MdSearch,
  MdArrowDropDown,
  MdAdminPanelSettings,
  MdDateRange,
  MdError,
  MdViewCarousel
} from "react-icons/md";

// Theme colors
// Theme colors using CSS variables defined in index.css
const theme = {
  primary: "var(--primary)",
  primaryLight: "var(--primary-light)",
  primaryDark: "var(--primary-dark)",
  secondary: "var(--secondary)",
  accent: "var(--accent)",
  red: "var(--red)",
  yellow: "var(--yellow)",
  blue: "var(--blue)",
  grayLight: "var(--bg-light)",
  grayMedium: "var(--border)",
  grayDark: "var(--text-medium)",
  grayDarker: "var(--text-dark)",
  white: "var(--bg-white)",
  black: "var(--text-main)"
};

// Navigation tabs
const tabs = [
  { id: "addresses", icon: <MdDashboard />, label: "Addresses", color: theme.blue },
  { id: "cards", icon: <MdCategory />, label: "Cards", color: theme.secondary },
  { id: "categories", icon: <MdStore />, label: "Categories", color: theme.accent },
  { id: "freeFoodRequests", icon: <MdFreeBreakfast />, label: "Free Food Requests", color: theme.yellow },
  { id: "helpRequests", icon: <MdHelp />, label: "Help Requests", color: theme.red },
  { id: "chats", icon: <MdChat />, label: "Support Chats", color: theme.primary },
  { id: "orderss", icon: <MdShoppingCart />, label: "Orders", color: theme.primary },
  { id: "users", icon: <MdPeople />, label: "Users", color: theme.secondary },
  { id: "notifications", icon: <MdNotifications />, label: "Notifications", color: theme.accent },
  { id: "banners", icon: <MdViewCarousel />, label: "Home Banners", color: theme.primary },
];

// Fallback component if a page fails to load
const PageFallback = ({ pageName }) => (
  <div style={{
    padding: "40px",
    textAlign: "center",
    color: theme.grayDark
  }}>
    <h3>Unable to load {pageName}</h3>
    <p>Please check that the component file exists and has no errors.</p>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState("addresses");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loginError, setLoginError] = useState("");

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser);
      setUser(currentUser);
      setLoading(false);
    }, (error) => {
      console.error("Auth error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      setLoginError("");
      console.log("Attempting login with:", email);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.code === 'auth/invalid-credential'
        ? "Invalid email or password"
        : err.message;
      setLoginError(errorMessage);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: theme.grayLight
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "60px",
            height: "60px",
            border: `4px solid ${theme.grayMedium}`,
            borderTopColor: theme.primary,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px"
          }} />
          <p style={{
            color: theme.grayDark,
            fontSize: "16px",
            fontWeight: "500"
          }}>Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show login form
  if (!user) {
    console.log("No user, showing login form");
    return <LoginForm onLogin={handleLogin} error={loginError} />;
  }

  // Render content with error boundary
  const renderContent = () => {
    try {
      switch (activeTab) {
        case "addresses": return <Addresses />;
        case "cards": return <Cards />;
        case "categories": return <Categories />;
        case "freeFoodRequests": return <FreeFoodRequests />;
        case "helpRequests": return <HelpRequests />;
        case "orderss": return <Orderss />;
        case "chats": return <Chats />;
        case "users": return <Users />;
        case "notifications": return <Notifications />;
        case "banners": return <Banners />;
        default: return <PageFallback pageName={activeTab} />;
      }
    } catch (error) {
      console.error(`Error loading ${activeTab}:`, error);
      return <PageFallback pageName={activeTab} />;
    }
  };

  const getActiveTabInfo = () => {
    return tabs.find(tab => tab.id === activeTab) || tabs[0];
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      width: "100vw",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      margin: 0,
      padding: 0,
      backgroundColor: theme.grayLight,
      overflow: "hidden"
    }}>

      {/* Sidebar */}
      <aside style={{
        width: sidebarCollapsed ? "80px" : "280px",
        backgroundColor: theme.white,
        color: theme.grayDarker,
        display: "flex",
        flexDirection: "column",
        padding: "0",
        height: "100vh",
        boxShadow: "4px 0 20px rgba(0,0,0,0.06)",
        flexShrink: 0,
        zIndex: 100,
        transition: "all 0.3s ease",
        borderRight: `1px solid ${theme.grayMedium}`
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: "24px",
          borderBottom: `1px solid ${theme.grayMedium}`,
          display: "flex",
          alignItems: "center",
          justifyContent: sidebarCollapsed ? "center" : "space-between"
        }}>
          {!sidebarCollapsed ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  backgroundColor: theme.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: theme.white,
                  fontWeight: "bold",
                  fontSize: "20px"
                }}>
                  A
                </div>
                <div>
                  <div style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: theme.grayDarker,
                    lineHeight: "1.2"
                  }}>
                    Admin Panel
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: theme.grayDark,
                    opacity: 0.8
                  }}>
                    v1.0.0
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{
                  background: "none",
                  border: "none",
                  color: theme.grayDark,
                  cursor: "pointer",
                  fontSize: "20px",
                  padding: "8px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.grayMedium}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <MdMenu />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                background: "none",
                border: "none",
                color: theme.grayDark,
                cursor: "pointer",
                fontSize: "20px",
                padding: "8px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.grayMedium}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <MdMenu />
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px"
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: sidebarCollapsed ? "0" : "16px",
                width: "100%",
                margin: "0 0 8px",
                padding: sidebarCollapsed ? "12px" : "14px 16px",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontSize: sidebarCollapsed ? "20px" : "15px",
                backgroundColor: activeTab === tab.id ? `${tab.color}15` : "transparent",
                color: activeTab === tab.id ? tab.color : theme.grayDark,
                fontWeight: activeTab === tab.id ? "600" : "500",
                transition: "all 0.2s ease",
                textAlign: sidebarCollapsed ? "center" : "left",
                position: "relative",
                justifyContent: sidebarCollapsed ? "center" : "flex-start"
              }}
              onMouseOver={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = theme.grayMedium + "20";
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <div style={{
                fontSize: sidebarCollapsed ? "22px" : "20px",
                display: "flex",
                alignItems: "center"
              }}>
                {tab.icon}
              </div>
              {!sidebarCollapsed && <span>{tab.label}</span>}

              {activeTab === tab.id && (
                <div style={{
                  position: "absolute",
                  right: sidebarCollapsed ? "auto" : "16px",
                  left: sidebarCollapsed ? "50%" : "auto",
                  transform: sidebarCollapsed ? "translateX(-50%)" : "none",
                  top: sidebarCollapsed ? "calc(100% + 4px)" : "50%",
                  width: sidebarCollapsed ? "4px" : "4px",
                  height: sidebarCollapsed ? "4px" : "16px",
                  backgroundColor: tab.color,
                  borderRadius: "2px"
                }} />
              )}
            </button>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div style={{
          padding: "24px 16px",
          borderTop: `1px solid ${theme.grayMedium}`,
          backgroundColor: theme.grayLight
        }}>
          {!sidebarCollapsed ? (
            <>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px"
              }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  backgroundColor: theme.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: theme.white,
                  fontWeight: "bold",
                  fontSize: "18px",
                  flexShrink: 0
                }}>
                  {user.email?.charAt(0).toUpperCase() || "A"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: theme.grayDarker,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {user.displayName || user.email?.split('@')[0] || "Admin User"}
                  </div>
                  <div style={{
                    fontSize: "13px",
                    color: theme.grayDark,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {user.email || "admin@example.com"}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  backgroundColor: theme.red + "15",
                  border: `1px solid ${theme.red}30`,
                  color: theme.red,
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = theme.red + "25";
                  e.currentTarget.style.borderColor = theme.red + "50";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = theme.red + "15";
                  e.currentTarget.style.borderColor = theme.red + "30";
                }}
              >
                <MdLogout />
                Logout
              </button>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: theme.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.white,
                fontWeight: "bold",
                fontSize: "16px"
              }}>
                {user.email?.charAt(0).toUpperCase() || "A"}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  backgroundColor: theme.red + "15",
                  border: `1px solid ${theme.red}30`,
                  color: theme.red,
                  cursor: "pointer",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = theme.red + "25";
                  e.currentTarget.style.borderColor = theme.red + "50";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = theme.red + "15";
                  e.currentTarget.style.borderColor = theme.red + "30";
                }}
              >
                <MdLogout />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: theme.grayLight,
        overflow: "hidden",
        minWidth: 0
      }}>
        {/* Header */}
        <header style={{
          height: "80px",
          minHeight: "80px",
          backgroundColor: theme.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          borderBottom: `1px solid ${theme.grayMedium}`,
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          flexShrink: 0,
          zIndex: 50
        }}>
          {/* Left Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: theme.grayDark,
                  cursor: "pointer",
                  fontSize: "24px",
                  padding: "8px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.grayMedium + "30"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <MdMenu />
              </button>
            )}

            <div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <h1 style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: "700",
                  color: theme.grayDarker,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    backgroundColor: getActiveTabInfo().color + "20",
                    color: getActiveTabInfo().color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px"
                  }}>
                    {getActiveTabInfo().icon}
                  </div>
                  {getActiveTabInfo().label}
                </h1>
                <div style={{
                  padding: "6px 12px",
                  backgroundColor: theme.grayMedium + "30",
                  color: theme.grayDark,
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <MdAdminPanelSettings size={14} />
                  Admin Dashboard
                </div>
              </div>
              <p style={{
                margin: "6px 0 0",
                fontSize: "14px",
                color: theme.grayDark,
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <MdDateRange size={14} />
                {formatDate()}
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "20px"
          }}>
            {/* Search Bar */}
            <div style={{ position: "relative", width: "300px" }}>
              <MdSearch style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: theme.grayDark,
                fontSize: "20px"
              }} />
              <input
                type="text"
                placeholder="Search dashboard..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 20px 12px 48px",
                  border: `1px solid ${theme.grayMedium}`,
                  borderRadius: "12px",
                  fontSize: "14px",
                  backgroundColor: theme.white,
                  color: theme.grayDarker,
                  transition: "all 0.2s ease"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.primary;
                  e.target.style.boxShadow = `0 0 0 3px ${theme.primary}15`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.grayMedium;
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: "none",
                  border: "none",
                  color: theme.grayDark,
                  cursor: "pointer",
                  fontSize: "22px",
                  padding: "10px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.grayMedium + "30"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <MdNotifications />
                <div style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: theme.red,
                  borderRadius: "50%",
                  border: `2px solid ${theme.white}`
                }} />
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: 0,
                  width: "320px",
                  backgroundColor: theme.white,
                  borderRadius: "16px",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                  border: `1px solid ${theme.grayMedium}`,
                  zIndex: 1000,
                  overflow: "hidden"
                }}>
                  <div style={{
                    padding: "20px",
                    borderBottom: `1px solid ${theme.grayMedium}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div style={{ fontSize: "16px", fontWeight: "600", color: theme.grayDarker }}>
                      Notifications
                    </div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: theme.primary,
                        fontWeight: "600",
                        cursor: "pointer",
                        fontSize: "12px",
                        padding: "4px 8px",
                        borderRadius: "4px"
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    <div style={{ padding: "20px", textAlign: "center", color: theme.grayDark }}>
                      No new notifications
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 12px 8px 8px",
              borderRadius: "12px",
              backgroundColor: theme.white,
              border: `1px solid ${theme.grayMedium}`,
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.grayMedium + "15"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.white}
            >
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: theme.primary + "20",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.primary,
                fontWeight: "bold",
                fontSize: "16px"
              }}>
                {user.email?.charAt(0).toUpperCase() || "A"}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: theme.grayDarker
                }}>
                  {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || "Admin"}
                </div>
                <div style={{
                  fontSize: "12px",
                  color: theme.grayDark
                }}>
                  Administrator
                </div>
              </div>
              <MdArrowDropDown style={{ color: theme.grayDark, fontSize: "20px" }} />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <section style={{
          flex: 1,
          padding: "32px",
          overflowY: "auto",
          overflowX: "hidden"
        }}>
          <div style={{
            backgroundColor: theme.white,
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            border: `1px solid ${theme.grayMedium}`,
            minHeight: "calc(100vh - 200px)"
          }}>
            {renderContent()}
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          padding: "20px 32px",
          backgroundColor: theme.white,
          borderTop: `1px solid ${theme.grayMedium}`,
          fontSize: "13px",
          color: theme.grayDark,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0
        }}>
          <div>
            © {new Date().getFullYear()} Admin Dashboard v1.0.0
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            <button
              style={{
                background: "none",
                border: "none",
                color: theme.grayDark,
                cursor: "pointer",
                fontSize: "13px"
              }}
              onMouseOver={(e) => e.target.style.color = theme.primary}
              onMouseOut={(e) => e.target.style.color = theme.grayDark}
            >
              Privacy Policy
            </button>
            <button
              style={{
                background: "none",
                border: "none",
                color: theme.grayDark,
                cursor: "pointer",
                fontSize: "13px"
              }}
              onMouseOver={(e) => e.target.style.color = theme.primary}
              onMouseOut={(e) => e.target.style.color = theme.grayDark}
            >
              Terms of Service
            </button>
            <button
              style={{
                background: "none",
                border: "none",
                color: theme.grayDark,
                cursor: "pointer",
                fontSize: "13px"
              }}
              onMouseOver={(e) => e.target.style.color = theme.primary}
              onMouseOut={(e) => e.target.style.color = theme.grayDark}
            >
              Help Center
            </button>
          </div>
        </footer>
      </main>

      {/* Global Styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        input:focus {
          outline: none;
        }
        
        button:focus {
          outline: 2px solid ${theme.primary}40;
          outline-offset: 2px;
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}

// Login form
function LoginForm({ onLogin, error }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return;
    }

    setIsLoading(true);
    await onLogin(email, password);
    setIsLoading(false);
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      width: "100vw",
      backgroundColor: theme.grayLight,
      backgroundImage: "linear-gradient(135deg, #01615F 0%, #028C89 100%)",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      <div style={{
        width: "440px",
        maxWidth: "90%",
        backgroundColor: theme.white,
        padding: "48px 40px",
        borderRadius: "24px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative Elements */}
        <div style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "120px",
          height: "120px",
          backgroundColor: theme.primary + "10",
          borderRadius: "0 24px 0 100%"
        }} />

        <div style={{
          textAlign: "center",
          marginBottom: "40px"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            backgroundColor: theme.primary,
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            color: theme.white,
            fontWeight: "bold",
            fontSize: "32px",
            boxShadow: `0 10px 30px ${theme.primary}40`
          }}>
            A
          </div>
          <h2 style={{
            margin: "0 0 12px",
            color: theme.grayDarker,
            fontSize: "32px",
            fontWeight: "700",
            letterSpacing: "-0.5px"
          }}>
            Welcome Back
          </h2>
          <p style={{
            margin: 0,
            color: theme.grayDark,
            fontSize: "16px",
            lineHeight: "1.5"
          }}>
            Sign in to your admin dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Error Message */}
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
              <div style={{ fontSize: "14px", fontWeight: "500" }}>{error}</div>
            </div>
          )}

          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              marginBottom: "10px",
              fontSize: "14px",
              fontWeight: "600",
              color: theme.grayDark
            }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "16px 20px 16px 48px",
                  borderRadius: "12px",
                  border: `1px solid ${theme.grayMedium}`,
                  fontSize: "15px",
                  backgroundColor: theme.white,
                  color: theme.grayDarker,
                  transition: "all 0.2s ease",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.primary;
                  e.target.style.boxShadow = `0 0 0 3px ${theme.primary}15`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.grayMedium;
                  e.target.style.boxShadow = "none";
                }}
              />
              <div style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: theme.grayDark,
                fontSize: "20px"
              }}>
                ✉️
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <label style={{
                fontSize: "14px",
                fontWeight: "600",
                color: theme.grayDark
              }}>
                Password
              </label>
              <button
                type="button"
                style={{
                  fontSize: "13px",
                  color: theme.primary,
                  background: "none",
                  border: "none",
                  textDecoration: "none",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "color 0.2s ease"
                }}
                onMouseOver={(e) => e.target.style.color = theme.primaryDark}
                onMouseOut={(e) => e.target.style.color = theme.primary}
              >
                Forgot password?
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "16px 20px 16px 48px",
                  borderRadius: "12px",
                  border: `1px solid ${theme.grayMedium}`,
                  fontSize: "15px",
                  backgroundColor: theme.white,
                  color: theme.grayDarker,
                  transition: "all 0.2s ease",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.primary;
                  e.target.style.boxShadow = `0 0 0 3px ${theme.primary}15`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.grayMedium;
                  e.target.style.boxShadow = "none";
                }}
              />
              <div style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: theme.grayDark,
                fontSize: "20px"
              }}>
                🔒
              </div>
            </div>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "32px"
          }}>
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              style={{
                width: "18px",
                height: "18px",
                cursor: "pointer"
              }}
            />
            <label htmlFor="remember" style={{
              fontSize: "14px",
              color: theme.grayDark,
              cursor: "pointer",
              userSelect: "none"
            }}>
              Remember me for 30 days
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: "12px",
              backgroundColor: theme.primary,
              color: theme.white,
              fontWeight: "600",
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "16px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              opacity: isLoading ? 0.8 : 1,
              boxShadow: `0 4px 15px ${theme.primary}40`
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = theme.primaryDark;
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = `0 6px 20px ${theme.primary}60`;
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = theme.primary;
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = `0 4px 15px ${theme.primary}40`;
              }
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: "20px",
                  height: "20px",
                  border: `2px solid ${theme.white}30`,
                  borderTopColor: theme.white,
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }} />
                Signing in...
              </>
            ) : (
              "Sign in to Dashboard"
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}