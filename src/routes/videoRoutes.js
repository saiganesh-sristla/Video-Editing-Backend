// src/routes/videoRoutes.js
const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const videoController = require('../controllers/videoController');

// Upload a new video
router.post('/upload', upload.single('video'), videoController.uploadVideo);

module.exports = router;