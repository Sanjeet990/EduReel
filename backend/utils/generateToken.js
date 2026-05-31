const jwt = require('jsonwebtoken');

const generateToken = (id, isAdmin, deviceId) => {
    return jwt.sign({ id, isAdmin, deviceId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

module.exports = generateToken;
