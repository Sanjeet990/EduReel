const User = require('../models/userModel');
const UserProfile = require('../models/userProfileModel');
const DeviceSession = require('../models/deviceSessionModel');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password
        });

        if (user) {
            // Create empty profile
            await UserProfile.create({ user: user._id });

            res.status(201).json({
                success: true,
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin
                }
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password, deviceId, deviceName } = req.body;

    console.log('Login attempt:', { email, deviceId, deviceName, password });

    try {
        const user = await User.findOne({ email });

        console.log('User found:', user);

        if (user && (await user.matchPassword(password))) {
            const token = generateToken(user._id, user.isAdmin, deviceId);

            console.log('Generated token:', token);

            // Upsert device session
            let session = await DeviceSession.findOne({ user: user._id, deviceId });
            if (session) {
                session.jwtToken = token;
                session.lastSeen = Date.now();
                session.isActive = true;
                session.isAdmin = user.isAdmin;
                if(deviceName) session.deviceName = deviceName;
                await session.save();
            } else {
                await DeviceSession.create({
                    user: user._id,
                    deviceId,
                    deviceName,
                    jwtToken: token,
                    lastSeen: Date.now(),
                    isActive: true
                });
            }

            res.json({
                success: true,
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    token
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Logout user / invalidate device session
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
    try {
        if (req.deviceId) {
            await DeviceSession.findOneAndUpdate(
                { user: req.user._id, deviceId: req.deviceId },
                { isActive: false }
            );
        }
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        const profile = await UserProfile.findOne({ user: req.user._id });
        
        res.json({
            success: true,
            data: {
                user,
                profile
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update onboarding profile
// @route   PUT /api/auth/onboarding
// @access  Private
const updateOnboarding = async (req, res) => {
    const { ageGroup, classLevel, subjects } = req.body;

    try {
        let profile = await UserProfile.findOne({ user: req.user._id });
        
        if (profile) {
            profile.ageGroup = ageGroup || profile.ageGroup;
            profile.classLevel = classLevel !== undefined ? classLevel : profile.classLevel;
            profile.subjects = subjects || profile.subjects;
            
            const updatedProfile = await profile.save();
            res.json({ success: true, data: updatedProfile });
        } else {
            // Create the profile if it doesn't exist
            profile = await UserProfile.create({
                user: req.user._id,
                ageGroup: ageGroup,
                classLevel: classLevel,
                subjects: subjects
            });
            res.json({ success: true, data: profile });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    updateOnboarding
};
