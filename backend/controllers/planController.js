const Plan = require('../models/planModel');

// @desc    Get all active plans
// @route   GET /api/plans
// @access  Public
const getPlans = async (req, res) => {
    try {
        const plans = await Plan.find({ isActive: true });
        res.json({ success: true, data: plans });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new plan
// @route   POST /api/plans
// @access  Private/Admin
const createPlan = async (req, res) => {
    const { name, durationDays, features, price, numberOfDevices } = req.body;

    try {
        const plan = await Plan.create({
            name,
            durationDays,
            features,
            price,
            numberOfDevices
        });

        res.status(201).json({ success: true, data: plan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a plan
// @route   PUT /api/plans/:id
// @access  Private/Admin
const updatePlan = async (req, res) => {
    try {
        let plan = await Plan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        res.json({ success: true, data: plan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Soft delete a plan
// @route   DELETE /api/plans/:id
// @access  Private/Admin
const deletePlan = async (req, res) => {
    try {
        let plan = await Plan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        plan.isActive = false;
        await plan.save();

        res.json({ success: true, message: 'Plan deactivated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getPlans,
    createPlan,
    updatePlan,
    deletePlan
};
