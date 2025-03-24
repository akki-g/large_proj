
import React, {useState, useEffect, useRef} from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './LoginPage.css';

const logo = "/logo.webp";


const VerifyEmailPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const didVerify = useRef(false);

    useEffect(() => {
        if (didVerify.current) return;
        didVerify.current = true;
        
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');
        if (!token) {
            setError("Verification token is missing");
            return;
        }

        setLoading(true);
        axios
        .get(`https://api.scuba2havefun.xyz/api/auth/verify-email?token=${token}`)
        .then((response) => {
            setMessage(response.data.msg || 'Email verified successfully');
            setError('');
        })
        .catch((err) => {
            setError(
                err.response?.data?.msg ||
                err.response?.data?.error ||
                "Something went wrong during email verification."
            );
            setMessage('');
        })
        .finally(() => {
            setLoading(false);
        });
    }, [location.search]);

    return (
        <div className="container">
          <div className="app-header">
            <img src={logo} alt="App Logo" className="logo" />
            <h2 className="app-name">Syllab.AI</h2>
          </div>
          <div className="horizontal-line"></div>
          <h2 className="login">Email Verification</h2>
          {loading && <p>Verifying...</p>}
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
          <button onClick={() => navigate('/login')} className="button">
            Back to Login
          </button>
        </div>
      );
        
};

export default VerifyEmailPage;