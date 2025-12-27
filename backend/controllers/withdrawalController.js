const { WithdrawalRequest, User } = require('../models');
const { Op } = require('sequelize');

// Create withdrawal request (Journalist)
exports.createWithdrawalRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, bankAccount, bankName, accountHolderName, notes } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Дүн зөв оруулна уу' });
    }

    // Check if user has pending request
    const pendingRequest = await WithdrawalRequest.findOne({
      where: {
        userId,
        status: { [Op.in]: ['pending', 'approved'] }
      }
    });

    if (pendingRequest) {
      return res.status(400).json({ error: 'Та хүлээгдэж буй эсвэл зөвшөөрөгдсөн хүсэлттэй байна' });
    }

    const withdrawalRequest = await WithdrawalRequest.create({
      userId,
      amount: parseFloat(amount),
      bankAccount,
      bankName,
      accountHolderName,
      notes,
      status: 'pending'
    });

    const requestWithUser = await WithdrawalRequest.findByPk(withdrawalRequest.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'fullName']
      }]
    });

    res.status(201).json({
      message: 'Хүсэлт амжилттай илгээгдлээ',
      withdrawalRequest: requestWithUser
    });
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get user's withdrawal requests (Journalist)
exports.getUserWithdrawalRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const requests = await WithdrawalRequest.findAll({
      where,
      include: [{
        model: User,
        as: 'processedByUser',
        attributes: ['id', 'username', 'email', 'fullName']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ withdrawalRequests: requests });
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all withdrawal requests (Admin)
exports.getAllWithdrawalRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }

    let includeOptions = [{
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'email', 'fullName']
    }, {
      model: User,
      as: 'processedByUser',
      attributes: ['id', 'username', 'email', 'fullName'],
      required: false
    }];

    // If search is provided, search in user fields
    if (search) {
      includeOptions[0].where = {
        [Op.or]: [
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { fullName: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const { count, rows } = await WithdrawalRequest.findAndCountAll({
      where,
      include: includeOptions,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      withdrawalRequests: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching all withdrawal requests:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get withdrawal request by ID
exports.getWithdrawalRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await WithdrawalRequest.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'fullName']
      }, {
        model: User,
        as: 'processedByUser',
        attributes: ['id', 'username', 'email', 'fullName'],
        required: false
      }]
    });

    if (!request) {
      return res.status(404).json({ error: 'Хүсэлт олдсонгүй' });
    }

    res.json({ withdrawalRequest: request });
  } catch (error) {
    console.error('Error fetching withdrawal request:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update withdrawal request status (Admin)
exports.updateWithdrawalRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const adminId = req.user.id;

    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Буруу статус' });
    }

    const request = await WithdrawalRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ error: 'Хүсэлт олдсонгүй' });
    }

    // Update request
    request.status = status;
    request.adminNotes = adminNotes || request.adminNotes;
    request.processedBy = adminId;
    request.processedAt = new Date();
    await request.save();

    const updatedRequest = await WithdrawalRequest.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'fullName']
      }, {
        model: User,
        as: 'processedByUser',
        attributes: ['id', 'username', 'email', 'fullName']
      }]
    });

    res.json({
      message: 'Хүсэлт амжилттай шинэчлэгдлээ',
      withdrawalRequest: updatedRequest
    });
  } catch (error) {
    console.error('Error updating withdrawal request:', error);
    res.status(500).json({ error: error.message });
  }
};

