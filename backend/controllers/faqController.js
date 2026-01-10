const { FAQ } = require('../models');

// Get all FAQs (public - for frontend)
exports.getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.findAll({
      where: { isActive: true },
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({ faqs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all FAQs (admin - includes inactive)
exports.getAllFAQsAdmin = async (req, res) => {
  try {
    const faqs = await FAQ.findAll({
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({ faqs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get FAQ by ID
exports.getFAQById = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findByPk(id);

    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.json({ faq });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create FAQ
exports.createFAQ = async (req, res) => {
  try {
    const { question, answer, order, isActive } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    // Validate question and answer structure
    if (typeof question !== 'object' || !question.mn) {
      return res.status(400).json({ error: 'Question must be an object with mn key (required)' });
    }

    if (typeof answer !== 'object' || !answer.mn) {
      return res.status(400).json({ error: 'Answer must be an object with mn key (required)' });
    }

    // Ensure en fields exist (can be empty string)
    if (!question.en) question.en = '';
    if (!answer.en) answer.en = '';

    const faq = await FAQ.create({
      question,
      answer,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({ faq });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update FAQ
exports.updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, order, isActive } = req.body;

    const faq = await FAQ.findByPk(id);

    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    if (question !== undefined) {
      if (typeof question !== 'object' || !question.mn) {
        return res.status(400).json({ error: 'Question must be an object with mn key (required)' });
      }
      // Ensure en field exists (can be empty string)
      if (!question.en) question.en = '';
      faq.question = question;
    }

    if (answer !== undefined) {
      if (typeof answer !== 'object' || !answer.mn) {
        return res.status(400).json({ error: 'Answer must be an object with mn key (required)' });
      }
      // Ensure en field exists (can be empty string)
      if (!answer.en) answer.en = '';
      faq.answer = answer;
    }

    if (order !== undefined) faq.order = order;
    if (isActive !== undefined) faq.isActive = isActive;

    await faq.save();

    res.json({ faq });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete FAQ
exports.deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findByPk(id);

    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    await faq.destroy();

    res.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

