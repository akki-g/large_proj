/*

const Chat = require('../models/Chat');
const Class = require('../models/Class');
const Chapter = require('../models/Chapter');
const Quiz = require('../models/Question');
const axios = require('axios');
const tokenController = require('./tokenController');

// Create a new chat or continue existing chat
exports.sendMessage = async (req, res) => {
    try {
        const { message, chatId, jwtToken } = req.body;

        if (!message) {
            return res.status(400).json({ msg: "Message content is required" });
        }

        // Verify JWT and get user ID
        const userData = tokenController.getTokenData(jwtToken);
        if (!userData || !userData.user || !userData.user.id) {
            return res.status(401).json({ msg: "Invalid authentication token" });
        }
        const userID = userData.user.id;
        const refreshedToken = tokenController.refreshToken(jwtToken);

        let chat;

        // If chatId is provided, find and update existing chat
        if (chatId) {
            chat = await Chat.findOne({ _id: chatId, userID: userID });
            
            if (!chat) {
                return res.status(404).json({ msg: "Chat not found" });
            }
        } else {
            // Create a new chat if no chatId is provided
            // Generate a title based on the first message
            let title = message.length <= 30 ? message : message.substring(0, 30) + '...';
            
            chat = new Chat({
                userID: userID,
                messages: [],
                title: title
            });
        }

        // Add user message to chat
        chat.messages.push({
            content: message,
            sender: 'user'
        });

        // Process with AI and get response
        let aiResponse;
        try {
            // Pass the user ID to include their educational context
            aiResponse = await processWithAI(message, chat.messages, userID);
        } catch (error) {
            console.error("Error processing with AI:", error);
            aiResponse = "I'm sorry, I'm having trouble processing your request right now.";
        }

        // Add AI response to chat
        chat.messages.push({
            content: aiResponse,
            sender: 'assistant'
        });

        // Update lastUpdated timestamp
        chat.lastUpdated = Date.now();

        // Save the chat
        await chat.save();

        // Return the updated chat
        res.status(200).json({
            chat: chat,
            jwtToken: refreshedToken
        });
    } catch (err) {
        console.error("Error in sendMessage:", err);
        res.status(500).json({ error: err.message });
    }
};

// Get all chats for a user
exports.getChats = async (req, res) => {
    try {
        const { jwtToken } = req.query;

        // Verify JWT and get user ID
        const userData = tokenController.getTokenData(jwtToken);
        if (!userData || !userData.user || !userData.user.id) {
            return res.status(401).json({ msg: "Invalid authentication token" });
        }
        const userID = userData.user.id;
        const refreshedToken = tokenController.refreshToken(jwtToken);

        // Find all chats for the user, sorted by last updated
        const chats = await Chat.find({ userID: userID })
            .sort({ lastUpdated: -1 })
            .select('_id title lastUpdated'); // Only return necessary fields

        res.status(200).json({
            chats: chats,
            jwtToken: refreshedToken
        });
    } catch (err) {
        console.error("Error in getChats:", err);
        res.status(500).json({ error: err.message });
    }
};

// Get a specific chat by ID
exports.getChatById = async (req, res) => {
    try {
        const { chatId, jwtToken } = req.query;

        if (!chatId) {
            return res.status(400).json({ msg: "Chat ID is required" });
        }

        // Verify JWT and get user ID
        const userData = tokenController.getTokenData(jwtToken);
        if (!userData || !userData.user || !userData.user.id) {
            return res.status(401).json({ msg: "Invalid authentication token" });
        }
        const userID = userData.user.id;
        const refreshedToken = tokenController.refreshToken(jwtToken);

        // Find the chat
        const chat = await Chat.findOne({ _id: chatId, userID: userID });
        
        if (!chat) {
            return res.status(404).json({ msg: "Chat not found" });
        }

        res.status(200).json({
            chat: chat,
            jwtToken: refreshedToken
        });
    } catch (err) {
        console.error("Error in getChatById:", err);
        res.status(500).json({ error: err.message });
    }
};

// Delete a chat
exports.deleteChat = async (req, res) => {
    try {
        const { chatId, jwtToken } = req.body;

        if (!chatId) {
            return res.status(400).json({ msg: "Chat ID is required" });
        }

        // Verify JWT and get user ID
        const userData = tokenController.getTokenData(jwtToken);
        if (!userData || !userData.user || !userData.user.id) {
            return res.status(401).json({ msg: "Invalid authentication token" });
        }
        const userID = userData.user.id;
        const refreshedToken = tokenController.refreshToken(jwtToken);

        // Find and delete the chat
        const result = await Chat.findOneAndDelete({ _id: chatId, userID: userID });
        
        if (!result) {
            return res.status(404).json({ msg: "Chat not found" });
        }

        res.status(200).json({
            msg: "Chat deleted successfully",
            jwtToken: refreshedToken
        });
    } catch (err) {
        console.error("Error in deleteChat:", err);
        res.status(500).json({ error: err.message });
    }
};

// Function to retrieve relevant context from the database
async function retrieveUserContext(userId, query) {
    try {
        // Initialize an empty context object
        const context = {
            classes: [],
            chapters: [],
            quizzes: []
        };

        // Find all classes for this user
        const userClasses = await Class.find({ userID: userId });
        context.classes = userClasses.map(c => ({
            id: c._id,
            name: c.name,
            number: c.number
        }));

        // Get class IDs
        const classIds = userClasses.map(c => c._id.toString());

        // Find all chapters related to these classes
        const chapters = await Chapter.find({ 
            classID: { $in: classIds },
            userID: userId
        });
        context.chapters = chapters.map(ch => ({
            id: ch._id,
            name: ch.chapterName,
            className: ch.className,
            classID: ch.classID,
            summary: ch.summary
        }));

        // Find quiz questions for these chapters
        const chapterIds = chapters.map(ch => ch._id);
        const quizzes = await Quiz.find({
            chapterID: { $in: chapterIds.map(id => id.toString()) }
        });
        context.quizzes = quizzes.map(q => ({
            id: q._id,
            question: q.question,
            correctOption: q.correctOption,
            chapterID: q.chapterID
        }));

        // For a more advanced implementation, you could use a vector database
        // to find the most relevant pieces of information based on the query
        // For now, we'll just return all the user's educational data

        return context;
    } catch (error) {
        console.error('Error retrieving user context:', error);
        return {};
    }
}

// Format the user context into a string for the AI
function formatContextForAI(context) {
    let formattedContext = "USER'S EDUCATIONAL DATA:\n\n";
    
    // Format classes
    if (context.classes && context.classes.length > 0) {
        formattedContext += "CLASSES:\n";
        context.classes.forEach(cls => {
            formattedContext += `- ${cls.name} (${cls.number})\n`;
        });
        formattedContext += "\n";
    }
    
    // Format chapters
    if (context.chapters && context.chapters.length > 0) {
        formattedContext += "CHAPTERS:\n";
        context.chapters.forEach(chapter => {
            formattedContext += `- ${chapter.name} (Class: ${chapter.className})\n`;
            if (chapter.summary) {
                formattedContext += `  Summary: ${chapter.summary.substring(0, 200)}...\n`;
            }
        });
        formattedContext += "\n";
    }
    
    // Format quizzes (limited to avoid overwhelming the context)
    if (context.quizzes && context.quizzes.length > 0) {
        formattedContext += `QUIZZES: (${context.quizzes.length} total questions available)\n`;
        // Just include a few examples
        const sampleQuizzes = context.quizzes.slice(0, 3);
        sampleQuizzes.forEach(quiz => {
            formattedContext += `- Question: ${quiz.question}\n`;
        });
    }
    
    return formattedContext;
}

// Utility function to process the message with AI
async function processWithAI(message, chatHistory, userId = null) {
    try {
        // Only retrieve context if we have a userId
        let userContext = {};
        let formattedContext = "";
        
        if (userId) {
            userContext = await retrieveUserContext(userId, message);
            formattedContext = formatContextForAI(userContext);
        }

        // Example of how you might integrate with OpenAI GPT
        if (process.env.OPENAI_API_KEY) {
            const systemPrompt = `You are Syllab.AI, an educational assistant that helps with syllabi, course planning, and study materials. You have access to the following information about the user's educational data:

${formattedContext}

When responding to the user, utilize this context to provide personalized assistance. If they ask about their classes, chapters, or other educational content, refer to this information.
If they ask questions not related to their educational data, you can still help with general educational topics. Always be helpful, concise, and educational.`;

            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4o-mini', // Using the model specified in your class controller
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...chatHistory.filter(msg => msg.content).map(msg => ({
                        role: msg.sender === 'user' ? 'user' : 'assistant',
                        content: msg.content
                    })),
                    { role: 'user', content: message }
                ],
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data.choices[0].message.content;
        } else {
            // Fallback if no API key is set
            // Create a simple response that references the user's data if available
            let response = `I received your message: "${message}". I'm Syllab.AI, and I'm here to help with your educational needs.`;
            
            if (userContext.classes && userContext.classes.length > 0) {
                response += ` I can see you have ${userContext.classes.length} classes, including ${userContext.classes[0].name}.`;
            }
            
            if (userContext.chapters && userContext.chapters.length > 0) {
                response += ` You're working with chapters like "${userContext.chapters[0].name}".`;
            }
            
            response += " How can I assist you further with your courses or study materials?";
            
            return response;
        }
    } catch (error) {
        console.error('Error calling AI service:', error);
        return `I'm sorry, I encountered an error processing your request. Please try again later.`;
    }
}

*/