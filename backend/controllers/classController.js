const axios = require('axios');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const Class = require('../models/Class');
const Chapter = require('../models/Chapter');
const tokenController = require('./tokenController');

// Create a new class/syllabus

// POST /api/classes

async function generateChapters(syllabusText) {
    try {
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

        const prompt = 
        `
            Based on the following syllabus text, generate a list of 5 to 10 chapter titles for a class study plan:
            ${syllabusText}
            Please return the chapter titles in JSON format as an array of strings.
        `;

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini', // Using the latest available model
            messages: [
                { 
                    role: 'system', 
                    content: 'You are a helpful assistant that generates educational content.'
                },
                { 
                    role: 'user', 
                    content: prompt 
                }
            ],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Extract and parse the response text into JSON
        const responseContent = response.data.choices[0].message.content.trim();
        let chapters;
        try {
            chapters = JSON.parse(responseContent);
        } catch (parseError) {
            const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                chapters = JSON.parse(jsonMatch[0]);
            } else {
                chapters = responseContent.split('/n')
                .map(line => line.replace(/^[0-9]+\.\s*|"|\[|\]/g, '').trim())
                .filter(line => line.length > 0);
            }
        }
        return chapters;
    } catch (error) {
        console.error('Error generating chapters:', error);
        throw new Error('Failed to generate chapters.');
    }
}

//Generate Chapter summaries

async function generateChapterSummaries(chapterNames, className) {
    try {
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

        const prompt = 
        `Based on the given chapter titles, and class names, generate a summary for each chapter.
        
        Chapter titles: ${chapterNames.join(', ')}
        Class name: ${className}

        Return the chapter summaries in JSON format as an array of strings, with each string corresponding to a chapter title.
        `;

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini',
            messages: [
                { 
                    role: 'system', 
                    content: 'You are a helpful assistant that generates educational content.'
                },
                { 
                    role: 'user', 
                    content: prompt 
                }
            ],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const responseContent = response.data.choices[0].message.content.trim();
        let summaries;

        try {
            summaries = JSON.parse(responseContent);
        }
        catch (parseError) {
            const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                summaries = JSON.parse(jsonMatch[0]);
            } else {
                summaries = chapterNames.map(name => 
                    `Summary for ${name}:
                    This chapter covers key concepts related to this topic.`
                );
            }
        }
        return summaries;
    }
    catch (error) {
        console.error('Error generating chapter summaries:', error);
        throw new Error('Failed to generate chapter summaries.');
    }
}

// create class
// create class
exports.createClass = async (req, res) => {
    try {
      const { name, number, jwtToken } = req.body;
      const syllabus = req.file;
  
        if (!name || !number || !syllabus) {
            return res.status(400).json({ msg: "All fields are required." });
        } 
        const userData = tokenController.getTokenData(jwtToken);
        const refreshedToken = tokenController.refreshToken(jwtToken);
        console.log("Token data:", userData);
        const userID = userData.user.id;

        if (!userID) {
            return res.status(401).json({ msg: "Invalid authentication token." });
        }

        let syllabusText;
        try {
            const pdfBuffer = fs.readFileSync(syllabus.path);
            pdfData = await pdfParse(pdfBuffer);
            syllabusText = pdfData.text;

            fs.unlinkSync(syllabus.path); // Delete the temporary file
        } catch (error) {
            console.error('Error parsing syllabus PDF:', error);
            return res.status(400).json({ msg: "Unable to parse syllabus PDF." });
        }

        const newClass = new Class({
            name,
            number,
            syllabus: syllabusText, // Assuming you've extracted text from PDF
            userID,
            chapters: [] // Start with empty array
        });

        const savedClass = await newClass.save();

        // Generate chapters based on the syllabus text
        const chapterTitles = await generateChapters(syllabusText);
        const chapterSummaries = await generateChapterSummaries(chapterTitles, name);

        // Create chapters
        const chapterIds = [];
        for (let i = 0; i < chapterTitles.length; i++) {
            const chapter = new Chapter({
                chapterName: chapterTitles[i],
                className: name,
                classID: savedClass._id.toString(), // Convert ObjectId to string if needed
                summary: chapterSummaries[i],
                userID: userID,
                quiz: [] // Initialize with empty quiz
            });
            
            const savedChapter = await chapter.save();
            chapterIds.push(savedChapter._id); // Store the chapter ID
        }
        
        
        savedClass.chapters = chapterIds;
        await savedClass.save();

        res.status(200).json({
            message: "Class and study plan created successfully.",
            jwtToken: refreshedToken,
            class: savedClass
        });
        } catch (err) {
        console.error("Error creating class:", err);
        res.status(500).json({ error: err.message });
        }
    };
        

// search and return set of classes, given keyword
exports.searchClass = async (req, res, next) => {
    try {
        const { classID, jwtToken } = req.body;

        // Validate input
        if (!classID) {
            return res.status(400).json({ msg: "Class ID is required." });
        }

        // Verify JWT and get user ID
        const refreshedToken = tokenController.refreshToken(jwtToken);
        const userData = tokenController.getTokenData(refreshedToken);
        const userID = userData.payload.user.id;
        
        if (!userID) {
            return res.status(401).json({ msg: "Invalid authentication token." });
        }


        const chapters = await Chapter.find({
            classID: classID,
            userID: userID
        }).sort({ _id: 1 }); 

        res.status(200).json({ 
            message: "Class search complete.",
            classes: classes,
            jwtToken: refreshedToken
        });
    }
    catch (err) {
        res.status(500).json({error: err.message});
    }
};

// modify class data
// pass in the mongodb ID as classID
exports.modifyClass = async (req, res, next) => {
    try {
        const {name, number, syllabus, classID, jwtToken} = req.body

        if (!name || !number || !syllabus || !classID) {
            return res.status(400).json({msg: "All fields are required."});
        }

        const targetClass = await Class.findOneAndUpdate(
            { "_id": classID, "userID": (tokenController.getTokenData(refreshedToken)).payload.id },
            {name, number, syllabus}
        );

        if (!targetClass) {
            return res.status(400).json({msg: "Class not found."});
        }

        res.status(200).json({ 
            message: "Class updated.",
            jwtToken: refreshedToken
        });
    }
    catch (err) {
        res.status(500).json({error: err.message});
    }
};

// delete class
// pass in the mongodb ID as classID
exports.deleteClass = async (req, res, newToken) => {
    try {
        const {classID, jwtToken} = req.body

        const deleted = await Class.findOneAndDelete({"_id": classID, "userID": (tokenController.getTokenData(refreshedToken)).payload.id});

        if (!deleted) {
            return res.status(400).json({msg: "Class not found."});
        }

        res.status(200).json({ 
            message: "Class deleted.",
            jwtToken: refreshedToken
        });
        
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};


//get all classes
exports.getAllClasses = async (req, res) => {
    try{
        const userID = req.body.userID;

        const classes = await Class.findOne({userID : userID});
        res.status(200).json({classes});
    }
    catch(err){
        res.status(500).json({error: err.message});
    }
};

exports.getClassWithChapters = async (req, res) => {
    try {
        const { classID, jwtToken } = req.body;
        
        // Verify JWT and get user ID
        const refreshedToken = tokenController.refreshToken(jwtToken);
        const userData = tokenController.getTokenData(refreshedToken);
        const userID = userData.payload.id;

        // Find the class and populate the chapters
        const classWithChapters = await Class.findOne({
            _id: classID,
            userID: userID
        }).populate('chapters'); // This fetches the full chapter documents
        
        if (!classWithChapters) {
            return res.status(404).json({ message: "Class not found" });
        }

        res.status(200).json({
            message: "Class retrieved successfully",
            jwtToken: refreshedToken,
            class: classWithChapters
        });
    } catch (err) {
        console.error("Error retrieving class:", err);
        res.status(500).json({ error: err.message });
    }
};
