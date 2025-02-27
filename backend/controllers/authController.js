const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {v4: uuidv4} = require('uuid');


//register
exports.register = async (req, res) => {
    try {
        const {firstName, lastName, email, password, phone} = req.body;
        const userID = uuidv4();
        
        if (!firstName || !lastName || !email || !password || !phone) {
            return res.status(400).json({msg: "All fields are required"});
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({msg: "An account with this email already exists"});
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: passwordHash,
            phone,
            userID
        });

        const savedUser = await newUser.save();
        res.status(200).json({message : "User registered successfully"}, savedUser);
    }


    catch (err) {
        res.status(500).json({error: err.message});
    }

}



//login

exports.login = async (req, res) => {

    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({msg: "All fields are required"});
        }

        const user = await User.findOne({email});
        if (!user) {
            return res.status(400).json({msg: "No account with this email has been registered"});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({msg: "Invalid credentials"});
        }

        const payload = {
            user: {
                id: user.userID,
                email : user.email
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "1h"});
        res.status(200).json({message : "Login Successful", token});
    }

    catch (err) {
        res.status(500).json({error: err.message});
    }

}