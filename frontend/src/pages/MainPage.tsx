import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';  // Import NavBar component

const MainPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login'); // Redirect to login if no token is found
    }
  }, [navigate]);

  return (
    <div>
      <NavBar />  {/* Make sure this is included */}
      <h1>Main Page!</h1>
      {/* Add your main page content */}
    </div>
  );
};

export default MainPage;