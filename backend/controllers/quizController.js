const axios = require('axios');
const Quiz = require('../models/Question');
const Chapter = require('../models/Chapter');
const Class = require('../models/Class');
const tokenController = require('./tokenController');


// Function to generate quiz questions
async function generateQuizQuestionsFromAI(chapterName, chapterSummary, className, numQuestions = 10) {
    try {
        const OPENAI_KEY = process.env.OPENAI_API_KEY;

        const prompt = 
        `
        Generate ${numQuestions} multiple-choice quiz questions about "${chapterName}" for the class "${className}".
            Use this chapter summary as context: "${chapterSummary}"
            
            For each question:
            1. Create a clear, concise question
            2. Provide exactly 4 possible answers (labeled as option1, option2, option3, option4)
            3. Indicate which option is correct (as the exact full text of the option, not just the number)
            4. Make sure questions are educational and test understanding of the material
            
            Return the questions in RAW JSON format as an array of objects, where each object has the following structure:
            {
                "question": "The question text",
                "options": ["option1", "option2", "option3", "option4"],
                "correctOption": "The exact text of the correct option"
            }

            IMPORTANT: Return ONLY the JSON array with no markdown formatting, code blocks, backticks, or explanations.
        `

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o',
            messages: [
                { 
                    role: 'system', 
                    content: 'You are a helpful assistant that generates educational quiz questions.'
                },
                { 
                    role: 'user', 
                    content: prompt 
                }
            ],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const responseContent = response.data.choices[0].message.content;

        let questions;

        try {
            questions = JSON.parse(responseContent);
        } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                questions = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Failed to parse quiz questions from AI response');
            }
        }

        return questions;

    } catch (error) {
        console.error('Error generating quiz:', error);
        throw new Error('Failed to generate quiz');
    }
}


// Get quiz questions
exports.generateQuiz = async (req, res) => {

    try {
        const { chapterID, jwtToken } = req.body;

        if (!chapterID || !jwtToken) {
            return res.status(400).json({ error: 'Chapter ID and Class ID are required' });
        }

        const userData = tokenController.getTokenData(jwtToken);
        const userID = userData.user.id;
        const refreshedToken = tokenController.refreshToken(jwtToken);

        if (!userID) {
            return res.status(401).json({ msg: "Invalid authentication token" });
        }

        const chapter = await Chapter.findById({ _id: chapterID, userID });
        if (!chapter) {
            return res.status(404).json({ error: 'Chapter not found' });
        }
        const classData = await Class.findOne({ _id: chapter.classID, userID });
        if (!classData) {
            return res.status(404).json({ msg: "Class not found" });
        }

        await Quiz.deleteMany({ chapterID });
        const quizQuestions = await generateQuizQuestionsFromAI(
            chapter.chapterName, 
            chapter.summary, 
            classData.name,
            10 
        );

        const savedQuestions = [];
        for (const q of quizQuestions) {
            const newQuestion = new Quiz({
                question: q.question,
                option1: q.options[0],
                option2: q.options[1],
                option3: q.options[2],
                option4: q.options[3],
                correctOption: q.correctOption,
                chapterID: chapterID,
                classID: chapter.classID,
                userResponses: []
            });

            const savedQuestion = await newQuestion.save();
            savedQuestions.push(savedQuestion);
        }

        chapter.quiz = savedQuestions.map(q => q._id);
        await chapter.save();

        const safeQuestions = savedQuestions.map(q => ({
            _id: q._id,
            question: q.question,
            option1: q.option1,
            option2: q.option2,
            option3: q.option3,
            option4: q.option4
        }));

        res.status(200).json({
            message: "Quiz generated successfully",
            questions: safeQuestions,
            jwtToken: refreshedToken
        });

    } catch (error) {
        console.error('Error generating quiz:', error);
        res.status(500).json({ error: 'Failed to generate quiz' });
    }

}

// Sumbit quiz answers

exports.submitQuiz = async (req, res) => {
    try {
        const { chapterID, answers, jwtToken } = req.body;

        const userData = tokenController.getTokenData(jwtToken);
        const userID = userData.user.id;
        const refreshedToken = tokenController.refreshToken(jwtToken);
        
        if (!userID) {
            return res.status(401).json({ msg: "Invalid authentication token" });
        }
        
        if (!Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ msg: "Invalid quiz answers format" });
        }

        const chapter = await Chapter.findOne({ _id: chapterID, userID });
        if (!chapter) {
            return res.status(404).json({ msg: "Chapter not found" });
        }

        const quizQuestions = await Quiz.find({ 
            _id: { $in: answers.map(a => a.questionId) },
            chapterID 
        });
        
        if (quizQuestions.length === 0) {
            return res.status(404).json({ msg: "No quiz questions found for this chapter" });
        }

        let correctCount = 0;
        const questionResults = [];
        
        for (const answer of answers) {
            const question = quizQuestions.find(q => q._id.toString() === answer.questionId);
            if (!question) continue;
            
            const isCorrect = question.correctOption === answer.chosenOption;
            if (isCorrect) correctCount++;
            
            const existingResponseIndex = question.userResponses.findIndex(
                r => r.userID === userID
            );
            
            if (existingResponseIndex >= 0) {
                question.userResponses[existingResponseIndex] = {
                    userID,
                    chosenOption: answer.chosenOption,
                    correct: isCorrect,
                    attemptedAt: new Date()
                };
            } else {
                question.userResponses.push({
                    userID,
                    chosenOption: answer.chosenOption,
                    correct: isCorrect,
                    attemptedAt: new Date()
                });
            }
            
            await question.save();

            questionResults.push({
                questionId: question._id,
                question: question.question,
                yourAnswer: answer.chosenOption,
                correctAnswer: question.correctOption,
                isCorrect
            });
        }

        const score = Math.round((correctCount / quizQuestions.length) * 10);

        const passed = score >= 8;
    
        chapter.attempts += 1;
        chapter.quizScore = score;
        
        if (passed && !chapter.isCompleted) {
            chapter.isCompleted = true;
            chapter.completedAt = new Date();
        }
        
        await chapter.save();
        
        res.status(200).json({
            score,
            correctCount,
            totalQuestions: quizQuestions.length,
            passed,
            chapterCompleted: chapter.isCompleted,
            results: questionResults,
            jwtToken: refreshedToken
        });
    } catch (err) {
        console.error('Error submitting quiz:', err);
        res.status(500).json({ error: err.message });
    }
};