import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Button } from 'react-bootstrap';
import NavBar from './NavBar';
import './CoursePage.css';

interface ChapterData {
  isCompleted: boolean;
  quizScore: number;
  completedAt: Date;
  attempts: number;
  _id: string;
  chapterName: string;
  className: string;
  classID: string;
  summary: string;
  userID: string;
  quiz: string[];
}

interface ClassData {
  _id: string;
  name: string;
  number: string;
  chapters: ChapterData[];
}

const CoursePage: React.FC = () => {
  const navigate = useNavigate();
  const { classID } = useParams<{ classID: string }>();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [expandedChapters, setExpandedChapters] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    const getClassContent = async () => {
      // Record the start time of the data fetching
      const startTime = new Date().getTime();
      
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('No authentication token found. Please login again.');
          navigate('/login');
          return;
        }

        const response = await axios.get(
          `https://api.scuba2havefun.xyz/api/classes/classWithChapters?classID=${classID}&jwtToken=${token}`
        );

        // Update token
        if (response.data.jwtToken) {
          localStorage.setItem('token', response.data.jwtToken);
        }

        if (response.data.class) {
          setClassData(response.data.class);
          
          // Set first chapter to expanded by default
          if (response.data.class.chapters && response.data.class.chapters.length > 0) {
            setExpandedChapters({ [response.data.class.chapters[0]._id]: true });
          }
        } else {
          setError('No class data found');
        }
        
        // Calculate how much time has passed
        const endTime = new Date().getTime();
        const timeElapsed = endTime - startTime;
        
        // If less than 500ms (0.5 seconds) has passed, add a delay
        if (timeElapsed < 500) {
          const remainingTime = 500 - timeElapsed;
          setTimeout(() => {
            setLoading(false);
          }, remainingTime);
        } else {
          setLoading(false);
        }
        
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load class content');
        console.error('Error fetching class content:', err);
        setLoading(false);
      }
    };

    if (classID) {
      getClassContent();
    }
  }, [classID, navigate]);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const handleQuizClick = (chapterID: string) => {
    navigate(`/course/${classID}/${chapterID}`);
  };

  const handleBackClick = () => {
    navigate('/main');
  };

  // Loading Screen Component
  const LoadingScreen = () => (
    <div className="course-page__loading-screen">
      <div className="course-page__loading-spinner"></div>
      <p>Loading course content...</p>
    </div>
  );

  // Error state with loading screen component
  if (error) {
    return (
      <div className="course-page-root">
        <NavBar />
        <div className="course-page-wrapper">
          <Container className="course-page-container">
            <div className="error-message">{error}</div>
            <div className="text-center mt-4">
              <Button variant="primary" onClick={handleBackClick}>
                Back to Dashboard
              </Button>
            </div>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div className="course-page-root">
      <NavBar />
      {loading ? (
        // Display loading screen while content is loading
        <LoadingScreen />
      ) : (
        <div className="course-page-wrapper">
          <Container fluid className="course-page-container">
            <Row className="course-header">
              <Col>
                {classData && (
                  <div className="class-info">
                    <h1>{classData.name}</h1>
                    <h4>Course Number: {classData.number}</h4>
                  </div>
                )}
                <Button 
                  variant="outline-secondary" 
                  className="back-button"
                  onClick={handleBackClick}
                >
                  ← Back to Dashboard
                </Button>
              </Col>
            </Row>

            <Row className="chapters-container">
              <Col>
                {classData && classData.chapters && classData.chapters.length > 0 ? (
                  <div className="custom-chapters">
                    {classData.chapters.map((chapter) => (
                      <div key={chapter._id} className="chapter-item">
                        <div 
                          className={`chapter-header ${expandedChapters[chapter._id] ? 'expanded' : ''}`}
                          onClick={() => toggleChapter(chapter._id)}
                        >
                          <div className="chapter-header-content">
                            <span className="chapter-title">{chapter.chapterName}</span>
                            {chapter.isCompleted && (
                              <span className="completed-badge">Completed</span>
                            )}
                            <span className="chapter-toggle-icon">
                              {expandedChapters[chapter._id] ? '−' : '+'}
                            </span>
                          </div>
                        </div>
                        
                        {expandedChapters[chapter._id] && (
                          <div 
                            className="chapter-content"
                            style={{
                              animationName: 'expandContent'
                            }}
                          >
                            <h3>Summary</h3>
                            <div className="chapter-summary">
                              {chapter.summary}
                            </div>
                            
                            {chapter.attempts > 0 && (
                              <div className="quiz-status">
                                <p>Previous Score: {chapter.quizScore}/10</p>
                                <p>Total Attempts: {chapter.attempts}</p>
                              </div>
                            )}
                            
                            <Button 
                              variant="primary" 
                              className="quiz-button"
                              onClick={() => handleQuizClick(chapter._id)}
                            >
                              {chapter.attempts > 0 ? "Retake Quiz" : "Take Quiz"}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-content">
                    <p>No chapters found for this course.</p>
                    <Button variant="primary" onClick={handleBackClick}>
                      Return to Dashboard
                    </Button>
                  </div>
                )}
              </Col>
            </Row>
          </Container>
        </div>
      )}
    </div>
  );
};

export default CoursePage;