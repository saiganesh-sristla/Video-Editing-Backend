const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { ApiError } = require('../middleware/errorHandler');

// Get video duration using FFmpeg
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

// Trim a video file to specified start and end times
const trimVideo = (videoPath, outputPath, startTime, endTime) => {
  return new Promise((resolve, reject) => {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    ffmpeg(videoPath)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .output(outputPath)
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(new ApiError(`FFmpeg trim error: ${err.message}`, 500));
      })
      .run();
  });
};

// Add subtitles to a video
const addSubtitles = (videoPath, outputPath, subtitles) => {
  return new Promise((resolve, reject) => {
    const subtitleDir = path.dirname(outputPath);
    const subtitlePath = path.join(subtitleDir, `temp_subs_${Date.now()}.srt`);

    // Ensure the directory exists
    if (!fs.existsSync(subtitleDir)) {
      fs.mkdirSync(subtitleDir, { recursive: true });
    }

    let srtContent = '';

    subtitles.forEach((subtitle, index) => {
      const startTimeFormatted = formatTimeForSRT(subtitle.startTime);
      const endTimeFormatted = formatTimeForSRT(subtitle.endTime);

      srtContent += `${index + 1}\n`;
      srtContent += `${startTimeFormatted} --> ${endTimeFormatted}\n`;
      srtContent += `${subtitle.text}\n\n`;
    });

    fs.writeFileSync(subtitlePath, srtContent);

    // Escape subtitle path for Windows and FFmpeg
    const escapedPath = subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:');

    ffmpeg(videoPath)
      .videoFilter(`subtitles='${escapedPath}'`)
      .output(outputPath)
      .on('end', () => {
        fs.unlinkSync(subtitlePath);
        resolve(outputPath);
      })
      .on('error', (err) => {
        if (fs.existsSync(subtitlePath)) {
          fs.unlinkSync(subtitlePath);
        }
        reject(new ApiError(`FFmpeg subtitle error: ${err.message}`, 500));
      })
      .run();
  });
};


// Helper function to format time for SRT format (00:00:00,000)
const formatTimeForSRT = (timeInSeconds) => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
};

module.exports = {
  getVideoDuration,
  trimVideo,
  addSubtitles
};