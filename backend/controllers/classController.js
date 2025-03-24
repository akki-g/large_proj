const openai = require('openai');
const openaiKey = process.env.OPENAI_KEY;
const openaiClient = new openai(openaiKey);

const express = require('express');
const router = express.Router();
const Class = require('../models/Class');

// Create a new class/syllabus

// POST /api/classes

router.post('/', async (req, res) => {
    try {
        const { name, number, syllabus, userID } = req.body;

        if (!name || !number || !userID) {
            throw new Error('Name, number, and userID are required');
        }

        const newClass = new Class({
            name,
            number,
            syllabus,
            userID,
        });
        
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});