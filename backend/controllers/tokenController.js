const jwt = require('jsonwebtoken');

//check if the token is expired or otherwise invalid
exports.isTokenInvalid = function (token) {
    var isError = jwt.verify(token, process.env.JWT_SECRET,
    (err, verifiedJwt) => {
        if (err) {
            return true;
        } else {
            return false;
        }
    });

    return isError;
}


//return refreshed token on completed action
exports.tokenRefresh = function (token) {
    var oldTokenData = jwt.decode(token, {complete:true});

    const newPayload = {
        id: oldTokenData.payload.id,
        email: oldTokenData.payload.email
    };

    return jwt.sign(newPayload, process.env.JWT_SECRET, {expiresIn: "1h"});
}


//gets the decoded token data, which you're probably going to want to do often
exports.getTokenData = function (token) {
    return (jwt.decode(token, {complete:true}));
}