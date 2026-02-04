const { SimilarFileRequest, User, Product } = require('../models');
const { Op } = require('sequelize');

// Create similar file request (User)
exports.createSimilarFileRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, description } = req.body;

    // Validation
    if (!productId) {
      return res.status(400).json({ error: 'Барааны ID шаардлагатай' });
    }

    // Get product to find author
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: 'Бараа олдсонгүй' });
    }

    if (!product.authorId) {
      return res.status(400).json({ error: 'Барааны зохиогч олдсонгүй' });
    }

    // Check if user already has a pending request for this product
    const existingRequest = await SimilarFileRequest.findOne({
      where: {
        userId,
        productId,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Та энэ бараанд ижил төстэй файл захиалсан байна' });
    }

    const request = await SimilarFileRequest.create({
      userId,
      productId,
      authorId: product.authorId,
      description: description || null,
      status: 'pending'
    });

    const requestWithDetails = await SimilarFileRequest.findByPk(request.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullName']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'price', 'image']
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'fullName', 'email']
        }
      ]
    });

    res.status(201).json({
      message: 'Хүсэлт амжилттай илгээгдлээ',
      request: requestWithDetails
    });
  } catch (error) {
    console.error('Error creating similar file request:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get user's similar file requests (User)
exports.getUserSimilarFileRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const requests = await SimilarFileRequest.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'price', 'image', 'uuid']
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'fullName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching similar file requests:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all similar file requests (Admin)
exports.getAllSimilarFileRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { description: { [Op.iLike]: `%${search}%` } },
        { adminNotes: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await SimilarFileRequest.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullName', 'phone']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'price', 'image', 'uuid']
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'fullName', 'email']
        },
        {
          model: User,
          as: 'processedByUser',
          attributes: ['id', 'username', 'fullName'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      requests: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching similar file requests:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get similar file request by ID (Admin)
exports.getSimilarFileRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await SimilarFileRequest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullName', 'phone']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'price', 'image', 'uuid', 'description']
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'fullName', 'email']
        },
        {
          model: User,
          as: 'processedByUser',
          attributes: ['id', 'username', 'fullName'],
          required: false
        }
      ]
    });

    if (!request) {
      return res.status(404).json({ error: 'Хүсэлт олдсонгүй' });
    }

    res.json({ request });
  } catch (error) {
    console.error('Error fetching similar file request:', error);
    res.status(500).json({ error: error.message });
  }
};

// Approve similar file request (Admin)
exports.approveSimilarFileRequest = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { adminNotes } = req.body;

    const request = await SimilarFileRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ error: 'Хүсэлт олдсонгүй' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Зөвхөн хүлээгдэж буй хүсэлтийг баталгаажуулж болно' });
    }

    await request.update({
      status: 'approved',
      adminNotes: adminNotes || null,
      processedAt: new Date(),
      processedBy: adminId
    });

    const updatedRequest = await SimilarFileRequest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullName']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'price', 'image']
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'fullName', 'email']
        }
      ]
    });

    res.json({
      message: 'Хүсэлт баталгаажуулагдлаа',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error approving similar file request:', error);
    res.status(500).json({ error: error.message });
  }
};

// Reject similar file request (Admin)
exports.rejectSimilarFileRequest = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { adminNotes } = req.body;

    const request = await SimilarFileRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ error: 'Хүсэлт олдсонгүй' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Зөвхөн хүлээгдэж буй хүсэлтийг татгалзаж болно' });
    }

    await request.update({
      status: 'rejected',
      adminNotes: adminNotes || null,
      processedAt: new Date(),
      processedBy: adminId
    });

    const updatedRequest = await SimilarFileRequest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullName']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'price', 'image']
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'fullName', 'email']
        }
      ]
    });

    res.json({
      message: 'Хүсэлт татгалзсан',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error rejecting similar file request:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get approved requests for journalist (Journalist)
exports.getJournalistSimilarFileRequests = async (req, res) => {
  try {
    const journalistId = req.user.id;
    const { status = 'approved' } = req.query;

    const where = {
      authorId: journalistId,
      status: status === 'all' ? { [Op.in]: ['approved', 'completed'] } : status
    };

    const requests = await SimilarFileRequest.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullName', 'phone']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'price', 'image', 'uuid', 'description']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching journalist similar file requests:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mark request as completed (Journalist)
exports.completeSimilarFileRequest = async (req, res) => {
  try {
    const journalistId = req.user.id;
    const { id } = req.params;
    const { journalistNotes } = req.body;

    const request = await SimilarFileRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ error: 'Хүсэлт олдсонгүй' });
    }

    if (request.authorId !== journalistId) {
      return res.status(403).json({ error: 'Та энэ хүсэлтийг дуусгах эрхгүй байна' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ error: 'Зөвхөн баталгаажуулсан хүсэлтийг дуусгаж болно' });
    }

    await request.update({
      status: 'completed',
      journalistNotes: journalistNotes || null
    });

    const updatedRequest = await SimilarFileRequest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullName']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title', 'price', 'image']
        }
      ]
    });

    res.json({
      message: 'Хүсэлт дууссан гэж тэмдэглэгдлээ',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error completing similar file request:', error);
    res.status(500).json({ error: error.message });
  }
};

