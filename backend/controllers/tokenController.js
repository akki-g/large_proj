const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

exports.createToken = (payload) => {
    return jwt.sign(
        { payload },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

exports.refreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const payloadData = decoded.payload ? decoded.payload.user : decoded.user;
        return jwt.sign(
            { user: payloadData },
            JWT_SECRET, 
            { expiresIn: '1h' }
        );
    }
    catch (err) {
        console.error("Error refreshing token:", err);
        return token;
    }
}

exports.getTokenData = (token) => {
    try {
        console.log("Get token data:", token);
        const payload = jwt.verify(token, JWT_SECRET)
        console.log("Payload data:", payload);
        return payload;
    }
    catch (err) {
        console.error("Error getting token data:", err);
        return null;
    }
}

exports.verifyToken = (token) => {
    try{
        jwt.verify(token, JWT_SECRET);
        return true;
    }
    catch (err) {
        console.error("Error verifying token:", err);
        return false;
    } 
}

exports.authenticateToken = (req, res, next) => {
    const token = req.body.jwtToken ||
        req.query.jwtToken ||
        req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({msg: "No token provided"});
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded.payload;
        req.refreshedToken = this.refreshToken(token);
        next();
    } catch (err) {
        console.error("Error authenticating token:", err);
        return res.status(401).json({msg: "Invalid token"});
    }
}