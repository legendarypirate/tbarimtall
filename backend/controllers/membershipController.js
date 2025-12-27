const { Membership } = require('../models');
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
    const { name, price, maxPosts, advantages, description, isActive, order } = req.body;

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
      order: order !== undefined ? parseInt(order) : 0
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
    const { name, price, maxPosts, advantages, description, isActive, order } = req.body;

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

