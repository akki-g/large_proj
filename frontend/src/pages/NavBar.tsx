import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import './NavBar.css'; // Import the custom CSS file

const logo = "/logo.webp";
const logoutIcon = "/logoutButton.png";
const userSettingsIcon = "/userSettings.png";

const NavBar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleChatRedirect = () => {
    navigate('/chat');
  };

  return (
    <Navbar  expand="lg" fixed="top" className="navbar-custom">
      <Container fluid>
        {/* Left Side: Logo and App Name */}
        <div className="left-container">
          <img src={logo} alt="Logo" className="logo" />
          <span className="app-name">Syllab.AI</span>
        </div>

        {/* Right Side: Buttons */}
        <div className="right-container">
          <Button
            variant="outline-secondary"
            onClick={() => alert('Settings clicked')}
            className="icon-button"
          >
            <img src={userSettingsIcon} alt="Settings" className="icon" />
          </Button>
          <Button
            variant="outline-primary"
            onClick={handleChatRedirect}
            className="icon-button"
          >
            Chatbot
          </Button>
          <Button
            variant="link"
            onClick={handleLogout}
            className="logout-button"
          >
            <img src={logoutIcon} alt="Logout" className="logout-icon" />
          </Button>
        </div>
      </Container>
    </Navbar>
  );
};

export default NavBar; 