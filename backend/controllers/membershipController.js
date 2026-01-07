const { Membership, User, Product } = require('../models');
const { Op } = require('sequelize');

// Get all memberships
exports.getAllMemberships = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, isActive } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const { count, rows } = await Membership.findAndCountAll({
      where,
      order: [['order', 'ASC'], ['price', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      memberships: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get membership by ID
exports.getMembershipById = async (req, res) => {
  try {
    const { id } = req.params;
    const membership = await Membership.findByPk(id);

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    res.json({ membership });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create membership
exports.createMembership = async (req, res) => {
  try {
    const { name, price, maxPosts, advantages, description, isActive, order, percentage } = req.body;

    // Validate required fields
    if (!name || price === undefined || maxPosts === undefined) {
      return res.status(400).json({ error: 'Name, price, and maxPosts are required' });
    }

    // Ensure advantages is an array
    const advantagesArray = Array.isArray(advantages) ? advantages : (advantages ? [advantages] : []);

    const membership = await Membership.create({
      name,
      price: parseFloat(price),
      maxPosts: parseInt(maxPosts),
      advantages: advantagesArray,
      description: description || null,
      isActive: isActive !== undefined ? isActive : true,
      order: order !== undefined ? parseInt(order) : 0,
      percentage: percentage !== undefined ? parseFloat(percentage) : 20.00
    });

    res.status(201).json({ membership });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Membership with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Update membership
exports.updateMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, maxPosts, advantages, description, isActive, order, percentage } = req.body;

    const membership = await Membership.findByPk(id);

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (maxPosts !== undefined) updateData.maxPosts = parseInt(maxPosts);
    if (advantages !== undefined) {
      updateData.advantages = Array.isArray(advantages) ? advantages : (advantages ? [advantages] : []);
    }
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = parseInt(order);
    if (percentage !== undefined) updateData.percentage = parseFloat(percentage);

    await membership.update(updateData);

    res.json({ membership });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Membership with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Delete membership
exports.deleteMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const membership = await Membership.findByPk(id);

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    // Soft delete by setting isActive to false
    await membership.update({ isActive: false });
    res.json({ message: 'Membership deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get active memberships (for public/journalist use)
exports.getActiveMemberships = async (req, res) => {
  try {
    const memberships = await Membership.findAll({
      where: { isActive: true },
      order: [['order', 'ASC'], ['price', 'ASC']],
      attributes: ['id', 'name', 'price', 'maxPosts', 'advantages', 'description', 'order']
    });

    res.json({ memberships });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get current user's membership info
exports.getUserMembership = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      attributes: ['id', 'role', 'membership_type', 'subscriptionStartDate', 'subscriptionEndDate', 'publishedFileCount']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get membership details
    let membership = null;
    if (user.membership_type) {
      membership = await Membership.findByPk(user.membership_type);
    } else {
      // Default to FREE membership if not set
      membership = await Membership.findByPk(2); // FREE membership
    }

    // If user doesn't have membership_type set but is a journalist, set default FREE membership
    const now = new Date();
    if (!user.membership_type && user.role === 'journalist') {
      const oneYearLater = new Date(now);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      
      await user.update({
        membership_type: 2, // FREE membership
        subscriptionStartDate: user.subscriptionStartDate || now,
        subscriptionEndDate: user.subscriptionEndDate || oneYearLater
      });
      
      // Reload user to get updated values
      await user.reload();
    }
    
    // If user doesn't have subscription dates but has membership, set default dates (1 year from now)
    if (membership && !user.subscriptionStartDate && !user.subscriptionEndDate) {
      const oneYearLater = new Date(now);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      
      await user.update({
        subscriptionStartDate: now,
        subscriptionEndDate: oneYearLater
      });
      
      // Reload user to get updated values
      await user.reload();
    }

    // Check if subscription is active
    const isSubscriptionActive = user.subscriptionEndDate && new Date(user.subscriptionEndDate) > now;

    // Get current published count
    const publishedCount = await Product.count({
      where: {
        authorId: userId,
        status: 'published',
        isActive: true
      }
    });

    // Check if user can post more
    const maxPosts = membership ? membership.maxPosts : 100;
    const canPost = isSubscriptionActive && publishedCount < maxPosts;
    const remainingPosts = Math.max(0, maxPosts - publishedCount);

    res.json({
      membership: membership ? membership.toJSON() : null,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
      isSubscriptionActive,
      publishedCount,
      maxPosts,
      remainingPosts,
      canPost
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if user can post (for validation before product creation)
exports.canUserPost = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    if (!user || user.role !== 'journalist') {
      return { canPost: false, reason: 'User is not a journalist' };
    }

    // Check subscription
    const now = new Date();
    if (!user.subscriptionEndDate || new Date(user.subscriptionEndDate) <= now) {
      return { canPost: false, reason: 'Subscription has expired. Please renew your membership.' };
    }

    // Get membership
    let membership = null;
    if (user.membership_type) {
      membership = await Membership.findByPk(user.membership_type);
    } else {
      membership = await Membership.findByPk(2); // Default to FREE
    }

    if (!membership) {
      return { canPost: false, reason: 'Membership not found' };
    }

    // Check published count
    const publishedCount = await Product.count({
      where: {
        authorId: userId,
        status: 'published',
        isActive: true
      }
    });

    if (publishedCount >= membership.maxPosts) {
      return { 
        canPost: false, 
        reason: `You have reached the maximum number of posts (${membership.maxPosts}) for your current membership. Please upgrade to post more.`,
        publishedCount,
        maxPosts: membership.maxPosts
      };
    }

    return { 
      canPost: true, 
      publishedCount, 
      maxPosts: membership.maxPosts,
      remainingPosts: membership.maxPosts - publishedCount
    };
  } catch (error) {
    console.error('Error checking if user can post:', error);
    return { canPost: false, reason: 'Error checking posting limits' };
  }
};

// Update user subscription dates (admin only)
exports.updateUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const { subscriptionStartDate, subscriptionEndDate, membership_type } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {};
    if (subscriptionStartDate !== undefined) {
      updateData.subscriptionStartDate = subscriptionStartDate ? new Date(subscriptionStartDate) : null;
    }
    if (subscriptionEndDate !== undefined) {
      updateData.subscriptionEndDate = subscriptionEndDate ? new Date(subscriptionEndDate) : null;
    }
    if (membership_type !== undefined) {
      updateData.membership_type = membership_type;
    }

    await user.update(updateData);

    // Get updated membership info
    let membership = null;
    if (user.membership_type) {
      membership = await Membership.findByPk(user.membership_type);
    }

    res.json({
      user: {
        id: user.id,
        membership_type: user.membership_type,
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate
      },
      membership: membership ? membership.toJSON() : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

