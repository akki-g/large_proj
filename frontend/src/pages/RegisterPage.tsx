import React, { useEffect, useState, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; // Import the CSS file

const logo = "/logo.webp"; 

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [passwordValid, setPasswordValid] = useState<boolean>(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    validatePassword(password);
  }
  , [password]);

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

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('https://api.scuba2havefun.xyz/api/auth/register', {
        firstName,
        lastName,
        email,
        password,
        phone,
      }, 
      {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setMessage(response.data.msg || "Registration successful!");
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
      <h2 className='register-text'>Register</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="formGroup">
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="input"
            placeholder="First Name"
          />
        </div>
        <div className="formGroup">
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="input"
            placeholder="Last Name"
          />
        </div>
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
        <div className="formGroup">
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
            placeholder="Password"
          />
          {password.length > 0 && (
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
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="passwordError">Passwords do not match</p>
          )}
        </div>
        <div className="formGroup">
          <input
            type="text"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="input"
            placeholder="Phone Number"
          />
        </div>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <button type="submit" disabled={loading} className="button">
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <button
        onClick={() => navigate('/login')}
        className='transparent-button'
      >
        Back to Login
      </button>
    </div>
  );
};

export default RegisterPage;