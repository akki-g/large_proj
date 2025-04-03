import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [redirectToLogin, setRedirectToLogin] = useState<boolean>(false);

  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      setShowModal(true);
    }
  }, []);

  const handleLogin = () => {
    localStorage.removeItem('token'); // Clear any potential invalid token
    setShowModal(false);
    setRedirectToLogin(true);
  };

  if (redirectToLogin) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      {children}
      
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
    </>
  );
};

export default ProtectedRoute;