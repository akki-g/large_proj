import React, { useState, FormEvent } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';

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
      setMessage(response.data.message || response.data.msg || "Login successful!");
      localStorage.setItem('token', response.data.token);

      // Navigate to the main page after successful login
      navigate('/main'); // Adjust the route to your main page route

    } catch (err: any) {
      // Check for error in both msg and error fields from backend response
      setError(err.response?.data?.msg || err.response?.data?.error || 'Something went wrong. Please try again.');
      console.log('Login error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="p-0 m-0 d-flex justify-content-center align-items-center vh-100">
      <div className="container">
        <Row>
          <Col xs={12} className="app-header">
            <img src={logo} alt="App Logo" className="logo" />
            <h2 className="app-name">Syllab.AI</h2>
          </Col>
        </Row>
        <div className="horizontal-line"></div>

        <h2 className="login">Login</h2>
        <form onSubmit={handleSubmit} className="form">
          <Row>
            <Col xs={12}>
              <div className="formGroup">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input w-100"
                  placeholder="Email"
                />
              </div>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <div className="formGroup">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input w-100"
                  placeholder="Password"
                />
              </div>
            </Col>
          </Row>
          <Row>
            <Col xs={12} className="text-center">
              <Link to="/forgot-password" className="transparent-button d-inline-block mb-2">
                Forgot Password?
              </Link>
            </Col>
          </Row>
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
          <button type="submit" disabled={loading} className="button w-100">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <Row className="mt-3">
          <Col xs={12} className="registerContainer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="registerLink">
                Register
              </Link>
            </p>
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default LoginPage;