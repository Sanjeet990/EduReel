const express = require('express');
const router = express.Router();
const { 
    getPlans, 
    createPlan, 
    updatePlan, 
    deletePlan 
} = require('../controllers/planController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
    .get(getPlans)
    .post(protect, adminOnly, createPlan);

router.route('/:id')
    .put(protect, adminOnly, updatePlan)
    .delete(protect, adminOnly, deletePlan);

module.exports = router;
