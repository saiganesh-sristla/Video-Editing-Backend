const prisma  = require('../utils/prismaClient');
const { ApiError } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');
const ffmpegService = require('./ffmpegService');

// Create a new video record
const createVideo = async (videoData) => {
  try {
    const video = await prisma.video.create({
      data: videoData
    });
    return video;
  } catch (error) {
    console.error('Error creating video:', error);
    throw new ApiError('Failed to create video record', 500);
  }
};

// Get a video by ID with related trim and subtitle data
const getVideoById = async (id) => {
  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      trims: true,
      subtitles: true
    }
  });
  
  if (!video) {
    throw new ApiError('Video not found', 404);
  }
  return video;
};

// Get all videos with optional pagination
const getAllVideos = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  const [videos, totalCount] = await Promise.all([
    prisma.video.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            trims: true,
            subtitles: true
          }
        }
      }
    }),
    prisma.video.count()
  ]);
  
  return {
    videos,
    pagination: {
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      itemsPerPage: limit
    }
  };
};

// Update video status
const updateVideoStatus = async (id, status) => {
  return prisma.video.update({
    where: { id },
    data: { status }
  });
};

// Update video final path
const updateVideoFinalPath = async (id, finalPath) => {
  return prisma.video.update({
    where: { id },
    data: {
      finalPath,
      status: 'READY'
    }
  });
};

// Create a trim operation for a video
const createTrim = async (videoId, { startTime, endTime }) => {
  // Validate the trim parameters
  if (startTime < 0) {
    throw new ApiError('Start time cannot be negative', 400);
  }
  
  // Get the video to check duration and status
  const video = await getVideoById(videoId);
  
  if (video.status !== 'UPLOADED' && video.status !== 'READY') {
    throw new ApiError('Video is not ready for trimming', 400);
  }
  
  if (endTime > video.duration) {
    throw new ApiError(`End time exceeds video duration (${video.duration}s)`, 400);
  }
  
  if (startTime >= endTime) {
    throw new ApiError('Start time must be less than end time', 400);
  }
  
  // Create the trim record
  const trim = await prisma.trim.create({
    data: {
      startTime,
      endTime,
      videoId
    }
  });
  
  return trim;
};

// Process a trim operation and create the trimmed file
const processTrim = async (videoId, trimId) => {
  // Get the video and trim details
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      trims: {
        where: { id: trimId }
      }
    }
  });
  
  if (!video) {
    throw new ApiError('Video not found', 404);
  }
  
  if (video.trims.length === 0) {
    throw new ApiError('Trim operation not found', 404);
  }
  
  const trim = video.trims[0];
  const outputDir = path.join(process.cwd(), 'uploads', 'processed');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFilename = `trim_${videoId}_${trim.id}${path.extname(video.originalPath)}`;
  const outputPath = path.join(outputDir, outputFilename);
  
  // Update video status to processing
  await updateVideoStatus(videoId, 'PROCESSING');
  
  try {
    // Perform the trim operation
    await ffmpegService.trimVideo(
      video.originalPath,
      outputPath,
      trim.startTime,
      trim.endTime
    );
    
    // Update video with the new processed file path
    await updateVideoFinalPath(videoId, outputPath);
    
    return { 
      id: videoId,
      trimId: trim.id,
      outputPath 
    };
  } catch (error) {
    // If there's an error, update status back
    await updateVideoStatus(videoId, 'UPLOADED');
    throw error;
  }
};

// Create subtitles for a video
const createSubtitles = async (videoId, subtitlesData) => {
  // Validate subtitles data
  if (!Array.isArray(subtitlesData) || subtitlesData.length === 0) {
    throw new ApiError('Invalid subtitles data', 400);
  }
  
  // Get the video to check if it exists
  const video = await getVideoById(videoId);
  
  // Create all subtitle records
  const subtitles = await Promise.all(
    subtitlesData.map(subtitle => 
      prisma.subtitle.create({
        data: {
          text: subtitle.text,
          startTime: subtitle.startTime,
          endTime: subtitle.endTime,
          videoId
        }
      })
    )
  );
  
  return subtitles;
};

module.exports = {
  createVideo,
  getVideoById,
  getAllVideos,
  updateVideoStatus,
  updateVideoFinalPath,
  createTrim,
  processTrim,
  createSubtitles
};