import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NavBar from '../pages/NavBar'; // Import NavBar component
import './MainPage.css'; // Import CSS styles

const rocket = "/rocket.png"; // Path to rocket image

// Updated ClassData interface to include progress data
interface ClassData {
  _id: string;
  name: string;
  number: string;
  modules: number;
  progress: {
    completedChapters: number;
    totalChapters: number;
    progressPercentage: number;
  };
}

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      const jwtToken = localStorage.getItem('token');
      if (!jwtToken) {
        console.error('No JWT token found. Please log in.');
        return;
      }

      try {
        if (searchKeyword.trim() === '') {
          // Fetch all classes if no search keyword is provided
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
        } else {
          // Use the search endpoint when a keyword is provided
          const response = await axios.post(
            `https://api.scuba2havefun.xyz/api/classes/search`,
            {
              keyword: searchKeyword,
              jwtToken: jwtToken,
            }
          );
          if (response.data.classes) {
            setClasses(response.data.classes);
          } else {
            console.error('No classes found:', response.data);
          }
          if (response.data.jwtToken) {
            localStorage.setItem('token', response.data.jwtToken);
          }
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };

    // Debounce the search by 300ms to reduce rapid calls to the API
    const delayDebounceFn = setTimeout(() => {
      fetchClasses();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchKeyword]);

  const handleClassClick = (classID: string) => {
    navigate(`/course/${classID}`);
  };

  const handleSyllabusClick = () => {
    navigate('/upload');
  };

  return (
    <div>
      <NavBar />
      <div className="main-page__container">
        <div className="main-page__header-container">
          <h1 className="main-page__header">Welcome to your dashboard!</h1>
          <button
            className="main-page__add-syllabi-btn"
            onClick={handleSyllabusClick}
          >
            + Add Syllabus
          </button>
        </div>
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search classes..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="main-page__search-input"
        />
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
                </div>
                {/* Progress Bar */}
                <div className="main-page__progress-container">
                  <div className="progress" style={{ width: '100%', backgroundColor: 'black' }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{
                        width: `${(classItem.progress.completedChapters / classItem.progress.totalChapters) * 100}%`,
                        backgroundColor: '#b24d16',
                      }}
                      aria-valuenow={classItem.progress.completedChapters}
                      aria-valuemin={0}
                      aria-valuemax={classItem.progress.totalChapters}
                    ></div>
                    <img
                      className="rocket-icon"
                      src={rocket}
                      alt="Rocket"
                      style={{
                        left: `${(classItem.progress.completedChapters / classItem.progress.totalChapters) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="main-page__progress-text">
                    {classItem.progress.completedChapters} / {classItem.progress.totalChapters}
                  </span>
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
