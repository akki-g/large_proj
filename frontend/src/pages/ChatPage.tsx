import React from 'react';
import NavBar from './NavBar'; // Import NavBar component

const ChatPage: React.FC = () => {
  return (
    <div>
      <NavBar /> {/* Navbar will be displayed here */}
      <h1>Welcome to the Chat Page!</h1>
      {/* Add your chat page content */}
    </div>
  );
};

export default ChatPage;