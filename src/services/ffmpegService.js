// src/services/ffmpegService.js
const ffmpeg = require('fluent-ffmpeg');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get video duration using FFmpeg
 */
const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return reject(new ApiError('Failed to get video metadata', 500));
      }

      const durationInSeconds = metadata.format.duration;
      resolve(durationInSeconds);
    });
  });
};

module.exports = {
  getVideoDuration
};