import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Card, ProgressBar, Alert } from 'react-bootstrap';
import NavBar from './NavBar';
import './QuizPage.css';

interface QuestionData {
  _id: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
}

interface QuizResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  chapterCompleted: boolean;
  results: {
    questionId: string;
    question: string;
    yourAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { classID, chapterID } = useParams<{ classID: string; chapterID: string }>();
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [answers, setAnswers] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [chapterName, setChapterName] = useState<string>('');

  useEffect(() => {
    const fetchQuizQuestions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('No authentication token found. Please login again.');
          navigate('/login');
          return;
        }

        // Fetch quiz questions
        const response = await axios.post('https://api.scuba2havefun.xyz/api/quiz/generate', {
          chapterID: chapterID,
          jwtToken: token
        });

        if (response.data.jwtToken) {
          localStorage.setItem('token', response.data.jwtToken);
        }

        if (response.data.questions && response.data.questions.length > 0) {
          setQuestions(response.data.questions);
          
          // Try to get chapter name if available in the response
          if (response.data.chapterName) {
            setChapterName(response.data.chapterName);
          } else {
            // Set a default chapter name
            setChapterName('Chapter Quiz');
          }
        } else {
          setError('No quiz questions found for this chapter');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load quiz questions');
        console.error('Error fetching quiz questions:', err);
      } finally {
        setLoading(false);
      }
    };

    if (classID && chapterID) {
      fetchQuizQuestions();
    }
  }, [classID, chapterID, navigate]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleQuizSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation - check if all questions are answered
    if (Object.keys(answers).length < questions.length) {
      setError('Please answer all questions before submitting');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login again.');
        navigate('/login');
        return;
      }
      
      // Format answers for submission
      const formattedAnswers = Object.keys(answers).map(questionId => ({
        questionId,
        chosenOption: answers[questionId]
      }));
      
      // Submit quiz
      const response = await axios.post('https://api.scuba2havefun.xyz/api/quiz/submit', {
        chapterID: chapterID,
        answers: formattedAnswers,
        jwtToken: token
      });
      
      if (response.data.jwtToken) {
        localStorage.setItem('token', response.data.jwtToken);
      }
      
      // Set quiz results
      setQuizResult(response.data);
      window.scrollTo(0, 0); // Scroll to top to show results
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit quiz');
      console.error('Error submitting quiz:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackClick = () => {
    navigate(`/course/${classID}`);
  };

  const handleTryAgain = () => {
    // Reset the quiz
    setQuizResult(null);
    setAnswers({});
    window.location.reload(); // Reload to get fresh questions
  };

  // Loading state
  if (loading) {
    return (
      <div>
        <NavBar />
        <div className="quiz-page-container">
          <div className="loading-message">Loading quiz questions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page-wrapper">
      <NavBar />
      <Container className="quiz-page-container">
        <Row className="quiz-header">
          <Col>
            <Button 
              variant="outline-secondary" 
              className="back-button"
              onClick={handleBackClick}
            >
              ← Back to Course
            </Button>
            <h1>{chapterName || 'Chapter Quiz'}</h1>
          </Col>
        </Row>

        {error && (
          <Row>
            <Col>
              <Alert variant="danger">{error}</Alert>
            </Col>
          </Row>
        )}

        {quizResult ? (
          // Show quiz results
          <Row>
            <Col md={10} lg={8} className="mx-auto">
              <Card className="quiz-result-card">
                <Card.Body>
                  <h2 className="text-center mb-4">Quiz Results</h2>
                  
                  <div className="score-summary">
                    <h3 className={quizResult.passed ? 'text-success' : 'text-danger'}>
                      Score: {quizResult.score}/10
                    </h3>
                    <p>You answered {quizResult.correctCount} out of {quizResult.totalQuestions} questions correctly.</p>
                    
                    <ProgressBar 
                      now={quizResult.score * 10} 
                      variant={quizResult.passed ? "success" : "danger"}
                      className="score-progress"
                    />
                    
                    <div className="result-message mt-3">
                      {quizResult.passed ? (
                        <Alert variant="success">
                          <strong>Congratulations!</strong> You passed the quiz.
                          {quizResult.chapterCompleted && " This chapter is now marked as completed."}
                        </Alert>
                      ) : (
                        <Alert variant="warning">
                          <strong>Almost there!</strong> You need a score of 8 or higher to pass.
                        </Alert>
                      )}
                    </div>
                  </div>
                  
                  <div className="result-actions mt-4">
                    <Button 
                      variant="primary" 
                      onClick={handleBackClick}
                      className="me-3"
                    >
                      Return to Course
                    </Button>
                    
                    {!quizResult.passed && (
                      <Button 
                        variant="outline-primary" 
                        onClick={handleTryAgain}
                      >
                        Try Again
                      </Button>
                    )}
                  </div>
                  
                  <h4 className="detailed-results-header mt-5">Detailed Results</h4>
                  {quizResult.results.map((result, index) => (
                    <Card 
                      key={result.questionId} 
                      className={`question-result ${result.isCorrect ? 'correct' : 'incorrect'}`}
                      border={result.isCorrect ? "success" : "danger"}
                    >
                      <Card.Body>
                        <Card.Title>Question {index + 1}</Card.Title>
                        <Card.Text>{result.question}</Card.Text>
                        <div className="answers-review">
                          <p>Your answer: <span className={result.isCorrect ? 'text-success' : 'text-danger'}>{result.yourAnswer}</span></p>
                          {!result.isCorrect && <p>Correct answer: <span className="text-success">{result.correctAnswer}</span></p>}
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : (
          // Show quiz form
          <Row>
            <Col md={10} lg={8} className="mx-auto">
              <Card className="quiz-form-card">
                <Card.Body>
                  <h2 className="quiz-instructions">
                    Instructions: Select the correct answer for each question
                  </h2>
                  
                  <Form onSubmit={handleQuizSubmit}>
                    {questions.map((question, qIndex) => (
                      <div key={question._id} className="question-container">
                        <h3 className="question-text">
                          <span className="question-number">{qIndex + 1}.</span> {question.question}
                        </h3>
                        
                        <div className="options-container">
                          {[
                            { key: 'option1', value: question.option1 },
                            { key: 'option2', value: question.option2 },
                            { key: 'option3', value: question.option3 },
                            { key: 'option4', value: question.option4 }
                          ].map((option) => (
                            <Form.Check
                              key={`${question._id}_${option.key}`}
                              type="radio"
                              id={`${question._id}_${option.key}`}
                              name={`quiz_${question._id}`}
                              label={option.value}
                              value={option.value}
                              onChange={() => handleAnswerChange(question._id, option.value)}
                              checked={answers[question._id] === option.value}
                              className="quiz-option"
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    <div className="quiz-actions mt-4">
                      <Button 
                        variant="secondary" 
                        onClick={handleBackClick}
                        className="me-3"
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="primary" 
                        type="submit"
                        disabled={submitting || Object.keys(answers).length < questions.length}
                      >
                        {submitting ? 'Submitting...' : 'Submit Quiz'}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

export default QuizPage;