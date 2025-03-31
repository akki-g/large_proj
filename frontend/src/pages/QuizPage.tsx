import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate, Form } from 'react-router-dom';
import axios from 'axios';
import NavBar from './NavBar'; // Import NavBar component
import './QuizPage.css';

interface QuestionData {
    _id: string,
    question: string,
    option1: string,
    option2: string,
    option3: string,
    option4: string,
}

const QuizPage: React.FC = () => {
    const navigate = useNavigate();
    const { classID } = useParams<{ classID: string }>(); // Get classID from URL
    const { chapterID } = useParams<{ chapterID: string }>(); // Get chapterID from URL
    const [quizContent, setQuizContent] = useState<QuestionData[]>([]);

    useEffect(() => {
        console.log(`Class ID passed: ${classID}, Chapter ID passed: ${chapterID}`); // ✅ Log classID and chapterID to console

        const getQuizContent = async () => {
            try {
                let token = localStorage.getItem('token');
                if (!token) {
                    console.error('No token found!');
                    return;
                }

                console.log(`token: ${token}`);

                // Fetch data using the classID from URL
                const response = await axios.post('https://api.scuba2havefun.xyz/api/quiz/generate', {
                    chapterID: chapterID,
                    jwtToken: token
                });

                console.log('Class Contents:', response.data);
                let str = JSON.stringify(response.data); // Store as string to parse later
                let res = str ? JSON.parse(str) : {};
                let questionStr = JSON.stringify(res.questions);
                let questions = questionStr ? JSON.parse(questionStr) : {};
                setQuizContent(questions);
            } catch (error) {
                console.error('Error fetching class contents:', error);
            }
        };

        if (classID && chapterID) {
            getQuizContent();
        }
    }, [classID, chapterID]);

    const handleQuizSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log(Form);
    }

    return (
        <div>
            <NavBar />
            <div className="main-contents">
                <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
                <form className="quiz" onSubmit={() => handleQuizSubmit}>
                    <h3>Quiz:</h3>
                    {quizContent.map((question: QuestionData) => (
                        <div key={question._id}>
                            <p>{question.question}</p>
                            <hr />
                            <input
                                type="radio"
                                id={`${question._id}_option1`}
                                name={`quiz_${question._id}`}
                                value={question.option1}
                            />
                            <label htmlFor={`${question._id}_option1`}>{question.option1}</label>
                            <br />
                            <input
                                type="radio"
                                id={`${question._id}_option2`}
                                name={`quiz_${question._id}`}
                                value={question.option2}
                            />
                            <label htmlFor={`${question._id}_option2`}>{question.option2}</label>
                            <br />
                            <input
                                type="radio"
                                id={`${question._id}_option3`}
                                name={`quiz_${question._id}`}
                                value={question.option3}
                            />
                            <label htmlFor={`${question._id}_option3`}>{question.option3}</label>
                            <br />
                            <input
                                type="radio"
                                id={`${question._id}_option4`}
                                name={`quiz_${question._id}`}
                                value={question.option4}
                            />
                            <label htmlFor={`${question._id}_option4`}>{question.option4}</label>
                            <br/>
                            <br/>
                        </div>
                    ))}
                    <br />
                    <input type="submit" value="Submit"/>
                </form>
            </div>
        </div>
    );
};

export default QuizPage;