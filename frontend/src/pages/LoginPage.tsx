import React, { useState, FormEvent } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const logo = "/logo.webp"; 

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate(); // Initialize the navigate function

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post('https://api.scuba2havefun.xyz/api/auth/login', {
        email,
        password,
      });
      setMessage(response.data.msg || "Login successful!");
      localStorage.setItem('token', response.data.token);

      // Navigate to the main page after successful login
      navigate('/main'); // Adjust the route to your main page route

    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
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

      <h2 className="login">Login</h2>
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
        </div>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <button type="submit" disabled={loading} className="button">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="registerContainer">
        <p>
          Don't have an account?{' '}
          <Link to="/register" className="registerLink">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;