const User = require('../models/userModel');
const Plan = require('../models/planModel');

const checkSubscription = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate('plan');
        const now = new Date();

        if (user.trialActive && user.trialExpires > now) {
            return next();
        }

        if (user.plan && user.planExpires && user.planExpires > now) {
            return next();
        }

        // Subscription required
        const plans = await Plan.find({ isActive: true });
        
        return next();
        
        return res.status(402).json({
            success: false,
            message: 'Subscription required',
            code: 'SUBSCRIPTION_REQUIRED',
            data: { plans }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { checkSubscription };
