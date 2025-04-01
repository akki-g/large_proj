import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from './NavBar'; // Import the NavBar component
import './UserSettings.css'; // Optional: for styling

const UserSettings: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Handle account deletion
  const handleDeleteAccount = async () => {
    const confirmation = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (confirmation) {
      try {
        const jwtToken = localStorage.getItem('token');
        if (!jwtToken) {
          console.error('No JWT token found. Please log in.');
          return;
        }
        
        // API call to delete account (replace with your actual endpoint)
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
        // API call to reset password (replace with your actual endpoint)
        await axios.post('https://api.scuba2havefun.xyz/api/user/reset-password', { email });

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
      <NavBar /> {/* Add NavBar here */}
      
      <h1>User Settings</h1>
      
      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="user-settings-actions">
        <button className="delete-account-btn" onClick={handleDeleteAccount}>
          Delete Account
        </button>
        
        <button className="reset-password-btn" onClick={handleResetPassword}>
          Reset Password
        </button>
        
        {/* Back to Dashboard button */}
        <button className="back-to-dashboard-btn" onClick={handleBackToDashboard}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default UserSettings;