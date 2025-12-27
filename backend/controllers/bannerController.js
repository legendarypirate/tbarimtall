const { Banner } = require('../models');

// Get all banners (public - for product detail page)
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      where: { isActive: true },
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({ banners });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all banners (admin - includes inactive)
exports.getAllBannersAdmin = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({ banners });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get banner by ID
exports.getBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByPk(id);

    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    res.json({ banner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create banner
exports.createBanner = async (req, res) => {
  try {
    const { imageUrl, title, linkUrl, order, isActive } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const banner = await Banner.create({
      imageUrl,
      title: title || null,
      linkUrl: linkUrl || null,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({ banner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update banner
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl, title, linkUrl, order, isActive } = req.body;

    const banner = await Banner.findByPk(id);

    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    if (imageUrl !== undefined) banner.imageUrl = imageUrl;
    if (title !== undefined) banner.title = title;
    if (linkUrl !== undefined) banner.linkUrl = linkUrl;
    if (order !== undefined) banner.order = order;
    if (isActive !== undefined) banner.isActive = isActive;

    await banner.save();

    res.json({ banner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete banner
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByPk(id);

    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    await banner.destroy();

    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

