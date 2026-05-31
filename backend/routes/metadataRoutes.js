const express = require('express');
const router = express.Router();
const { getMetadata, updateMetadata } = require('../controllers/metadataController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(getMetadata)
    .put(protect, updateMetadata);

module.exports = router;
