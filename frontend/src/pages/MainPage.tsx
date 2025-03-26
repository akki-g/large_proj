import React, { useEffect } from 'react';
import axios from 'axios';

const MainPage = () => {
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get('https://api.scuba2havefun.xyz/api/classes/allClasses');
        console.log('Classes:', response.data); // Log the entire response to the console
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };

    fetchClasses(); // Fetch classes when the component mounts
  }, []); // Empty dependency array ensures it only runs once when the component mounts

  return <div>Check the console for the classes data!</div>;
};

export default MainPage;