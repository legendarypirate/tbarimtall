const { CopyrightReport, Product, User } = require('../models');
const { Op } = require('sequelize');

// Create copyright report (public - authenticated or non-authenticated)
exports.createCopyrightReport = async (req, res) => {
  try {
    const { productId, comment, phone } = req.body;
    const userId = req.user ? req.user.id : null;

    // Validation
    if (!productId) {
      return res.status(400).json({ error: 'Бүтээгдэхүүний ID шаардлагатай' });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: 'Тайлбар шаардлагатай' });
    }

    // Check if product exists - handle both UUID and integer ID
    let product;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(productId)) {
      // If it's a UUID, find by UUID
      product = await Product.findOne({ where: { uuid: productId } });
    } else {
      // Otherwise, try to find by integer ID
      const numericId = parseInt(productId);
      if (isNaN(numericId)) {
        return res.status(400).json({ error: 'Бүтээгдэхүүний ID буруу байна' });
      }
      product = await Product.findByPk(numericId);
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Бүтээгдэхүүн олдсонгүй' });
    }
    
    // Use the integer ID for the report
    const finalProductId = product.id;

    // Get user email if authenticated
    let email = null;
    if (userId) {
      const user = await User.findByPk(userId);
      if (user) {
        email = user.email;
      }
    }

    // Validation: Phone is required for both authenticated and non-authenticated users
    if (!phone || phone.trim() === '') {
      return res.status(400).json({ error: 'Утасны дугаар шаардлагатай' });
    }

    const report = await CopyrightReport.create({
      productId: finalProductId,
      userId,
      email,
      phone: phone.trim(),
      comment: comment.trim(),
      status: 'pending'
    });

    const reportWithDetails = await CopyrightReport.findByPk(report.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'uuid', 'title']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullName'],
          required: false
        }
      ]
    });

    res.status(201).json({
      message: 'Мэдэгдэл амжилттай илгээгдлээ',
      report: reportWithDetails
    });
  } catch (error) {
    console.error('Error creating copyright report:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all copyright reports (Admin only)
exports.getAllCopyrightReports = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const reports = await CopyrightReport.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'uuid', 'title', 'isActive']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullName'],
          required: false
        },
        {
          model: User,
          as: 'processedByUser',
          attributes: ['id', 'username', 'email', 'fullName'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ reports });
  } catch (error) {
    console.error('Error fetching copyright reports:', error);
    res.status(500).json({ error: error.message });
  }
};

// Approve copyright report (Admin only)
exports.approveCopyrightReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComment } = req.body;
    const adminId = req.user.id;

    if (!adminComment || adminComment.trim() === '') {
      return res.status(400).json({ error: 'Тайлбар шаардлагатай' });
    }

    const report = await CopyrightReport.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product'
        }
      ]
    });

    if (!report) {
      return res.status(404).json({ error: 'Мэдэгдэл олдсонгүй' });
    }

    if (report.status !== 'pending') {
      return res.status(400).json({ error: 'Энэ мэдэгдэл аль хэдийн боловсруулсан байна' });
    }

    // Update report status
    report.status = 'approved';
    report.adminComment = adminComment.trim();
    report.processedBy = adminId;
    report.processedAt = new Date();
    await report.save();

    // Set product isActive to false
    if (report.product) {
      report.product.isActive = false;
      await report.product.save();
    }

    const updatedReport = await CopyrightReport.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'uuid', 'title', 'isActive']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullName'],
          required: false
        },
        {
          model: User,
          as: 'processedByUser',
          attributes: ['id', 'username', 'email', 'fullName'],
          required: false
        }
      ]
    });

    res.json({
      message: 'Мэдэгдэл баталгаажлаа',
      report: updatedReport
    });
  } catch (error) {
    console.error('Error approving copyright report:', error);
    res.status(500).json({ error: error.message });
  }
};

// Reject copyright report (Admin only)
exports.rejectCopyrightReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComment } = req.body;
    const adminId = req.user.id;

    if (!adminComment || adminComment.trim() === '') {
      return res.status(400).json({ error: 'Тайлбар шаардлагатай' });
    }

    const report = await CopyrightReport.findByPk(id);

    if (!report) {
      return res.status(404).json({ error: 'Мэдэгдэл олдсонгүй' });
    }

    if (report.status !== 'pending') {
      return res.status(400).json({ error: 'Энэ мэдэгдэл аль хэдийн боловсруулсан байна' });
    }

    // Update report status
    report.status = 'rejected';
    report.adminComment = adminComment.trim();
    report.processedBy = adminId;
    report.processedAt = new Date();
    await report.save();

    const updatedReport = await CopyrightReport.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'uuid', 'title', 'isActive']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullName'],
          required: false
        },
        {
          model: User,
          as: 'processedByUser',
          attributes: ['id', 'username', 'email', 'fullName'],
          required: false
        }
      ]
    });

    res.json({
      message: 'Мэдэгдэл татгалзлаа',
      report: updatedReport
    });
  } catch (error) {
    console.error('Error rejecting copyright report:', error);
    res.status(500).json({ error: error.message });
  }
};

