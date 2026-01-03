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

    // Get user to check wallet balance
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' });
    }

    const requestedAmount = parseFloat(amount);
    const currentIncome = parseFloat(user.income || 0);

    // Calculate total amount in pending and approved requests
    const existingRequests = await WithdrawalRequest.findAll({
      where: {
        userId,
        status: { [Op.in]: ['pending', 'approved'] }
      }
    });

    const totalPendingAmount = existingRequests.reduce((sum, req) => {
      return sum + parseFloat(req.amount || 0);
    }, 0);

    // Check if user has enough balance (current income - pending requests - new request amount)
    const availableBalance = currentIncome - totalPendingAmount;
    
    if (requestedAmount > availableBalance) {
      return res.status(400).json({ 
        error: `Үлдэгдэл хүрэлцэхгүй байна. Боломжтой үлдэгдэл: ${availableBalance.toFixed(2)}₮, Хүсэлтийн дүн: ${requestedAmount.toFixed(2)}₮` 
      });
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

    // Get the user to check/update their amount
    const user = await User.findByPk(request.userId);
    if (!user) {
      return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' });
    }

    const withdrawalAmount = parseFloat(request.amount);

    // If status is 'approved', deduct amount from user's amount
    if (status === 'approved') {
      // Reload user to get latest amount value
      await user.reload();
      
      // Use income field as the amount field (since User model has 'income' not 'amount')
      const currentAmount = parseFloat(user.income || 0);
      
      console.log(`💰 Processing withdrawal deduction: User ${user.id} (${user.username}), Current amount: ${currentAmount}₮, Withdrawal amount: ${withdrawalAmount}₮`);
      
      // Check if user has sufficient balance
      if (currentAmount < withdrawalAmount) {
        console.error(`❌ Insufficient balance: User ${user.id} has ${currentAmount}₮ but needs ${withdrawalAmount}₮`);
        return res.status(400).json({ 
          error: `Хэрэглэгчийн үлдэгдэл хүрэлцэхгүй байна. Одоогийн үлдэгдэл: ${currentAmount.toFixed(2)}₮, Хүсэлтийн дүн: ${withdrawalAmount.toFixed(2)}₮` 
        });
      }

      // Use Sequelize's decrement method for atomic operation
      await user.decrement('income', { by: withdrawalAmount });
      
      // Reload to verify the update
      await user.reload();
      const newAmount = parseFloat(user.income || 0);
      
      console.log(`✅ Deducted ${withdrawalAmount}₮ from user ${user.id} (${user.username}). Previous amount: ${currentAmount}₮, New amount: ${newAmount}₮`);
    }

    // Update request
    request.status = status;
    request.adminNotes = adminNotes || request.adminNotes;
    request.processedBy = adminId;
    request.processedAt = new Date();
    await request.save();

    // Reload user to get updated amount
    await user.reload();

    const updatedRequest = await WithdrawalRequest.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'fullName', 'income']
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

