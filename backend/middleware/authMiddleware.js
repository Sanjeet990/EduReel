const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const DeviceSession = require('../models/deviceSessionModel');

const protect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Find user
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
            }
            
            // Check device session
            if (decoded.deviceId) {
                const session = await DeviceSession.findOne({ 
                    user: req.user._id, 
                    deviceId: decoded.deviceId, 
                    isActive: true 
                });
                if (!session) {
                    return res.status(401).json({ success: false, message: 'Session expired or device removed', code: 'SESSION_EXPIRED' });
                }
                req.deviceId = decoded.deviceId;
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, adminOnly };
