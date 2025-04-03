const axios = require('axios');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const Class = require('../models/Class');
const Chapter = require('../models/Chapter');
const tokenController = require('./tokenController');

// Create a new class/syllabus

// POST /api/classes
//helper function to extract keywords from syllabus

async function extractKeywords(syllabusText) {
    try{
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        const prompt = 
        `
            Based on the following syllabus text, identify and extract the most important key concepts, terms, and phrases that are essential for understanding the course material and structure:
            ${syllabusText}
            Keep the course name and number in mind while analyzing the syllabus. 
            Focus on recognizing topics, themes, and learning objectives that are repeated, emphasized, or organized into units or chapters.
            For each key concept or keyword you extract, also provide a brief contextual explanation or a short phrase that describes its relevance to the course 
            (e.g., what it relates to, what unit it belongs to, or what students will learn from it).
            These keyphrases and context snippets will be used to generate future chapter titles and summaries, so ensure they are specific, informative, and relevant to the course structure and academic goals.
            If the syllabus is too long, summarize it first, then extract keywords and keyphrases from that summary.
            Ignore any binary data, tables, or images.
            Output Format Example:

            Keyword: Photosynthesis
            Context: Core biological process covered in Unit 2, focusing on light-dependent and light-independent reactions.

            Keyword: Supply and Demand
            Context: Central economic model introduced in Chapter 1 to explain market behavior.
        `;

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o', // Using the latest available model
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
        console.log('Extracted keywords:', responseContent);
        return responseContent

    } catch (error) {
        console.error('Error extracting keywords:', error);
        throw new Error('Failed to extract keywords.');
    }
}
async function generateChapters(keywords, className) {
    try {
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        const prompt = 
        `
            Based on the following keywords extracted from the syllabus, generate a list of at most 10 chapters for a course.
            ${keywords}
            For the course: ${className}
            The chapter titles should be relevant to the course content and can include terms, phrases, or concepts that are important for students to know.
            The chapter titles should be concise and informative, reflecting the main topics covered in the course.
            Please return the chapter titles in RAW JSON format as an array of strings.
            Return only the JSON array, without any additional text or explanation.

        `;

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o', // Using the latest available model
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

async function generateChapterSummaries(chapterNames, keywords, className) {
    try {
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

        const prompt = 
        `Based on the given chapter titles, and class names, generate a summary for each chapter.
        
        Chapter titles: ${chapterNames.join(', ')}
        Class name: ${className}
        Keywords/Context: ${keywords}

        Each summary should provide a brief overview of the main topics, concepts, and objectives covered in that chapter.
        The summaries should be informative and relevant to the chapter titles, helping students understand what they can expect to learn in each chapter.
        The summaries should be written in a clear and concise manner, using appropriate academic language.
        The summaries should be suitable for a syllabus or course outline, and should not include any extraneous information or personal opinions.
        The summaries should be structured in a way that allows students to quickly grasp the key points and themes of each chapter.
        The summaries should be written in a way that is accessible to students at the undergraduate level, and should avoid overly technical jargon or complex language.
        Make sure that each chapter summary is concise and relevant to the chapter title and at least 2 paragraphs long.

        Return the chapter summaries in JSON format as an array of strings, with each string corresponding to a chapter title.
        `;

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o',
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
      console.log("createClass API called");
      const { name, number, jwtToken } = req.body;
      console.log("Request body:", req.body);
      const syllabus = req.file;
  
        if (!name || !number || !syllabus) {
            return res.status(400).json({ msg: "All fields are required." });
        } 
        console.log("API token:", jwtToken);
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
        const keywords = await extractKeywords(syllabusText);
        const chapterTitles = await generateChapters(keywords, name);
        const chapterSummaries = await generateChapterSummaries(chapterTitles, keywords, name);

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
exports.searchClasses = async (req, res, next) => {
    try{
        console.log("searchClasses API called");
        const { keyword, jwtToken } = req.body;

        const userData = tokenController.getTokenData(jwtToken);
        const userID = userData.user.id;
        const refreshedToken = tokenController.refreshToken(jwtToken);

        const classes = await Class.find({
            userID: userID,
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { number: { $regex: keyword, $options: 'i' } }
            ]
        });

        const classesWithProgress = await Promise.all(classes.map(async (cls) => {
            const chapters = await Chapter.find({
                classID: cls._id.toString(),
                userID: userID
            });
            
            const totalChapters = chapters.length;
            const completedChapters = chapters.filter(ch => ch.isCompleted).length;
            const progressPercentage = totalChapters > 0 
                ? Math.round((completedChapters / totalChapters) * 100) 
                : 0;
                
            // Return the class with progress information
            return {
                _id: cls._id,
                name: cls.name,
                number: cls.number,
                syllabus: cls.syllabus,
                userID: cls.userID,
                chapters: cls.chapters,
                progress: {
                    completedChapters,
                    totalChapters,
                    progressPercentage
                }
            };
        }));

        res.status(200).json({classes: classesWithProgress, token: refreshedToken});
    }
    catch(err){
        res.status(500).json({error: err.message});
    }
};

// modify class data
// pass in the mongodb ID as classID
exports.modifyClass = async (req, res, next) => {
    try {
        console.log("modifyClass API called");
        const {name, number, syllabus, classID, jwtToken} = req.body

        if (!name || !number || !syllabus || !classID) {
            return res.status(400).json({msg: "All fields are required."});
        }

        const targetClass = await Class.findOneAndUpdate(
            { "_id": classID, "userID": (tokenController.getTokenData(refreshedToken)).user.id },
            {name, number, syllabus}
        );

        if (!targetClass) {
            return res.status(400).json({msg: "Class not found."});
        }
        const refreshedToken = tokenController.refreshToken(jwtToken);

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
        console.log("deleteClass API called");
        const {classID, jwtToken} = req.body;

        const refreshedToken = tokenController.refreshToken(jwtToken); // Fixed: Define before using
        const userData = tokenController.getTokenData(refreshedToken);

       const deleted = await Class.findOneAndDelete({ 
            "_id": classID, 
            "userID": userData.user.id 
        });
        
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
        console.log("getAllClasses API called");
        const token = req.query.token;
        const userData = tokenController.getTokenData(token);
        const userID = userData.user.id;
        const refreshedToken = tokenController.refreshToken(token);

        const classes = await Class.find({userID : userID}); // Changed findOne to find

        const classesWithProgress = await Promise.all(classes.map(async (cls) => {
            const chapters = await Chapter.find({
                classID: cls._id.toString(),
                userID: userID
            });
            
            const totalChapters = chapters.length;
            const completedChapters = chapters.filter(ch => ch.isCompleted).length;
            const progressPercentage = totalChapters > 0 
                ? Math.round((completedChapters / totalChapters) * 100) 
                : 0;
                
            // Return the class with progress information
            return {
                _id: cls._id,
                name: cls.name,
                number: cls.number,
                syllabus: cls.syllabus,
                userID: cls.userID,
                chapters: cls.chapters,
                progress: {
                    completedChapters,
                    totalChapters,
                    progressPercentage
                }
            };
        }));

        res.status(200).json({classes: classesWithProgress, token: refreshedToken});
    }
    catch(err){
        res.status(500).json({error: err.message});
    }
};

exports.getClassWithChapters = async (req, res) => {
    try {
        console.log("getClassWithChapters API called");
        const { classID, jwtToken } = req.query;
        
        // Verify JWT and get user ID
        const userData = tokenController.getTokenData(jwtToken);
        const userID = userData.user.id;
        const refreshedToken = tokenController.refreshToken(jwtToken);

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
