// UserSettings.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import NavBar from './NavBar'; // Import the NavBar component
import './UserSettings.css'; // Import styles
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap for buttons

const UserSettings: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');

  // Handle account deletion
  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (confirmation) {
      try {
        const jwtToken = localStorage.getItem('token');
        if (!jwtToken) {
          console.error('No JWT token found. Please log in.');
          return;
        }

        // API call to delete account
        await axios.delete('https://api.scuba2havefun.xyz/api/user/delete', {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });

        // After successful deletion, clear token and navigate
        localStorage.removeItem('token');
        navigate('/login'); // Redirect to login page
      } catch (error) {
        setError('Error deleting account. Please try again.');
      }
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    setShowResetModal(false); // Close the modal

    if(!email.trim()) {
      setError('Please enter a valid email.');
      return;
    }
    
    try {
      // API call to reset password
      console.log(email);

      await axios.post('https://api.scuba2havefun.xyz/api/auth/forgot-password', {
        email: email
      });

      setMessage('Password reset email sent. Please check your inbox.');
    } catch (error) {
      setError('Error resetting password. Please try again.');
    }
    
  };

  // Handle back to dashboard redirect
  const handleBackToDashboard = () => {
    navigate('/main'); // Navigate back to the dashboard
  };

  return (
    <div className="user-settings-container">
      <NavBar /> {/* Add NavBar */}
      
      <div className="user-settings-card">
        <h1>Settings</h1>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <div className="user-settings-actions">
          <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
            Delete Account
          </button>

          <button className="btn btn-success" onClick={() => setShowResetModal(true)}>
            Reset Password
          </button>

          <button className="btn btn-primary" onClick={handleBackToDashboard}>
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete your account? This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteAccount}>
            Delete Account
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reset Password Modal */}
      <Modal show={showResetModal} onHide={() => setShowResetModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="email">
              <Form.Label>Enter your email address.</Form.Label>
              <Form.Control
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleResetPassword}>
            Send Reset Email
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserSettings;