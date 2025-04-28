// src/services/videoService.js
const prisma = require('../utils/prismaClient');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Create a new video entry in the database
 */
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

/**
 * Get a video by ID
 */
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

/**
 * Get all videos
 */
const getAllVideos = async () => {
  return prisma.video.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });
};

/**
 * Update video status
 */
const updateVideoStatus = async (id, status) => {
  return prisma.video.update({
    where: { id },
    data: { status }
  });
};

/**
 * Update video final path
 */
const updateVideoFinalPath = async (id, finalPath) => {
  return prisma.video.update({
    where: { id },
    data: { 
      finalPath,
      status: 'READY'
    }
  });
};

module.exports = {
  createVideo,
  getVideoById,
  getAllVideos,
  updateVideoStatus,
  updateVideoFinalPath
};