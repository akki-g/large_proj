const openai = require('openai');
const openaiKey = process.env.OPENAI_KEY;
const openaiClient = new openai(openaiKey);
const pdfParse = require('pdf-parse');

// Since no actual AI integration has taken place (and none should until we get all the basic stuff working),
// I commented out the AI-centered imports. Uncomment them when you're ready.

const express = require('express');
const router = express.Router();
const tokenController = require('./tokenController')
const Class = require('../models/Class');
const Chapter = require('../models/Chapter');

// Create a new class/syllabus

// POST /api/classes

async function generateChapters(syllabusText) {
    try {
        const prompt = 
        `
            Based on the following syllabus text, generate a list of 5 to 10 chapter titles for a class study plan:
            ${syllabusText}
            Please return the chapter titles in JSON format as an array of strings.
        `;

        const response = await axios.post('https://api.openai.com/v1/completions', {
            model: 'gpt-4-mini', // Ensure the correct model is used
            prompt,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Extract and parse the response text into JSON
        const chapters = JSON.parse(response.data.choices[0].text.trim());
        return chapters;
    } catch (error) {
        console.error('Error generating chapters:', error);
        throw new Error('Failed to generate chapters.');
    }
}

//Generate Chapter summaries

async function generateChapterSummaries(chapterNames, className) {
    try {
        const prompt = 
        `Based on the given chapter titles, and class names, generate a summary for each chapter.
        
        Chapter titles: ${chapterNames.join(', ')}
        Class name: ${className}

        Return the chapter summaries in JSON format as an array of strings, with each string corresponding to a chapter title.
        `;

        const response = await axios.post('https://api.openai.com/v1/completions', {
            model: 'gpt-4-mini', 
            prompt, 
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const summaries = JSON.parse(response.data.choices[0].text.trim());
        return summaries;

    }

    catch (error) {
        console.error('Error generating chapter summaries:', error);
        throw new Error('Failed to generate chapter summaries.');
    }
}

// create class
exports.createClass = async (req, res) => {
    try {
      const { name, number, syllabus, jwtToken } = req.body;
  
        if (!name || !number || !syllabus) {
            return res.status(400).json({ msg: "All fields are required." });
        }
  
        if (tokenController.isTokenInvalid(jwtToken)) {
            return res.status(400).json({ error: 'The JWT is no longer valid.' });
        }
  
        const refreshedToken = tokenController.tokenRefresh(jwtToken);
        const userID = tokenController.getTokenData(refreshedToken).payload.id;
  
        // Parse the syllabus PDF text
        const pdfData = await pdfParse(syllabus); // Assuming syllabus is PDF file in base64 or binary format
        const syllabusText = pdfData.text;
  
        // Generate chapters based on the syllabus text
        const chapterTitles = await generateChapters(syllabusText);
        const chapterSummaries = await generateChapterSummaries(chapterTitles, name);

        // Create chapters
        const chapters = chapterTitles.map((title, index) => new Chapter({
            chapterName: title,
            className: name,
            classID: number,
            summary: chapterSummaries[index]
        }));
        
        
        
        // Create new class
        const newClass = new Class({
            name,
            number,
            syllabus,
            userID,
            chapters: [chapters]
        });
    
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
        var {search, jwtToken} = req.body;

        if (!search) {
            search = "";
        }

        if (tokenController.isTokenInvalid(jwtToken)) {
            var r = {error:'The JWT is no longer valid.', jwtToken: ''};
            return res.status(400).json(r);
        }

        var refreshedToken = null;

        try {
            refreshedToken = tokenController.tokenRefresh(jwtToken);
        }
        catch(err) {
            console.log(err.message);
            return res.status(200).json({error:err.message, jwtToken: ''});
        }

        const classes = await Class.find({"name": {$regex: new RegExp(search.trim(), "ig")}, "userID": (tokenController.getTokenData(refreshedToken)).payload.id});

        res.status(200).json({ 
            message: "Class search complete.",
            classes: classes,
            jwtToken: refreshedToken
        });
    }
    catch (err) {
        res.status(500).json({error: err.message});
    }
}

// modify class data
// pass in the mongodb ID as classID
exports.modifyClass = async (req, res, next) => {
    try {
        const {name, number, syllabus, classID, jwtToken} = req.body

        if (!name || !number || !syllabus || !classID) {
            return res.status(400).json({msg: "All fields are required."});
        }

        if (tokenController.isTokenInvalid(jwtToken)) {
            var r = {error:'The JWT is no longer valid.', jwtToken: ''};
            return res.status(400).json(r);
        }

        var refreshedToken = null;

        try {
            refreshedToken = tokenController.tokenRefresh(jwtToken);
        }
        catch(err) {
            console.log(err.message);
            return res.status(200).json({error:err.message, jwtToken: ''});
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
}

// delete class
// pass in the mongodb ID as classID
exports.deleteClass = async (req, res, newToken) => {
    try {
        const {classID, jwtToken} = req.body

        if (tokenController.isTokenInvalid(jwtToken)) {
            var r = {error:'The JWT is no longer valid.', jwtToken: ''};
            return res.status(400).json(r);
        }

        var refreshedToken = null;

        try {
            refreshedToken = tokenController.tokenRefresh(jwtToken);
        }
        catch(err) {
            console.log(err.message);
            return res.status(200).json({error:err.message, jwtToken: ''});
        }

        const deleted = await Class.findOneAndDelete({"_id": classID, "userID": (tokenController.getTokenData(refreshedToken)).payload.id});

        if (!deleted) {
            return res.status(400).json({msg: "Class not found."});
        }

        res.status(200).json({ 
            message: "Class deleted.",
            jwtToken: refreshedToken
        });
    }
    catch (err) {
        res.status(500).json({error: err.message});
    }
}