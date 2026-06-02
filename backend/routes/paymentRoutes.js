const express = require('express');
const router = express.Router();
const { createOrder, payuCallback } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createOrder);
router.post('/payu-callback', payuCallback);

module.exports = router;
