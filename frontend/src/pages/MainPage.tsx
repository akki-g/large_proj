import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NavBar from '../pages/NavBar';  // Importing the NavBar component
import './MainPage.css';  // Import CSS styles

interface ClassData {
  _id: string;
  name: string;
  number: string;
  modules: number;
}

const MainPage: React.FC = () => {
  const navigate = useNavigate();

  const handleAddSyllabusClick = () => {
    navigate('/upload');
  };

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

  const handleDeleteClass = async (classID: string) => {
    try {
      const jwtToken = localStorage.getItem('token');
      if (!jwtToken) {
        console.error('No JWT token found. Please log in.');
        return;
      }

      const response = await axios.post(
        'https://api.scuba2havefun.xyz/api/classes/deleteClass',
        { classID, jwtToken }
      );

      if (response.status === 200) {
        setClasses(classes.filter((classItem) => classItem._id !== classID));
      }
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  return (
    <div>
      <NavBar />
      <div className="main-page__container">
        <h1 className="main-page__header">Welcome to your dashboard ! </h1>
        <div className="main-page__content-container">
          {classes.length > 0 ? (
            classes.map((classItem: ClassData) => (
              <div className="main-page__course-card" key={classItem._id}>
                <div className="main-page__course-info">
                  <h2 className="main-page__class">{classItem.name}</h2>
                  <p>Class Number: {classItem.number}</p>
                  <p>Modules: {classItem.modules}</p>
                </div>
                {/* Updated delete button with trash icon */}
                <button
                  onClick={() => handleDeleteClass(classItem._id)}
                  className="main-page__delete-btn"
                >
                  <img src="/trash.png" alt="Delete" className="main-page__delete-icon" />
                </button>
              </div>
            ))
          ) : (
            <p>No classes found. Check the console for details.</p>
          )}
        </div>
      </div>

      {/* Add Syllabus Button at the bottom-right */}
      <div className="main-page__add-syllabus-container">
        <button onClick={handleAddSyllabusClick} className="main-page__add-syllabi-btn">
          + Add Syllabus
        </button>
      </div>
    </div>
  );
};

export default MainPage;