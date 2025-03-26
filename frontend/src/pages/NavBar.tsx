import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, Nav, Button } from 'react-bootstrap';
import './NavBar.css'; // Import the custom CSS file

const logo = "/logo.webp";  // Define the logo path here
const logoutIcon = "/logoutButton.png";  // Define the logout button icon path
const userSettingsIcon = "/userSettings.png";  // Define the settings button icon path

const NavBar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login'); // Redirect to login page after logout
  };

  const handleChatRedirect = () => {
    navigate('/chat'); // Redirect to ChatPage
  };

  return (
    <Navbar bg="light" expand="lg" fixed="top" className="navbar-custom w-100">
      <Navbar.Toggle aria-controls="navbar-nav" />
      <Navbar.Collapse id="navbar-nav">
        <Nav className="w-100 d-flex justify-content-between align-items-center">
          {/* Left Side: Settings Icon, Chatbot Button */}
          <div className="d-flex align-items-center">
            <Button variant="outline-secondary" onClick={() => alert("Settings clicked")} className="icon-button">
              <img src={userSettingsIcon} alt="Settings" className="icon" />
            </Button>
            <Button variant="outline-primary" onClick={handleChatRedirect} className="icon-button">
              Chatbot
            </Button>
          </div>

          {/* Center: Logo and App Name */}
          <div className="center-container">
            <img src={logo} alt="Logo" className="logo" />
            <span className="app-name">Syllab.AI</span>
          </div>

          {/* Right Side: Logout Button */}
          <div className="d-flex align-items-center">
            <Button variant="link" onClick={handleLogout} className="logout-button">
              <img src={logoutIcon} alt="Logout" className="logout-icon" />
            </Button>
          </div>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default NavBar;