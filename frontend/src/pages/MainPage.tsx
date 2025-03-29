import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NavBar from '../pages/NavBar'; // Import NavBar component
import './MainPage.css'; // Import CSS styles

interface ClassData {
  _id: string;
  name: string;
  number: string;
  modules: number;
}

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassData[]>([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const jwtToken = localStorage.getItem('token');
        if (!jwtToken) {
          console.error('No JWT token found. Please log in.');
          return;
        }

        const response = await axios.get(
          `https://api.scuba2havefun.xyz/api/classes/allClasses?token=${jwtToken}`
        );

        if (response.data.classes) {
          setClasses(response.data.classes);
        } else {
          console.error('No classes found:', response.data);
        }

        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };

    fetchClasses();
  }, []);

  const handleClassClick = (classID: string) => {
    navigate(`/course/${classID}`);
  };

  return (
    <div>
      <NavBar />
      <div className="main-page__container">
        <h1 className="main-page__header">Welcome to your dashboard!</h1>
        <div className="main-page__content-container">
          {classes.length > 0 ? (
            classes.map((classItem: ClassData) => (
              <div
                key={classItem._id}
                className="main-page__course-card"
                onClick={() => handleClassClick(classItem._id)}
              >
                <div className="main-page__course-info">
                  <h2 className="main-page__class">{classItem.name}</h2>
                  <p>Class Number: {classItem.number}</p>
                  <p>Modules: {classItem.modules}</p>
                </div>
              </div>
            ))
          ) : (
            <p>No classes found. Check the console for details.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainPage;