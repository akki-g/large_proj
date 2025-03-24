/*const openai = require('openai');
const openaiKey = process.env.OPENAI_KEY;
const openaiClient = new openai(openaiKey);*/

// Since no actual AI integration has taken place (and none should until we get all the basic stuff working),
// I commented out the AI-centered imports. Uncomment them when you're ready.

const express = require('express');
const router = express.Router();
const tokenController = require('./tokenController')
const Class = require('../models/Class');

// Create a new class/syllabus

// POST /api/classes

// create class
exports.createClass = async (req, res, next) => {
    try {
        const {name, number, syllabus, jwtToken} = req.body;

        if (!name || !number || !syllabus) {
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
        
        const newClass = new Class({
            name,
            number,
            syllabus,
            userID: (tokenController.getTokenData(refreshedToken)).payload.id
        });

        const savedClass = await newClass.save();

        res.status(200).json({ 
            message: "Class added successfully.",
            jwtToken: refreshedToken,
        });
    }
    catch (err) {
        res.status(500).json({error: err.message});
    }
}

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