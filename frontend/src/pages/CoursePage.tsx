import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from './NavBar'; // Import NavBar component
import './CoursePage.css';

interface ChapterData {
  isCompleted: boolean,
  quizScore: number,
  completedAt: Date,
  attempts: number,
  _id: string,
  chapterName: string,
  className: string,
  classID: string,
  summary: any,
  userID: any,
  quiz: never[]
}

const CoursePage: React.FC = () => {
  const navigate = useNavigate();
  const { classID } = useParams<{ classID: string }>(); // Get classID from URL
  const [result, setResult] = useState('');

  useEffect(() => {
    console.log(`Class ID passed: ${classID}`); // ✅ Log classID to console

    const getClassContent = async () => {
      try {
        let token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found!');
          return;
        }

        // Fetch data using the classID from URL
        const response = await axios.get(
          `https://api.scuba2havefun.xyz/api/classes/classWithChapters?classID=${classID}&jwtToken=${token}`
        );

        console.log('Class Contents:', response.data);
        localStorage.setItem('token', response.data.jwtToken);
        setResult(JSON.stringify(response.data)); // Store as string to parse later
      } catch (error) {
        console.error('Error fetching class contents:', error);
      }
    };

    if (classID) {
      getClassContent();
    }
  }, [classID]);

  const handleQuizClick = (chapterID: string) => {
    navigate(`/course/${classID}/${chapterID}`);
  };

  // Check if result is not empty before parsing
  let res = result ? JSON.parse(result) : {};
  let classString = JSON.stringify(res.class);
  let classContent = classString ? JSON.parse(classString) : {};
  let classNumber = classContent?.number || 'N/A';
  let className = classContent?.name || 'N/A';
  let chapters = classContent?.chapters || [];


  console.log(`class name: ${classContent.name}`);

  return(
        <div>
            <NavBar /> {/* Navbar will be displayed here */}
            <div className="main-contents">
            <button className="back-btn">Back</button>
            {chapters.length > 0 ? (
            chapters.map((chapter: ChapterData) => (
                <div key={chapter._id} className="chapter-dropdown">
                    <div className="chapter-container">
                        <h2>{chapter.chapterName}</h2>
                        <br/>
                        <h3>Summary</h3>
                        <br/>
                        <p>{chapter.summary}</p>
                        <button 
                          className="quiz-button" 
                          onClick={() => handleQuizClick(chapter._id)}>
                            Take Quiz</button>
                        <br/>
                    </div>
                    <br/>
                </div>
            ))
            ) : (
              <p>No content found. Check the console for details.</p>
            )}
            </div>
        </div>
    );
};

export default CoursePage;