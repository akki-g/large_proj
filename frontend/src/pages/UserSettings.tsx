// UserSettings.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Form } from 'react-bootstrap';
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
  const [password, setPassword] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!password.trim()) {
      setError('Please enter your password to confirm account deletion.');
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      const jwtToken = localStorage.getItem('token');
      if (!jwtToken) {
        setError('No authentication token found. Please log in again.');
        setIsDeleting(false);
        return;
      }

      // Call the API to delete the account with password verification
      await axios.post('https://api.scuba2havefun.xyz/api/auth/delete-account', {
        password,
        jwtToken
      });

      // If successful, clear token and navigate to login
      setShowDeleteModal(false);
      localStorage.removeItem('token');
      navigate('/login');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(
        err.response?.data?.msg || 
        err.response?.data?.error || 
        'An error occurred while trying to delete your account. Please try again.'
      );
    } finally {
      setIsDeleting(false);
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

      {/* Delete Account Modal with Password Confirmation */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.</p>
          <p>Please enter your password to confirm:</p>
          <Form.Group controlId="password">
            <Form.Control
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>
          {error && <div className="error-message mt-2">{error}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowDeleteModal(false);
            setPassword('');
            setError(null);
          }}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteAccount}
            disabled={isDeleting || !password.trim()}
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
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