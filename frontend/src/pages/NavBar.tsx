import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Modal, Button } from 'react-bootstrap';
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
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
    navigate('/settings'); // Redirect to the settings page
  };

  return (
    <div className="navbar-root">
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

        <div className="middle-container">
          <span className="motto">say sylla-bye to your study needs!</span>
        </div>

        {/* Right Side: Navigation Buttons */}
        <div className="right-container" role="navigation" aria-label="Site navigation">
          <button
            type="button"
            onClick={handleSettingsClick}
            className="nav-button icon-button"
            aria-label="User settings"
          >
            <img src={userSettingsIcon} alt="Settings Icon" className="icon" />
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
            onClick={() => setShowLogoutModal(true)}
            className="nav-button logout-button"
            aria-label="Log out"
          >
            <img src={logoutIcon} alt="Logout Icon" className="logout-icon" />
            <span className="visually-hidden">Logout</span>
          </button>
        </div>
      </Container>
    </nav>

    <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Logout</Modal.Title>
      </Modal.Header>
      <Modal.Body>Are you sure you want to logout?</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleLogout}>
          Logout
        </Button>
      </Modal.Footer>
    </Modal>
    </div>
  );
};

export default NavBar;