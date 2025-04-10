const User = require('../models/Users');
const Class = require('../models/Class');
const Chapter = require('../models/Chapter');
const Quiz = require('../models/Question');
const Chat = require('../models/Chat');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {v4: uuidv4} = require('uuid');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const tokenController = require('./tokenController');


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


exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({msg: "Email is required"});
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({msg: "No account with this email has been registered"});
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = Date.now() + 3600000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;
        await user.save();

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
            subject: 'Syllab.Ai Password Reset Link',
            text: `
            Hello ${user.firstName} ${user.lastName}, 

                Please click on the link below to reset your password: 
                https://www.scuba2havefun.xyz/reset-password?token=${resetToken}
            
            The link will expire in one hour.
            Thank you,
            Syllab.Ai Team`
        };
    
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Email sending error:", error);
                return res.status(500).json({ msg: "Failed to send password reset email." });
            }
            res.status(200).json({
                msg: "Password reset email has been sent to " + user.email
            });
        });
    }
    catch (err) {
        res.status(500).json({error: err.message});
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.query;
        const { newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({msg: "Invalid reset link or missing new password"});
        }

        const user = await User.findOne({ 
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({msg: "Password reset token is invalid or has expired."});
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        user.password = passwordHash;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({msg: "Password has been reset successfully. Please login with your new password."});
    }
    catch (err) {
        res.status(500).json({error: err.message});
    }
};

exports.retrieveData = async (req, res) => {
    try{
        const { jwtToken } = req.body;

        const userData = tokenController.getTokenData(jwtToken);
        const userID = userData.user.id;

        if (!userID) {
            return res.status(400).json({ msg: "Invalid authentication token." });
        }

        const email = userData.user.email;
        const userSchema = await User.findOne({ email });

        const refreshedToken = tokenController.refreshToken(jwtToken);
        const fullName = userSchema.firstName + " " + userSchema.lastName;

        res.status(200).json({
            firstName: userSchema.firstName,
            lastName: userSchema.lastName,
            fullName: fullName,
            email: email,
            token: refreshedToken
        });
       


    }
    catch (err) {
        res.status(500).json({error: err.message});
    }
};


exports.deleteUser = async (req, res) => {
    try {
        const { password, jwtToken } = req.body;

        if (!password || !jwtToken) {
            return res.status(400).json({ msg: "Password is required for account deletion" });
        }

        const userData = tokenController.getTokenData(jwtToken);
        
        if (!userData || !userData.user || !userData.user.id) {
            return res.status(401).json({ msg: "Invalid authentication token" });
        }
        
        const userID = userData.user.id;
        const email = userData.user.email;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Incorrect password. For security reasons, account deletion requires your correct password." });
        }

        const classes = await Class.find({ userID });
        for (const cls of classes) {
            await Chapter.deleteMany({ classID: cls._id.toString(), userID });
            await Quiz.deleteMany({ classID: cls._id.toString() });
        }
        await Class.deleteMany({ userID });
        await Chat.deleteMany({ userID });
        await User.findOneAndDelete({ userID });

        res.status(200).json({ msg: "User account and all associated data deleted successfully" });
    } catch (err) {
        console.error("Error deleting user account:", err);
        res.status(500).json({ error: err.message });
    }
};