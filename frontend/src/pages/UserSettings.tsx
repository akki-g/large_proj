// UserSettings.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from './NavBar'; // Import the NavBar component
import './UserSettings.css'; // Import styles
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap for buttons

const UserSettings: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    const email = prompt('Please enter your email to reset your password:');
    if (email) {
      try {
        // API call to reset password
        await axios.post('https://api.scuba2havefun.xyz/api/user/reset-password', {
          email,
        });

        setMessage('Password reset email sent. Please check your inbox.');
      } catch (error) {
        setError('Error resetting password. Please try again.');
      }
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
          <button className="btn btn-danger" onClick={handleDeleteAccount}>
            Delete Account
          </button>

          <button className="btn btn-success" onClick={handleResetPassword}>
            Reset Password
          </button>

          <button className="btn btn-primary" onClick={handleBackToDashboard}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;