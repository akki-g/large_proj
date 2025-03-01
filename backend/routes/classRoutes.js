// routes/classRoutes.js
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const Chapter = require('../models/Chapter');

const router = express.Router();

// Use memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST endpoint to generate a study plan
router.post('/studyplan', upload.single('syllabus'), async (req, res) => {
  try {
    // Ensure the file is uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Parse the PDF to extract text
    const pdfData = await pdfParse(req.file.buffer);
    const syllabusText = pdfData.text;

    // Build a prompt for your LLM – adjust as needed for your API and prompt engineering
    const prompt = `Based on the following syllabus text, generate a list of 5 to 10 chapter titles for a class study plan:\n\n${syllabusText}`;

    // Call the LLM API (for example, OpenAI's API)
    // Adjust the endpoint, parameters, and processing as needed.
    const llmResponse = await axios.post('https://api.openai.com/v1/completions', {
      model: 'text-davinci-003',
      prompt,
      max_tokens: 150,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Assume the response returns text with chapter titles separated by newlines
    const llmText = llmResponse.data.choices[0].text;
    const chapterTitles = llmText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Extract additional info from req.body (for example, className and userName)
    const { className, userName } = req.body;
    if (!className || !userName) {
      return res.status(400).json({ error: 'className and userName are required.' });
    }

    // Save each chapter to the database
    const savedChapters = await Promise.all(
      chapterTitles.map(async title => {
        const chapter = new Chapter({
          chapterName: title,
          className,
          userName
        });
        return await chapter.save();
      })
    );

    res.json({ message: 'Study plan created successfully.', chapters: savedChapters });
  } catch (error) {
    console.error('Error generating study plan:', error);
    res.status(500).json({ error: 'Failed to create study plan.' });
  }
});

// GET endpoint to fetch chapters for a class (for use in a drop-down)
router.get('/:className/chapters', async (req, res) => {
  try {
    const { className } = req.params;
    const chapters = await Chapter.find({ className });
    res.json(chapters);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({ error: 'Failed to fetch chapters.' });
  }
});

module.exports = router;
// In this example, the /studyplan endpoint uses multer to handle file uploads and pdf-parse to extract text from the uploaded syllabus PDF. It then constructs a prompt for the LLM API and sends a request to generate chapter titles based on the syllabus text. The generated chapter titles are saved to the database as Chapter documents.