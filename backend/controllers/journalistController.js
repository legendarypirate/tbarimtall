const { Journalist, User, Product } = require('../models');
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

    // Batch query: Get all product counts in a single query to avoid N+1 problem
    const userIds = journalists.map(j => j.userId);
    
    // Use raw query for better performance with GROUP BY
    const { sequelize } = require('../models');
    const { QueryTypes } = require('sequelize');
    
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

    // Create a map for quick lookup
    const countMap = {};
    productCounts.forEach(item => {
      countMap[item.authorId] = parseInt(item.count) || 0;
    });

    // Map journalists with their post counts
    const journalistsWithPosts = journalists.map((journalist) => {
      return {
        id: journalist.id,
        userId: journalist.userId,
        name: journalist.user.fullName || journalist.user.username,
        username: `@${journalist.user.username}`,
        avatar: journalist.user.avatar,
        specialty: journalist.specialty,
        rating: parseFloat(journalist.rating),
        followers: journalist.followers,
        posts: countMap[journalist.userId] || 0
      };
    });

    res.json({ journalists: journalistsWithPosts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getJournalistById = async (req, res) => {
  try {
    const { id } = req.params;

    const journalist = await Journalist.findOne({
      where: { userId: id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'avatar', 'email']
      }]
    });

    if (!journalist) {
      return res.status(404).json({ error: 'Journalist not found' });
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
        ...journalist.toJSON(),
        posts: postsCount,
        products
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

