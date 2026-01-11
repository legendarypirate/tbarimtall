const { Journalist, User, Product, Review } = require('../models');
const { Op } = require('sequelize');

exports.getTopJournalists = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const journalists = await Journalist.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'avatar']
      }],
      order: [['rating', 'DESC'], ['followers', 'DESC']],
      limit
    });

    // Batch query: Get all product counts, ratings, and engagement metrics in a single query
    const userIds = journalists.map(j => j.userId);
    
    // Use raw query for better performance with GROUP BY
    const { sequelize } = require('../models');
    const { QueryTypes } = require('sequelize');
    
    // Get product counts
    const productCounts = await sequelize.query(
      `SELECT "authorId", COUNT(*) as count 
       FROM products 
       WHERE "authorId" IN (:userIds) AND "isActive" = true 
       GROUP BY "authorId"`,
      {
        replacements: { userIds },
        type: QueryTypes.SELECT
      }
    );

    // Get average ratings from product reviews
    const averageRatings = await sequelize.query(
      `SELECT p."authorId", AVG(r.rating)::numeric(3,2) as avg_rating, COUNT(r.id) as review_count
       FROM products p
       LEFT JOIN reviews r ON p.id = r."productId"
       WHERE p."authorId" IN (:userIds) AND p."isActive" = true
       GROUP BY p."authorId"`,
      {
        replacements: { userIds },
        type: QueryTypes.SELECT
      }
    );

    // Get engagement metrics (views and downloads) for followers calculation
    const engagementMetrics = await sequelize.query(
      `SELECT "authorId", 
              SUM(views) as total_views, 
              SUM(downloads) as total_downloads
       FROM products 
       WHERE "authorId" IN (:userIds) AND "isActive" = true 
       GROUP BY "authorId"`,
      {
        replacements: { userIds },
        type: QueryTypes.SELECT
      }
    );

    // Create maps for quick lookup
    const countMap = {};
    productCounts.forEach(item => {
      countMap[item.authorId] = parseInt(item.count) || 0;
    });

    const ratingMap = {};
    averageRatings.forEach(item => {
      // Only use rating if there are reviews, otherwise default to 0
      if (item.review_count > 0 && item.avg_rating) {
        ratingMap[item.authorId] = parseFloat(item.avg_rating) || 0;
      } else {
        ratingMap[item.authorId] = 0;
      }
    });

    const engagementMap = {};
    engagementMetrics.forEach(item => {
      engagementMap[item.authorId] = {
        views: parseInt(item.total_views) || 0,
        downloads: parseInt(item.total_downloads) || 0
      };
    });

    // Map journalists with real calculated data
    const journalistsWithPosts = journalists.map((journalist) => {
      const userId = journalist.userId;
      const engagement = engagementMap[userId] || { views: 0, downloads: 0 };
      
      // Calculate followers as a proxy from engagement metrics
      // Formula: (views / 10 + downloads * 2) to get a reasonable follower count
      // This gives more weight to downloads as they indicate stronger engagement
      const calculatedFollowers = Math.floor((engagement.views / 10) + (engagement.downloads * 2));
      
      return {
        id: journalist.id,
        userId: userId,
        name: journalist.user.fullName || journalist.user.username,
        username: `@${journalist.user.username}`,
        avatar: journalist.user.avatar,
        specialty: journalist.specialty,
        rating: ratingMap[userId] || 0,
        followers: calculatedFollowers,
        posts: countMap[userId] || 0
      };
    });

    // Sort by rating first, then by followers
    journalistsWithPosts.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return b.followers - a.followers;
    });

    res.json({ journalists: journalistsWithPosts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getJournalistById = async (req, res) => {
  try {
    const { id } = req.params;

    // First check if user exists
    const user = await User.findByPk(id, {
      attributes: ['id', 'username', 'fullName', 'avatar', 'email', 'role']
    });

    if (!user) {
      return res.status(404).json({ error: 'Journalist not found' });
    }

    // Check if journalist record exists, if not create one
    let journalist = await Journalist.findOne({
      where: { userId: id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'avatar', 'email']
      }]
    });

    // If no journalist record exists, create one with default values
    if (!journalist) {
      journalist = await Journalist.create({
        userId: id,
        specialty: null,
        bio: null,
        rating: 0,
        followers: 0,
        posts: 0
      });
      
      // Manually attach user data since we already have it
      journalist = journalist.toJSON();
      journalist.user = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        email: user.email
      };
    } else {
      journalist = journalist.toJSON();
    }

    // Get products
    const products = await Product.findAll({
      where: { authorId: id, isActive: true },
      include: [
        { model: require('../models').Category, as: 'category', attributes: ['id', 'name', 'icon'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const postsCount = await Product.count({
      where: { authorId: id, isActive: true }
    });

    res.json({
      journalist: {
        ...journalist,
        posts: postsCount,
        products
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

