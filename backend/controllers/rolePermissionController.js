const { RolePermission, User } = require('../models');
const { Op } = require('sequelize');

// Get all role permissions
exports.getAllRolePermissions = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (search) {
      where[Op.or] = [
        { roleName: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await RolePermission.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      rolePermissions: rows,
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

// Get role permission by ID
exports.getRolePermissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const rolePermission = await RolePermission.findByPk(id);

    if (!rolePermission) {
      return res.status(404).json({ error: 'Role permission not found' });
    }

    res.json({ rolePermission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create role permission
exports.createRolePermission = async (req, res) => {
  try {
    const { roleName, description, permissions, isActive } = req.body;

    if (!roleName) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    // Check if role name already exists
    const existing = await RolePermission.findOne({
      where: { roleName }
    });

    if (existing) {
      return res.status(400).json({ error: 'Role name already exists' });
    }

    const rolePermission = await RolePermission.create({
      roleName,
      description: description || null,
      permissions: permissions || {},
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({ rolePermission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update role permission
exports.updateRolePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleName, description, permissions, isActive } = req.body;

    const rolePermission = await RolePermission.findByPk(id);

    if (!rolePermission) {
      return res.status(404).json({ error: 'Role permission not found' });
    }

    // Check if role name is being changed and if it already exists
    if (roleName && roleName !== rolePermission.roleName) {
      const existing = await RolePermission.findOne({
        where: { roleName }
      });

      if (existing) {
        return res.status(400).json({ error: 'Role name already exists' });
      }
    }

    // Update fields
    if (roleName !== undefined) rolePermission.roleName = roleName;
    if (description !== undefined) rolePermission.description = description;
    if (permissions !== undefined) rolePermission.permissions = permissions;
    if (isActive !== undefined) rolePermission.isActive = isActive;

    await rolePermission.save();

    res.json({ rolePermission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete role permission
exports.deleteRolePermission = async (req, res) => {
  try {
    const { id } = req.params;

    const rolePermission = await RolePermission.findByPk(id);

    if (!rolePermission) {
      return res.status(404).json({ error: 'Role permission not found' });
    }

    await rolePermission.destroy();

    res.json({ message: 'Role permission deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get users with a specific role permission
exports.getUsersByRole = async (req, res) => {
  try {
    const { roleName } = req.params;
    
    // This would need to be implemented based on how roles are assigned to users
    // For now, we'll return users with admin role
    const users = await User.findAll({
      where: { role: 'admin' },
      attributes: { exclude: ['password'] }
    });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

