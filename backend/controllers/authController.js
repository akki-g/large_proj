const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {v4: uuidv4} = require('uuid');
const crypto = require('crypto');
const nodemailer = require('nodemailer');


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

        const token = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = Date.now() + 3600000;

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: passwordHash,
            phone,
            userID,
            isVerified: false,
            verificationToken: token,
            verificationTokenExpires: verificationTokenExpires
        });

        const savedUser = await newUser.save();

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD 
            }
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Syllab.Ai Account Verification Link',
            text: `Hello ${savedUser.firstName} ${savedUser.lastName}, 

            Please click on the link below to verify your account: 
            https://www.scuba2havefun.xyz/verify-email?token=${token}
            
            The link will expire in one hour.
            Thank you,
            Syllab.Ai Team`
        };
    
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Email sending error:", error);
                return res.status(500).json({ msg: "Failed to send verification email." });
            }
            res.status(200).json({
                msg: "User registered successfully. A verification email has been sent to " + savedUser.email,
                user: savedUser
            });
        });
    }
    catch (err) {
        res.status(500).json({error: err.message});
    }

}



exports.verifyEmail = async (req, res) => {
    try {
        const {token} = req.query;

        if (!token) {
            return res.status(400).json({msg: "Invalid verification link"});
        }

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).json({msg: "Verification token is invalid or has expired."});
        }
        if (user.isVerified) {
            return res.status(200).json({ msg: "Your email is already verified." });
        }
        if (user.verificationTokenExpires < Date.now()) {
            return res.status(400).json({ msg: "Verification token is invalid or has expired." });
        }
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        res.status(200).json({msg: "Account has been verified. Please login."});
    }
    catch (err) {
        res.status(500).json({error: err.message});
    }
};


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

        if (!user.isVerified) {
            return res.status(400).json({ msg: "Email has not been verified. Please check your email for verification link." });
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
        res.status(200).json({
            message: "Login Successful",
            token: token
        });
        
    }

    catch (err) {
        res.status(500).json({error: err.message});
    }

}
