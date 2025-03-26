import React, { useState, useEffect, useRef, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './LoginPage.css';

const logo = "/logo.webp";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [tokenValid, setTokenValid] = useState<boolean>(true);
  const [passwordValid, setPasswordValid] = useState<boolean>(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const didValidateToken = useRef(false);

  useEffect(() => {
    if (didValidateToken.current) return;
    didValidateToken.current = true;
    
    const searchParams = new URLSearchParams(location.search);
    const urlToken = searchParams.get('token');
    if (!urlToken) {
      setError("Reset token is missing");
      setTokenValid(false);
      return;
    }
    
    setToken(urlToken);
  }, [location.search]);

  useEffect(() => {
    validatePassword(newPassword);
  }, [newPassword]);

  const validatePassword = (password: string) => {
    const errors = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    setPasswordErrors(errors);
    setPasswordValid(errors.length === 0);
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!passwordValid) {
      setError('Password is invalid. Please check the requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`https://api.scuba2havefun.xyz/api/auth/reset-password?token=${token}`, {
        newPassword
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setMessage(response.data.msg || "Password reset successful! You can now login with your new password.");
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
      <h2 className="login">Reset Password</h2>
      
      {!tokenValid ? (
        <div>
          <p className="error">Invalid or expired reset link</p>
          <button onClick={() => navigate('/forgot-password')} className="button">
            Request New Reset Link
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="form">
          <div className="formGroup">
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="input"
              placeholder="New Password"
            />
            {newPassword.length > 0 && (
              <div className="passwordRequirements">
                {passwordErrors.length > 0 ? (
                  <ul className="passwordErrorList">
                    {passwordErrors.map((err, index) => (
                      <li key={index} className="passwordError">{err}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="passwordValid">Password meets all requirements</p>
                )}
              </div>
            )}
          </div>
          <div className="formGroup">
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="input"
              placeholder="Confirm Password"
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="passwordError">Passwords do not match</p>
            )}
          </div>
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
          <button type="submit" disabled={loading} className="button">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
      <button
        onClick={() => navigate('/login')}
        className="transparent-button"
      >
        Back to Login
      </button>
    </div>
  );
};

export default ResetPasswordPage;