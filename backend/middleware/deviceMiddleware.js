const DeviceSession = require('../models/deviceSessionModel');
const User = require('../models/userModel');

// Enforce device limits when logging in
const enforceDeviceLimit = async (req, res, next) => {
    const { email, deviceId } = req.body;
    
    if (!email || !deviceId) {
        return res.status(400).json({ success: false, message: 'Email and deviceId are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return next(); // Let auth controller handle invalid user
        }

        const activeSessions = await DeviceSession.countDocuments({ user: user._id, isActive: true });
        const currentSession = await DeviceSession.findOne({ user: user._id, deviceId, isActive: true });

        // If trying to log in with a new device and max devices reached
        if (!currentSession && activeSessions >= user.allowedDevices) {
            return res.status(409).json({ 
                success: false, 
                message: 'Device limit reached. Remove a device in settings.',
                code: 'DEVICE_LIMIT_EXCEEDED'
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { enforceDeviceLimit };
