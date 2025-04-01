import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Button, Card, Accordion } from 'react-bootstrap';
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

  useEffect(() => {
    const getClassContent = async () => {
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
        } else {
          setError('No class data found');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load class content');
        console.error('Error fetching class content:', err);
      } finally {
        setLoading(false);
      }
    };

    if (classID) {
      getClassContent();
    }
  }, [classID, navigate]);

  const handleQuizClick = (chapterID: string) => {
    navigate(`/course/${classID}/${chapterID}`);
  };

  const handleBackClick = () => {
    navigate('/main');
  };

  // Loading state
  if (loading) {
    return (
      <div>
        <NavBar />
        <div className="course-page-container">
          <div className="loading-spinner">Loading class content...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <NavBar />
        <div className="course-page-container">
          <div className="error-message">{error}</div>
          <Button variant="primary" onClick={handleBackClick}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-page-root">
      <NavBar />
      <div className="course-page-wrapper">
        <Container fluid className="course-page-container">
        <Row className="course-header">
          <Col>
            <Button 
              variant="outline-secondary" 
              className="back-button"
              onClick={handleBackClick}
            >
              ← Back to Dashboard
            </Button>
            {classData && (
              <div className="class-info">
                <h1>{classData.name}</h1>
                <h4>Course Number: {classData.number}</h4>
              </div>
            )}
          </Col>
        </Row>

        <Row className="chapters-container">
          <Col md={12} lg={10} className="mx-auto">
            {classData && classData.chapters && classData.chapters.length > 0 ? (
              <Accordion defaultActiveKey="0" className="chapters-accordion">
                {classData.chapters.map((chapter, index) => (
                  <Accordion.Item eventKey={index.toString()} key={chapter._id} className="chapter-item">
                    <Accordion.Header className="chapter-header">
                      <div className="d-flex w-100 justify-content-between align-items-center">
                        <span className="chapter-title">{chapter.chapterName}</span>
                        {chapter.isCompleted && (
                          <span className="completed-badge">Completed</span>
                        )}
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      <Card className="chapter-content">
                        <Card.Body>
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
                        </Card.Body>
                      </Card>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
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
    </div>
  );
};

export default CoursePage;