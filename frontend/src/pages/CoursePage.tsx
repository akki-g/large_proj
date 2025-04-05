import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import NavBar from './NavBar'; // Import NavBar component
import './CoursePage.css';

const CoursePage: React.FC = () => {
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
          `https://api.scuba2havefun.xyz/api/classes/getClassWithChapters?classID=${classID}&jwtToken=${token}`
        );

        console.log('Class Contents:', response.data);
        setResult(JSON.stringify(response.data)); // Store as string to parse later
      } catch (error) {
        console.error('Error fetching class contents:', error);
      }
    };

    if (classID) {
      getClassContent();
    }
  }, [classID]);

  // Check if result is not empty before parsing
  let classContent = result ? JSON.parse(result) : {};
  let classNumber = classContent?.number || 'N/A';
  let className = classContent?.name || 'N/A';
  let chapters = classContent?.chapters || [];

  return(
        <div>
            <NavBar /> {/* Navbar will be displayed here */}
            <div className="main-contents">
            <button className="back-btn">Back</button>
                <div>
                    <div id="ch1 dropdown">
                        <h2>Chapter 1</h2>
                        <p>Summary</p>
                        <div className="quiz-button">
                            <form className="quiz">
                                <h3>Quiz:</h3>
                                
                                <hr />
                                <p>Question 1</p>
                                <input type="radio" name="q1" id="answer11" value="answer11"/>
                                <label htmlFor="answer11">answer1</label>
                                <input type="radio" name="q1" id="answer12" value="answer12"/>
                                <label htmlFor="answer12">answer2</label>
                                
                                <hr />
                                <p>Question 2</p>
                                <input type="radio" name="q2" id="answer21" value="answer21"/>
                                <label htmlFor="answer21">answer1</label>
                                <input type="radio" name="q2" id="answer22" value="answer22"/>
                                <label htmlFor="answer22">answer2</label>

                                <input type="submit" value="Submit"/>
                                {/* Quiz Contents */}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            {/* Add your chat page content */}
        </div>
    );
};

export default CoursePage;