import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import './NavBar.css'; // Import the custom CSS file

const logo = "/logo.webp";
const logoutIcon = "/logoutButton.png";
const userSettingsIcon = "/userSettings.png";

/**
 * Main navigation component for the application
 * Provides links to main sections and logout functionality
 */
const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePath, setActivePath] = useState('/main');
  
  // Update active path when location changes
  useEffect(() => {
    setActivePath(location.pathname);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  const handleHomeRedirect = () => {
    navigate('/main');
  };

  const handleChatRedirect = () => {
    navigate('/chat');
  };

  const handleSettingsClick = () => {
    // TODO: Implement settings functionality
    alert('Settings clicked');
  };

  return (
    <nav className="navbar-custom" aria-label="Main navigation">
      <Container fluid className="navbar-container">
        {/* Left Side: Logo and App Name with home link */}
        <div className="left-container">
          <button 
            onClick={handleHomeRedirect} 
            className={`home-link ${activePath === '/main' ? 'active' : ''}`}
            aria-label="Go to dashboard"
          >
            <img src={logo} alt="Syllab.AI Logo" className="logo" />
            <span className="app-name">Syllab.AI</span>
          </button>
        </div>

        {/* Right Side: Navigation Buttons */}
        <div className="right-container" role="navigation" aria-label="Site navigation">
          <button
            type="button"
            onClick={handleSettingsClick}
            className="nav-button icon-button"
            aria-label="User settings"
          >
            <img src={userSettingsIcon} alt="" className="icon" />
            <span className="button-text">Settings</span>
          </button>
          
          <button
            type="button"
            onClick={handleChatRedirect}
            className={`nav-button chat-button ${activePath === '/chat' ? 'active' : ''}`}
            aria-label="Open chatbot"
          >
            <span className="button-text">Chatbot</span>
          </button>
          
          <button
            type="button"
            onClick={handleLogout}
            className="nav-button logout-button"
            aria-label="Log out"
          >
            <img src={logoutIcon} alt="" className="logout-icon" />
            <span className="visually-hidden">Logout</span>
          </button>
        </div>
      </Container>
    </nav>
  );
};

export default NavBar;