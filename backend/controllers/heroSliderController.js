const { HeroSlider } = require('../models');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Get all hero sliders (public - for homepage)
exports.getAllHeroSliders = async (req, res) => {
  try {
    const sliders = await HeroSlider.findAll({
      where: { isActive: true },
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({ sliders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all hero sliders (admin - includes inactive)
exports.getAllHeroSlidersAdmin = async (req, res) => {
  try {
    const sliders = await HeroSlider.findAll({
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({ sliders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get hero slider by ID
exports.getHeroSliderById = async (req, res) => {
  try {
    const { id } = req.params;
    const slider = await HeroSlider.findByPk(id);

    if (!slider) {
      return res.status(404).json({ error: 'Hero slider not found' });
    }

    res.json({ slider });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function to upload image to Cloudinary
const uploadImageToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'tbarimt/hero-sliders',
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
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

// Create hero slider
exports.createHeroSlider = async (req, res) => {
  try {
    let imageUrl = req.body.imageUrl;
    
    // If file is uploaded, upload to Cloudinary
    if (req.file) {
      try {
        const cloudinaryResult = await uploadImageToCloudinary(req.file);
        imageUrl = cloudinaryResult.secure_url;
      } catch (uploadError) {
        console.error('Error uploading image to Cloudinary:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image: ' + uploadError.message });
      }
    }

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL or image file is required' });
    }

    const { title, subtitle, order, isActive } = req.body;

    const slider = await HeroSlider.create({
      imageUrl,
      title: title || null,
      subtitle: subtitle || null,
      order: order ? parseInt(order) : 0,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true
    });

    res.status(201).json({ slider });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update hero slider
exports.updateHeroSlider = async (req, res) => {
  try {
    const { id } = req.params;
    const slider = await HeroSlider.findByPk(id);

    if (!slider) {
      return res.status(404).json({ error: 'Hero slider not found' });
    }

    // If new file is uploaded, upload to Cloudinary
    if (req.file) {
      try {
        const cloudinaryResult = await uploadImageToCloudinary(req.file);
        slider.imageUrl = cloudinaryResult.secure_url;
      } catch (uploadError) {
        console.error('Error uploading image to Cloudinary:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image: ' + uploadError.message });
      }
    } else if (req.body.imageUrl !== undefined) {
      slider.imageUrl = req.body.imageUrl;
    }

    const { title, subtitle, order, isActive } = req.body;

    if (title !== undefined) slider.title = title || null;
    if (subtitle !== undefined) slider.subtitle = subtitle || null;
    if (order !== undefined) slider.order = parseInt(order) || 0;
    if (isActive !== undefined) slider.isActive = isActive === 'true' || isActive === true;

    await slider.save();

    res.json({ slider });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete hero slider
exports.deleteHeroSlider = async (req, res) => {
  try {
    const { id } = req.params;
    const slider = await HeroSlider.findByPk(id);

    if (!slider) {
      return res.status(404).json({ error: 'Hero slider not found' });
    }

    await slider.destroy();

    res.json({ message: 'Hero slider deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

