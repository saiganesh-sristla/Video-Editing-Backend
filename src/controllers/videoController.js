const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const videoService = require('../services/videoService');
const ffmpegService = require('../services/ffmpegService');
const { ApiError } = require('../middleware/errorHandler');

// Upload a new video
const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError('No video file provided', 400);
    }
    
    const { originalname, filename, size, path: filePath } = req.file;
    
    // Get video duration using FFmpeg
    const duration = await ffmpegService.getVideoDuration(filePath);
    
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

// Get all videos with pagination
const getAllVideos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await videoService.getAllVideos(page, limit);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get a single video by ID
const getVideoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const video = await videoService.getVideoById(id);
    
    res.status(200).json(video);
  } catch (error) {
    next(error);
  }
};

// Create a trim operation
const createTrim = async (req, res, next) => {
  try {
    const { id: videoId } = req.params;
    const { startTime, endTime } = req.body;
    
    // Validate input
    if (startTime === undefined || endTime === undefined) {
      throw new ApiError('Start time and end time are required', 400);
    }
    
    const trim = await videoService.createTrim(videoId, {
      startTime: parseFloat(startTime),
      endTime: parseFloat(endTime)
    });
    
    res.status(201).json({
      message: 'Trim operation created successfully',
      trim
    });
  } catch (error) {
    next(error);
  }
};

// Process a trim operation to create the trimmed video file
const processTrim = async (req, res, next) => {
  try {
    const { id: videoId, trimId } = req.params;
    
    // Process the trim operation
    const result = await videoService.processTrim(videoId, trimId);
    
    res.status(200).json({
      message: 'Video trimmed successfully',
      result
    });
  } catch (error) {
    next(error);
  }
};

// Add subtitles to a video
const addSubtitles = async (req, res, next) => {
  try {
    const { id: videoId } = req.params;
    const { subtitles } = req.body;
    
    if (!subtitles || !Array.isArray(subtitles) || subtitles.length === 0) {
      throw new ApiError('Valid subtitles array is required', 400);
    }
    
    const createdSubtitles = await videoService.createSubtitles(videoId, subtitles);
    
    res.status(201).json({
      message: 'Subtitles added successfully',
      subtitles: createdSubtitles
    });
  } catch (error) {
    next(error);
  }
};

const processSubtitles = async (req, res, next) => {
  try {
    const video = await videoService.getVideoById(req.params.id);
    if (!video) throw new ApiError(404, 'Video not found');
    if (!video.subtitles?.length) throw new ApiError(400, 'No subtitles to process');

    const inputPath = video.finalPath || video.originalPath;
    const outputPath = path.join(__dirname, '../../uploads/processed', `subtitled-${Date.now()}.mp4`);

    await ffmpegService.addSubtitles(inputPath, outputPath, video.subtitles);
    await videoService.updateVideoFinalPath(video.id, outputPath);
    await videoService.updateVideoStatus(video.id, 'READY');

    res.json({ message: 'Subtitles applied', finalPath: outputPath });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadVideo,
  getAllVideos,
  getVideoById,
  createTrim,
  processTrim,
  addSubtitles,
  processSubtitles
};