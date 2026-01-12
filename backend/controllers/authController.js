const jwt = require('jsonwebtoken');
const { User } = require('../models');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    // Check if user exists
    const { Op } = require('sequelize');
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role: role || 'viewer'
    });

    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        isSuperAdmin: user.isSuperAdmin || false,
        privacyAccepted: user.privacyAccepted || false,
        termsAccepted: user.termsAccepted || false
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        isSuperAdmin: user.isSuperAdmin || false,
        privacyAccepted: user.privacyAccepted || false,
        termsAccepted: user.termsAccepted || false
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function to calculate user income from completed orders
async function calculateUserIncome(userId) {
  const { Order, Product, sequelize } = require('../models');
  const { QueryTypes } = require('sequelize');
  
  // Use raw query to calculate income from completed orders
  // Sum amounts from distinct orders (group by order id to avoid duplicates)
  const result = await sequelize.query(
    `SELECT COALESCE(SUM(order_amounts.amount), 0) as total
     FROM (
       SELECT DISTINCT o.id, o.amount
       FROM orders o
       INNER JOIN products p ON o."productId" = p.id
       WHERE o.status = 'completed'
       AND p."authorId" = :userId
       AND o."productId" IS NOT NULL
       AND p.id IS NOT NULL
     ) as order_amounts`,
    {
      replacements: { userId },
      type: QueryTypes.SELECT
    }
  );
  
  const calculatedIncome = parseFloat(result[0]?.total || 0);
  
  // Debug logging to help identify discrepancies
  if (process.env.NODE_ENV === 'development') {
    const debugInfo = await sequelize.query(
      `SELECT 
         COUNT(DISTINCT o.id) as distinct_order_count,
         COUNT(*) as total_rows,
         SUM(o.amount) as sum_all,
         STRING_AGG(DISTINCT o.id::text, ', ') as order_ids
       FROM orders o
       INNER JOIN products p ON o."productId" = p.id
       WHERE o.status = 'completed'
       AND p."authorId" = :userId`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT
      }
    );
    console.log(`[Income Calculation Debug] User ${userId}:`, {
      calculatedIncome,
      distinctOrderCount: debugInfo[0]?.distinct_order_count,
      totalRows: debugInfo[0]?.total_rows,
      sumAll: parseFloat(debugInfo[0]?.sum_all || 0),
      orderIds: debugInfo[0]?.order_ids
    });
  }
  
  return calculatedIncome;
}

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = user.toJSON();
    // Return the income value directly from the users table
    userData.income = parseFloat(user.income || 0);
    userData.privacyAccepted = user.privacyAccepted || false;
    userData.termsAccepted = user.termsAccepted || false;
    console.log(userData);
    res.json({ user: userData });
  } catch (error) {
    console.error('[getProfile Error]', error);
    res.status(500).json({ error: error.message });
  }
};

// Accept privacy policy
exports.acceptPrivacyPolicy = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.privacyAccepted = true;
    await user.save();

    res.json({
      message: 'Privacy policy accepted successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        isSuperAdmin: user.isSuperAdmin || false,
        privacyAccepted: user.privacyAccepted
      }
    });
  } catch (error) {
    console.error('[acceptPrivacyPolicy Error]', error);
    res.status(500).json({ error: error.message });
  }
};

// Accept terms and conditions
exports.acceptTerms = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.termsAccepted = true;
    await user.save();

    res.json({
      message: 'Terms and conditions accepted successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        isSuperAdmin: user.isSuperAdmin || false,
        termsAccepted: user.termsAccepted
      }
    });
  } catch (error) {
    console.error('[acceptTerms Error]', error);
    res.status(500).json({ error: error.message });
  }
};

// Google OAuth callback handler
exports.googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
    }

    const user = req.user;
    const token = generateToken(user.id);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatar: user.avatar,
      isSuperAdmin: user.isSuperAdmin || false,
      privacyAccepted: user.privacyAccepted || false,
      termsAccepted: user.termsAccepted || false
    }))}`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=server_error`);
  }
};

// Facebook OAuth callback handler
exports.facebookCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
    }

    const user = req.user;
    const token = generateToken(user.id);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatar: user.avatar,
      isSuperAdmin: user.isSuperAdmin || false,
      privacyAccepted: user.privacyAccepted || false,
      termsAccepted: user.termsAccepted || false
    }))}`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=server_error`);
  }
};

// Update user profile (avatar and phone)
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {};

    // Handle phone number update
    if (req.body.phone !== undefined) {
      updateData.phone = req.body.phone;
    }

    // Handle avatar image upload
    if (req.file) {
      try {
        // Upload image to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'tbarimt/avatars',
              use_filename: true,
              unique_filename: true,
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
        });

        updateData.avatar = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Error uploading avatar to Cloudinary:', uploadError);
        return res.status(500).json({ error: 'Failed to upload avatar image' });
      }
    }

    // Update user
    await user.update(updateData);

    const userData = user.toJSON();
    delete userData.password;
    userData.income = parseFloat(user.income || 0);
    userData.privacyAccepted = user.privacyAccepted || false;
    userData.termsAccepted = user.termsAccepted || false;

    res.json({
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('[updateProfile Error]', error);
    res.status(500).json({ error: error.message });
  }
};

