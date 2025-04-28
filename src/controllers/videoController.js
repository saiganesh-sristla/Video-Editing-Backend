// src/controllers/videoController.js
const path = require('path');
const { getVideoDuration } = require('../services/ffmpegService');
const videoService = require('../services/videoService');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Upload a video file
 */
const uploadVideo = async (req, res, next) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      throw new ApiError('No video file provided', 400);
    }

    const { originalname, filename, size, path: filePath } = req.file;
    
    // Get video duration using FFmpeg
    const duration = await getVideoDuration(filePath);
    
    // Save video metadata to database
    const video = await videoService.createVideo({
      name: filename,
      originalName: originalname,
      size,
      duration: Math.floor(duration),
      originalPath: filePath,
      status: 'UPLOADED'
    });

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: {
        id: video.id,
        name: video.name,
        originalName: video.originalName,
        duration: video.duration,
        size: video.size,
        status: video.status,
        createdAt: video.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadVideo
};