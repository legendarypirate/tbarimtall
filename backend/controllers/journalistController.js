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

    // Get posts count for each journalist
    const journalistsWithPosts = await Promise.all(
      journalists.map(async (journalist) => {
        const postsCount = await Product.count({
          where: { authorId: journalist.userId, isActive: true }
        });

        return {
          id: journalist.id,
          userId: journalist.userId,
          name: journalist.user.fullName || journalist.user.username,
          username: `@${journalist.user.username}`,
          avatar: journalist.user.avatar,
          specialty: journalist.specialty,
          rating: parseFloat(journalist.rating),
          followers: journalist.followers,
          posts: postsCount
        };
      })
    );

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

