import React, { useState, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const logo = "/logo.webp"; 

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post('https://api.scuba2havefun.xyz/api/auth/forgot-password', {
        email
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setMessage(response.data.msg || "Reset link sent! Please check your email.");
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.msg || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="app-header">
        <img src={logo} alt="App Logo" className="logo" />
        <h2 className="app-name">Syllab.AI</h2>
      </div>
      <div className="horizontal-line"></div>
      <h2 className="login">Forgot Password</h2>
      <p>Enter your email address We'll send you a link to reset your password.</p>
      <form onSubmit={handleSubmit} className="form">
        <div className="formGroup">
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
            placeholder="Email"
          />
        </div>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <button type="submit" disabled={loading} className="button">
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      <button
        onClick={() => navigate('/login')}
        className="transparent-button"
      >
        Back to Login
      </button>
    </div>
  );
};

export default ForgotPasswordPage;