const { Order, User, Product, DownloadToken } = require('../models');
const axios = require('axios');

// QPay credentials - should be in environment variables
const QPAY_LOGIN = process.env.QPAY_LOGIN || 'KONO';
const QPAY_PASSWORD = process.env.QPAY_PASSWORD || '8zcSjp5u';
const QPAY_BASE_URL = 'https://merchant.qpay.mn/v2';

// Get QPay access token
async function getQPayToken() {
  try {
    const response = await axios.post(
      `${QPAY_BASE_URL}/auth/token`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${QPAY_LOGIN}:${QPAY_PASSWORD}`).toString('base64')}`
        }
      }
    );

    if (response.data && response.data.access_token) {
      return response.data.access_token;
    }
    throw new Error('Failed to get QPay token');
  } catch (error) {
    console.error('QPay token error:', error.response?.data || error.message);
    throw new Error(`QPay authentication failed: ${error.response?.data?.message || error.message}`);
  }
}

// Create QPay invoice
exports.createInvoice = async (req, res) => {
  try {
    const { productId, amount, description, userId } = req.body;
    // userId comes from request body (optional)
    const finalUserId = userId;

    if (!productId || !amount) {
      return res.status(400).json({ error: 'Product ID and amount are required' });
    }

    // Validate product exists and get it
    // productId from request can be UUID (for frontend) or integer ID
    let product;
    
    // Check if it's a UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(productId)) {
      // Find product by UUID (for frontend display)
      product = await Product.findOne({
        where: { uuid: productId }
      });
    } else {
      // Try as integer ID
      const intId = parseInt(productId);
      if (isNaN(intId)) {
        return res.status(400).json({ error: 'Invalid product ID format.' });
      }
      product = await Product.findByPk(intId);
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.isActive) {
      return res.status(400).json({ error: 'Product is not available' });
    }

    // Use the product's integer ID (Order.productId is INTEGER, references products.id)
    // Reload product fresh to ensure we get the correct integer ID (not UUID)
    // This prevents issues where product.id might be a UUID from toJSON() or other transformations
    const freshProduct = await Product.findByPk(product.id, {
      attributes: ['id'],
      raw: true // Get raw data to avoid any getter/setter issues
    });

    if (!freshProduct) {
      return res.status(404).json({ error: 'Product not found after validation' });
    }

    // Ensure it's explicitly an integer
    const validProductId = parseInt(freshProduct.id);
    if (isNaN(validProductId) || validProductId <= 0) {
      console.error('Invalid product ID:', {
        originalId: product.id,
        freshId: freshProduct.id,
        parsed: validProductId,
        type: typeof freshProduct.id
      });
      return res.status(400).json({ 
        error: 'Invalid product ID',
        details: `Expected integer, got: ${freshProduct.id} (type: ${typeof freshProduct.id})`
      });
    }

    // Get QPay token
    const token = await getQPayToken();

    // Generate unique invoice number
    const senderInvoiceNo = `TBA_${Date.now()}${finalUserId ? `_${finalUserId}` : ''}`;
    const invoiceCode = process.env.QPAY_INVOICE_CODE || 'KONO_INVOICE';
    const invoiceReceiverCode = process.env.QPAY_RECEIVER_CODE || 'DEFAULT_COM_ID';

    // Create invoice in QPay
    const invoiceResponse = await axios.post(
      `${QPAY_BASE_URL}/invoice`,
      {
        invoice_code: invoiceCode,
        sender_invoice_no: senderInvoiceNo,
        invoice_receiver_code: invoiceReceiverCode,
        invoice_description: description || `Tbarimt.mn захиалга - ${senderInvoiceNo}`,
        amount: parseFloat(amount)
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!invoiceResponse.data || !invoiceResponse.data.invoice_id) {
      throw new Error('Failed to create QPay invoice');
    }

    const invoiceData = invoiceResponse.data;

    // Create order in database (userId is optional - can be null for guest orders)
    // productId MUST be INTEGER (Order.productId is INTEGER, references products.id)
    // Double-check productId is integer before creating
    if (typeof validProductId !== 'number' || isNaN(validProductId) || validProductId <= 0) {
      console.error('Invalid productId before Order.create:', {
        validProductId,
        type: typeof validProductId,
        originalProductId: productId,
        productIdFromProduct: product.id
      });
      return res.status(400).json({ 
        error: 'Invalid product ID format',
        details: `Expected positive integer, got: ${validProductId}`
      });
    }

    const order = await Order.create({
      userId: finalUserId ? parseInt(finalUserId) : null,
      productId: validProductId, // Explicitly integer ID from Product.id
      amount: parseFloat(amount),
      paymentMethod: 'qpay',
      status: 'pending',
      invoiceId: invoiceData.invoice_id,
      qrImage: invoiceData.qr_image || null,
      qrText: invoiceData.qr_text || null
    });

    // Get order with relations - include UUID for frontend display
    const orderWithRelations = await Order.findByPk(order.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email', 'fullName'] },
        { model: Product, as: 'product', attributes: ['id', 'uuid', 'title', 'price'] }
      ]
    });

    // Format response - use integer IDs in order, but include UUID in product details
    const responseOrder = {
      ...orderWithRelations.toJSON(),
      product: orderWithRelations.product ? {
        ...orderWithRelations.product.toJSON(),
        // Keep both id (integer) and uuid for frontend compatibility
        id: orderWithRelations.product.id, // Integer ID
        uuid: orderWithRelations.product.uuid // UUID for frontend
      } : null
    };

    res.json({
      success: true,
      order: responseOrder,
      invoice: {
        invoice_id: invoiceData.invoice_id,
        qr_image: invoiceData.qr_image,
        qr_text: invoiceData.qr_text,
        qr_code: invoiceData.qr_code,
        urls: invoiceData.urls
      }
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      error: 'Failed to create invoice',
      message: error.response?.data?.message || error.message
    });
  }
};

// Check payment status
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Find order by invoice ID (no userId filter - anyone can check by invoice ID)
    // Explicitly select productId to ensure it's an integer, not affected by association
    const order = await Order.findOne({
      where: { invoiceId },
      attributes: { include: ['id', 'userId', 'productId', 'amount', 'paymentMethod', 'status', 'transactionId', 'invoiceId', 'qrImage', 'qrText', 'createdAt', 'updatedAt'] },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email', 'fullName'] },
        { model: Product, as: 'product', attributes: ['id', 'uuid', 'title', 'price'] }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get QPay token
    const token = await getQPayToken();

    // Check payment status in QPay
    const checkResponse = await axios.post(
      `${QPAY_BASE_URL}/payment/check`,
      {
        object_type: 'INVOICE',
        object_id: invoiceId,
        offset: {
          page_number: 1,
          page_limit: 100
        }
      },
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const paymentData = checkResponse.data;
    let paymentStatus = 'PENDING';
    let isPaid = false;

    if (paymentData.rows && paymentData.rows.length > 0) {
      const payment = paymentData.rows[0];
      paymentStatus = payment.payment_status || 'PENDING';
      isPaid = paymentStatus === 'PAID';
    }

    // Update order status if paid and generate download token
    let downloadToken = null;
    if (isPaid && order.status !== 'completed') {
      await order.update({ status: 'completed' });
      order.status = 'completed';
      
      // Generate secure download token and get it immediately
      try {
        const generatedToken = await generateDownloadToken(order);
        if (generatedToken && generatedToken.isValid()) {
          downloadToken = {
            token: generatedToken.token,
            expiresAt: generatedToken.expiresAt
          };
          console.log(`Download token generated successfully for order ${order.id}`);
        } else {
          console.warn(`Generated token is invalid for order ${order.id}`);
        }
      } catch (tokenError) {
        console.error(`Error generating download token for order ${order.id}:`, tokenError);
        // Continue without token - fallback will try to find existing token
      }
    }

    // Get download token if order is completed (fallback if not generated above)
    if (!downloadToken && order.status === 'completed') {
      const token = await DownloadToken.findOne({
        where: { 
          orderId: order.id,
          isUsed: false,
          expiresAt: {
            [require('sequelize').Op.gt]: new Date()
          }
        },
        order: [['createdAt', 'DESC']]
      });
      
      if (token && token.isValid()) {
        downloadToken = {
          token: token.token,
          expiresAt: token.expiresAt
        };
      }
    }

    // Sanitize order data to ensure correct types
    const orderData = order.toJSON ? order.toJSON() : order;
    // Ensure productId is an integer (not UUID from association)
    if (orderData.productId && typeof orderData.productId === 'string') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(orderData.productId)) {
        orderData.productId = parseInt(orderData.productId);
      } else {
        // If it's a UUID, get the integer ID from the product association
        if (orderData.product && orderData.product.id) {
          orderData.productId = parseInt(orderData.product.id);
        }
      }
    } else if (orderData.productId) {
      orderData.productId = parseInt(orderData.productId);
    }

    res.json({
      success: true,
      order: orderData,
      payment: {
        status: paymentStatus,
        isPaid,
        data: paymentData
      },
      downloadToken
    });
  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({
      error: 'Failed to check payment status',
      message: error.response?.data?.message || error.message
    });
  }
};

// Webhook endpoint for QPay payment notifications
exports.paymentWebhook = async (req, res) => {
  try {
    const { object_type, object_id, payment_status } = req.body;

    if (object_type !== 'INVOICE' || !object_id) {
      return res.status(400).json({ error: 'Invalid webhook data' });
    }

    // Find order by invoice ID
    const order = await Order.findOne({
      where: { invoiceId: object_id },
      include: [
        { model: User, as: 'user' },
        { model: Product, as: 'product' }
      ]
    });

    if (!order) {
      console.warn(`Order not found for invoice ID: ${object_id}`);
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order status based on payment status
    if (payment_status === 'PAID' && order.status !== 'completed') {
      await order.update({ status: 'completed' });
      console.log(`Order ${order.id} marked as completed via webhook`);
      
      // Generate secure download token
      await generateDownloadToken(order);
    } else if (payment_status === 'CANCELLED' && order.status !== 'cancelled') {
      await order.update({ status: 'cancelled' });
      console.log(`Order ${order.id} marked as cancelled via webhook`);
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully',
      orderId: order.id,
      status: order.status
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      error: 'Failed to process webhook',
      message: error.message
    });
  }
};

// Helper function to generate download token for completed order
async function generateDownloadToken(order) {
  try {
    // Check if a valid token already exists
    const existingToken = await DownloadToken.findOne({
      where: {
        orderId: order.id,
        isUsed: false,
        expiresAt: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (existingToken) {
      return existingToken;
    }

    // Generate new token
    const token = DownloadToken.generateToken();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiration

    // Reload order fresh from database to ensure we get the correct integer productId
    // This prevents issues where order.productId might be a UUID from associations
    const freshOrder = await Order.findByPk(order.id, {
      attributes: ['id', 'productId', 'userId'],
      raw: true // Get raw data to avoid any getter/setter issues
    });

    if (!freshOrder) {
      throw new Error(`Order ${order.id} not found`);
    }

    // Ensure productId is explicitly an integer (Order.productId is INTEGER)
    // Handle both string and number types
    let productIdInt;
    if (typeof freshOrder.productId === 'string') {
      // Check if it's a UUID (shouldn't happen after migration, but handle it)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(freshOrder.productId)) {
        // If it's a UUID, we need to find the product by UUID and get its integer ID
        const product = await Product.findOne({
          where: { uuid: freshOrder.productId },
          attributes: ['id'],
          raw: true
        });
        if (!product) {
          throw new Error(`Product with UUID ${freshOrder.productId} not found`);
        }
        productIdInt = parseInt(product.id);
      } else {
        productIdInt = parseInt(freshOrder.productId);
      }
    } else {
      productIdInt = parseInt(freshOrder.productId);
    }
    
    if (isNaN(productIdInt) || productIdInt <= 0) {
      throw new Error(`Invalid productId in order: ${freshOrder.productId} (type: ${typeof freshOrder.productId})`);
    }

    const downloadToken = await DownloadToken.create({
      token,
      orderId: order.id,
      productId: productIdInt, // Explicitly integer
      userId: freshOrder.userId ? parseInt(freshOrder.userId) : null,
      expiresAt
    });

    console.log(`Download token generated for order ${order.id}: ${token}`);
    return downloadToken;
  } catch (error) {
    console.error('Error generating download token:', error);
    throw error;
  }
}

// Get order by invoice ID (for frontend polling)
exports.getOrderByInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Find order by invoice ID (no userId filter - anyone can get by invoice ID)
    // Explicitly select productId to ensure it's an integer, not affected by association
    const order = await Order.findOne({
      where: { invoiceId },
      attributes: { include: ['id', 'userId', 'productId', 'amount', 'paymentMethod', 'status', 'transactionId', 'invoiceId', 'qrImage', 'qrText', 'createdAt', 'updatedAt'] },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email', 'fullName'] },
        { model: Product, as: 'product', attributes: ['id', 'uuid', 'title', 'price'] }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get download token if order is completed
    let downloadToken = null;
    if (order.status === 'completed') {
      const token = await DownloadToken.findOne({
        where: { 
          orderId: order.id,
          isUsed: false
        },
        order: [['createdAt', 'DESC']]
      });
      
      if (token && token.isValid()) {
        downloadToken = {
          token: token.token,
          expiresAt: token.expiresAt
        };
      } else if (!token) {
        // Generate token if order is completed but no token exists
        const newToken = await generateDownloadToken(order);
        downloadToken = {
          token: newToken.token,
          expiresAt: newToken.expiresAt
        };
      }
    }

    // Sanitize order data to ensure correct types
    const orderData = order.toJSON ? order.toJSON() : order;
    // Ensure productId is an integer (not UUID from association)
    if (orderData.productId && typeof orderData.productId === 'string') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(orderData.productId)) {
        orderData.productId = parseInt(orderData.productId);
      } else {
        // If it's a UUID, get the integer ID from the product association
        if (orderData.product && orderData.product.id) {
          orderData.productId = parseInt(orderData.product.id);
        }
      }
    } else if (orderData.productId) {
      orderData.productId = parseInt(orderData.productId);
    }

    res.json({
      success: true,
      order: orderData,
      downloadToken
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      error: 'Failed to get order',
      message: error.message
    });
  }
};

