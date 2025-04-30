// src/routes/videoRoutes.js
const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const videoController = require('../controllers/videoController');

// Upload a new video
router.post('/upload', upload.single('video'), videoController.uploadVideo);

// Get all videos with pagination
router.get('/', videoController.getAllVideos);

// Get a single video by ID
router.get('/:id', videoController.getVideoById);

// Create a trim operation for a video
router.post('/:id/trim', videoController.createTrim);

// Process a trim operation to create the trimmed video
router.post('/:id/trim/:trimId/process', videoController.processTrim);

// Add subtitles to a video
router.post('/:id/subtitles', videoController.addSubtitles);

router.post('/:id/subtitles/process', videoController.processSubtitles);

router.post('/:id/render', videoController.renderVideo);

router.get('/:id/download', videoController.downloadVideo);

module.exports = router;