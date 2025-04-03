import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const SessionValidator: React.FC = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if token exists
    const checkToken = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setShowModal(true);
      }
    };

    // Check token immediately
    checkToken();

    // Set up interval to check token periodically
    const intervalId = setInterval(checkToken, 5 * 60 * 1000); // Check every 5 minutes

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleLogin = () => {
    localStorage.removeItem('token'); // Clear any invalid token
    navigate('/login');
  };

  return (
    <Modal show={showModal} backdrop="static" keyboard={false}>
      <Modal.Header>
        <Modal.Title>Session Invalid</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Your session is invalid or has expired. Please log in again to continue.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleLogin}>
          Go to Login
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SessionValidator;