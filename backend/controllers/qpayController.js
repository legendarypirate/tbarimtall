const { Order, User, Product, DownloadToken, Membership } = require('../models');
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
    const { productId, amount, description, userId: bodyUserId } = req.body;
    
    // Priority: 1) Auth token (if user is authenticated), 2) null (guest order)
    // We don't use body userId to prevent unauthorized user ID injection
    // If user is authenticated, their userId from token will be used
    // If not authenticated, userId will be null (guest order)
    let finalUserId = null;
    
    try {
      // Check if there's an auth token in the header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        // JWT token may have userId or id field
        if (decoded && (decoded.userId || decoded.id)) {
          finalUserId = decoded.userId || decoded.id;
          console.log(`Extracted userId ${finalUserId} from auth token`);
        }
      }
    } catch (tokenError) {
      // If token verification fails, userId remains null (guest order)
      console.log('No valid auth token, creating guest order (userId will be null)');
    }
    
    // Note: We ignore bodyUserId for security - only use authenticated userId from token
    // This ensures that:
    // - Guest purchases (no auth) → userId = null ✓
    // - Authenticated purchases → userId = authenticated user's ID from token ✓

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
      
      // Update product income and user income based on membership percentage
      if (order.productId) {
        try {
          const product = await Product.findByPk(order.productId);
          if (product) {
            const orderAmount = parseFloat(order.amount);
            
            // Get author's membership to calculate commission percentage
            let commissionPercentage = 20.00; // Default to 20% for FREE membership
            if (product.authorId) {
              const { User, Membership } = require('../models');
              const author = await User.findByPk(product.authorId);
              if (author) {
                let membership = null;
                if (author.membership_type) {
                  membership = await Membership.findByPk(author.membership_type);
                } else {
                  // Default to FREE membership (id: 2)
                  membership = await Membership.findByPk(2);
                }
                
                if (membership && membership.percentage) {
                  commissionPercentage = parseFloat(membership.percentage);
                }
              }
            }
            
            // Calculate commission points based on membership percentage
            const authorPoints = orderAmount * (commissionPercentage / 100);
            
            // Update product income (full amount for tracking)
            const currentProductIncome = parseFloat(product.income || 0);
            await product.update({ 
              income: currentProductIncome + orderAmount 
            });
            console.log(`Product ${product.id} income updated: ${currentProductIncome} + ${orderAmount} = ${currentProductIncome + orderAmount}`);
            
            // Update user (author) points (percentage-based commission)
            if (product.authorId) {
              const { User } = require('../models');
              const author = await User.findByPk(product.authorId);
              if (author) {
                const currentUserPoints = parseFloat(author.point || 0);
                await author.update({
                  point: currentUserPoints + authorPoints
                });
                console.log(`User ${author.id} points updated: ${currentUserPoints} + ${authorPoints} (${commissionPercentage}% of ${orderAmount}) = ${currentUserPoints + authorPoints}`);
              }
            }
          }
        } catch (incomeError) {
          console.error(`Error updating product/user income:`, incomeError);
          // Continue - don't fail the payment check if income update fails
        }
      }
      
      // Check if this is a unique product payment (2000₮)
      if (parseFloat(order.amount) === 2000 && order.productId) {
        try {
          const product = await Product.findByPk(order.productId);
          if (product && !product.isUnique) {
            await product.update({ isUnique: true });
            console.log(`Product ${product.id} marked as unique after payment`);
          }
        } catch (productError) {
          console.error(`Error updating product to unique:`, productError);
          // Continue - don't fail the payment check if product update fails
        }
      }
      
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
    // Note: Product include is optional since wallet recharge orders have null productId
    const order = await Order.findOne({
      where: { invoiceId: object_id },
      include: [
        { model: User, as: 'user', required: false },
        { model: Product, as: 'product', required: false } // Optional for wallet recharge orders
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
      
      // Handle wallet recharge (productId is null, membershipId is null)
      if (!order.productId && !order.membershipId && order.userId) {
        try {
          const user = await User.findByPk(order.userId);
          if (user) {
            const currentIncome = parseFloat(user.income || 0);
            const rechargeAmount = parseFloat(order.amount);
            await user.update({
              income: currentIncome + rechargeAmount
            });
            console.log(`User ${user.id} income updated via webhook (wallet recharge): ${currentIncome} + ${rechargeAmount} = ${currentIncome + rechargeAmount}`);
          }
        } catch (incomeError) {
          console.error(`Error updating user income via webhook (wallet recharge):`, incomeError);
        }
      } else if (order.membershipId) {
        // Handle membership payment
        try {
          const user = await User.findByPk(order.userId);
          if (user) {
            const now = new Date();
            const isExtending = user.membership_type === order.membershipId;
            
            let startDate = now;
            let endDate = new Date(now);
            
            if (isExtending && user.subscriptionEndDate) {
              // Extending current membership: add 30 days to current end date
              const currentEndDate = new Date(user.subscriptionEndDate);
              if (currentEndDate > now) {
                // Current subscription is still active, extend from end date
                endDate = new Date(currentEndDate);
                endDate.setDate(endDate.getDate() + 30);
                startDate = user.subscriptionStartDate || now;
              } else {
                // Current subscription expired, start fresh from today
                endDate.setDate(endDate.getDate() + 30);
              }
            } else {
              // New membership purchase: start from today, 30 days later
              endDate.setDate(endDate.getDate() + 30);
            }
            
            await user.update({
              membership_type: order.membershipId,
              subscriptionStartDate: startDate,
              subscriptionEndDate: endDate
            });
            
            console.log(`User ${user.id} membership ${isExtending ? 'extended' : 'updated'} via webhook: membership ${order.membershipId}, start ${startDate}, end ${endDate}`);
          }
        } catch (membershipError) {
          console.error(`Error updating user membership via webhook:`, membershipError);
        }
      } else if (order.productId) {
        // Update product income
        try {
          const product = await Product.findByPk(order.productId);
          if (product) {
            const currentIncome = parseFloat(product.income || 0);
            const orderAmount = parseFloat(order.amount);
            
            // Get author's membership to calculate commission percentage
            let commissionPercentage = 20.00; // Default to 20% for FREE membership
            if (product.authorId) {
              const { User, Membership } = require('../models');
              const author = await User.findByPk(product.authorId);
              if (author) {
                let membership = null;
                if (author.membership_type) {
                  membership = await Membership.findByPk(author.membership_type);
                } else {
                  // Default to FREE membership (id: 2)
                  membership = await Membership.findByPk(2);
                }
                
                if (membership && membership.percentage) {
                  commissionPercentage = parseFloat(membership.percentage);
                }
              }
            }
            
            // Calculate commission points based on membership percentage
            const authorPoints = orderAmount * (commissionPercentage / 100);
            
            await product.update({ 
              income: currentIncome + orderAmount 
            });
            console.log(`Product ${product.id} income updated via webhook: ${currentIncome} + ${orderAmount} = ${currentIncome + orderAmount}`);
            
            // Update user (author) points (percentage-based commission)
            if (product.authorId) {
              const author = await User.findByPk(product.authorId);
              if (author) {
                const currentUserPoints = parseFloat(author.point || 0);
                await author.update({
                  point: currentUserPoints + authorPoints
                });
                console.log(`User ${author.id} points updated via webhook: ${currentUserPoints} + ${authorPoints} (${commissionPercentage}% of ${orderAmount}) = ${currentUserPoints + authorPoints}`);
              }
            }
          }
        } catch (incomeError) {
          console.error(`Error updating product/user income via webhook:`, incomeError);
        }
        
        // Check if this is a unique product payment (2000₮)
        if (parseFloat(order.amount) === 2000) {
          try {
            const product = await Product.findByPk(order.productId);
            if (product && !product.isUnique) {
              await product.update({ isUnique: true });
              console.log(`Product ${product.id} marked as unique after payment via webhook`);
            }
          } catch (productError) {
            console.error(`Error updating product to unique via webhook:`, productError);
          }
        }
        
        // Generate secure download token for product purchases
        await generateDownloadToken(order);
      }
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

// Create wallet recharge invoice
exports.createWalletRechargeInvoice = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Get QPay token
    const token = await getQPayToken();

    // Generate unique invoice number for wallet recharge
    const senderInvoiceNo = `WALLET_${Date.now()}_${userId}`;
    const invoiceCode = process.env.QPAY_INVOICE_CODE || 'KONO_INVOICE';
    const invoiceReceiverCode = process.env.QPAY_RECEIVER_CODE || 'DEFAULT_COM_ID';

    // Create invoice in QPay
    const invoiceResponse = await axios.post(
      `${QPAY_BASE_URL}/invoice`,
      {
        invoice_code: invoiceCode,
        sender_invoice_no: senderInvoiceNo,
        invoice_receiver_code: invoiceReceiverCode,
        invoice_description: `Данс цэнэглэх - ${parseFloat(amount).toLocaleString()}₮`,
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

    // Create a special order for wallet recharge (productId = null)
    const order = await Order.create({
      userId: parseInt(userId),
      productId: null, // Wallet recharge has no product
      amount: parseFloat(amount),
      paymentMethod: 'qpay',
      status: 'pending',
      invoiceId: invoiceData.invoice_id,
      qrImage: invoiceData.qr_image || null,
      qrText: invoiceData.qr_text || null
    });

    res.json({
      success: true,
      order: order.toJSON(),
      invoice: {
        invoice_id: invoiceData.invoice_id,
        qr_image: invoiceData.qr_image,
        qr_text: invoiceData.qr_text,
        qr_code: invoiceData.qr_code,
        urls: invoiceData.urls
      }
    });
  } catch (error) {
    console.error('Create wallet recharge invoice error:', error);
    res.status(500).json({
      error: 'Failed to create wallet recharge invoice',
      message: error.response?.data?.message || error.message
    });
  }
};

// Create membership payment invoice
exports.createMembershipInvoice = async (req, res) => {
  try {
    const { membershipId, extendOnly } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!membershipId) {
      return res.status(400).json({ error: 'Membership ID is required' });
    }

    // Get membership details
    const membership = await Membership.findByPk(membershipId);
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    if (!membership.isActive) {
      return res.status(400).json({ error: 'Membership is not active' });
    }

    // Get user to check current membership
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get QPay token
    const token = await getQPayToken();

    // Generate unique invoice number for membership payment
    const senderInvoiceNo = `MEMBERSHIP_${Date.now()}_${userId}_${membershipId}`;
    const invoiceCode = process.env.QPAY_INVOICE_CODE || 'KONO_INVOICE';
    const invoiceReceiverCode = process.env.QPAY_RECEIVER_CODE || 'DEFAULT_COM_ID';

    const membershipName = membership.name;
    const amount = parseFloat(membership.price);
    const description = extendOnly 
      ? `Гишүүнчлэл сунгах - ${membershipName}`
      : `Гишүүнчлэл сонгох - ${membershipName}`;

    // Create invoice in QPay
    const invoiceResponse = await axios.post(
      `${QPAY_BASE_URL}/invoice`,
      {
        invoice_code: invoiceCode,
        sender_invoice_no: senderInvoiceNo,
        invoice_receiver_code: invoiceReceiverCode,
        invoice_description: description,
        amount: amount
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

    // Create order for membership payment (productId = null, membershipId set)
    const order = await Order.create({
      userId: parseInt(userId),
      productId: null, // Membership payment has no product
      membershipId: parseInt(membershipId),
      amount: amount,
      paymentMethod: 'qpay',
      status: 'pending',
      invoiceId: invoiceData.invoice_id,
      qrImage: invoiceData.qr_image || null,
      qrText: invoiceData.qr_text || null
    });

    res.json({
      success: true,
      order: order.toJSON(),
      invoice: {
        invoice_id: invoiceData.invoice_id,
        qr_image: invoiceData.qr_image,
        qr_text: invoiceData.qr_text,
        qr_code: invoiceData.qr_code,
        urls: invoiceData.urls
      },
      membership: membership.toJSON()
    });
  } catch (error) {
    console.error('Create membership invoice error:', error);
    res.status(500).json({
      error: 'Failed to create membership invoice',
      message: error.response?.data?.message || error.message
    });
  }
};

// Check membership payment status
exports.checkMembershipPaymentStatus = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Find order by invoice ID
    const order = await Order.findOne({
      where: { invoiceId, userId: parseInt(userId) },
      include: [
        { model: Membership, as: 'membership', required: false }
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

    // Update order status if paid
    if (isPaid && order.status !== 'completed') {
      await order.update({ status: 'completed' });
      
      // Update user membership and subscription dates
      if (order.membershipId) {
        const user = await User.findByPk(userId);
        if (user) {
          const now = new Date();
          const isExtending = user.membership_type === order.membershipId;
          
          let startDate = now;
          let endDate = new Date(now);
          
          if (isExtending && user.subscriptionEndDate) {
            // Extending current membership: add 30 days to current end date
            const currentEndDate = new Date(user.subscriptionEndDate);
            if (currentEndDate > now) {
              // Current subscription is still active, extend from end date
              endDate = new Date(currentEndDate);
              endDate.setDate(endDate.getDate() + 30);
              startDate = user.subscriptionStartDate || now;
            } else {
              // Current subscription expired, start fresh from today
              endDate.setDate(endDate.getDate() + 30);
            }
          } else {
            // New membership purchase: start from today, 30 days later
            endDate.setDate(endDate.getDate() + 30);
          }
          
          await user.update({
            membership_type: order.membershipId,
            subscriptionStartDate: startDate,
            subscriptionEndDate: endDate
          });
          
          console.log(`User ${userId} membership ${isExtending ? 'extended' : 'updated'} to ${order.membershipId} via payment, start ${startDate}, end ${endDate}`);
        }
      }
    }

    res.json({
      success: true,
      payment: {
        isPaid,
        status: paymentStatus,
        orderStatus: order.status
      },
      order: order.toJSON()
    });
  } catch (error) {
    console.error('Check membership payment status error:', error);
    res.status(500).json({
      error: 'Failed to check payment status',
      message: error.response?.data?.message || error.message
    });
  }
};

// Wallet payment - purchase product using wallet balance
exports.payWithWallet = async (req, res) => {
  try {
    const { productId, amount } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!productId || !amount) {
      return res.status(400).json({ error: 'Product ID and amount are required' });
    }

    const { User, Product, Order, DownloadToken } = require('../models');
    const sequelize = require('sequelize');

    // Get user with current income balance
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has enough balance
    const currentBalance = parseFloat(user.income || 0);
    const purchaseAmount = parseFloat(amount);

    if (currentBalance < purchaseAmount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        message: `Таны үлдэгдэл хангалтгүй байна. Одоогийн үлдэгдэл: ${currentBalance.toLocaleString()}₮, Шаардлагатай: ${purchaseAmount.toLocaleString()}₮`
      });
    }

    // Validate product exists and get it
    let product;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (uuidRegex.test(productId)) {
      product = await Product.findOne({ where: { uuid: productId } });
    } else {
      product = await Product.findByPk(productId);
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get integer product ID
    const validProductId = product.id;

    // Use transaction to ensure atomicity
    const transaction = await require('../config/database').transaction();

    try {
      // Deduct amount from user's income
      await user.update(
        { 
          income: sequelize.literal(`income - ${purchaseAmount}`)
        },
        { transaction }
      );

      // Create order with wallet payment method
      const order = await Order.create({
        userId: parseInt(userId),
        productId: validProductId,
        amount: purchaseAmount,
        paymentMethod: 'wallet',
        status: 'completed', // Wallet payments are immediately completed
        transactionId: `WALLET_${Date.now()}_${userId}`
      }, { transaction });

      // Generate download token
      const token = DownloadToken.generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

      const downloadToken = await DownloadToken.create({
        token,
        orderId: order.id,
        productId: validProductId,
        userId: parseInt(userId),
        expiresAt
      }, { transaction });

      // Increment product downloads
      await product.increment('downloads', { transaction });

      // Update product income (full amount for tracking)
      const currentProductIncome = parseFloat(product.income || 0);
      await product.update({ 
        income: currentProductIncome + purchaseAmount 
      }, { transaction });

      // Update author income based on membership percentage
      if (product.authorId) {
        const { Membership } = require('../models');
        let commissionPercentage = 20.00; // Default to 20% for FREE membership
        
        const author = await User.findByPk(product.authorId, { transaction });
        if (author) {
          let membership = null;
          if (author.membership_type) {
            membership = await Membership.findByPk(author.membership_type, { transaction });
          } else {
            // Default to FREE membership (id: 2)
            membership = await Membership.findByPk(2, { transaction });
          }
          
          if (membership && membership.percentage) {
            commissionPercentage = parseFloat(membership.percentage);
          }
        }
        
        // Calculate author points based on membership percentage
        const authorPoints = purchaseAmount * (commissionPercentage / 100);
        
        // Update author points
        await User.update(
          { 
            point: sequelize.literal(`point + ${authorPoints}`)
          },
          { 
            where: { id: product.authorId },
            transaction 
          }
        );
        
        console.log(`Author ${product.authorId} points updated via wallet payment: +${authorPoints} (${commissionPercentage}% of ${purchaseAmount})`);
      }

      // Commit transaction
      await transaction.commit();

      // Get updated user to return new balance
      const updatedUser = await User.findByPk(userId, {
        attributes: ['id', 'income']
      });

      res.json({
        success: true,
        order: order.toJSON(),
        downloadToken: {
          token: downloadToken.token,
          expiresAt: downloadToken.expiresAt
        },
        newBalance: parseFloat(updatedUser.income || 0),
        message: 'Төлбөр амжилттай'
      });
    } catch (transactionError) {
      // Rollback transaction on error
      await transaction.rollback();
      throw transactionError;
    }
  } catch (error) {
    console.error('Wallet payment error:', error);
    res.status(500).json({
      error: 'Failed to process wallet payment',
      message: error.message
    });
  }
};

// Check wallet recharge payment status and update user income
exports.checkWalletRechargeStatus = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Find order by invoice ID (must belong to the authenticated user)
    const order = await Order.findOne({
      where: { 
        invoiceId,
        userId: parseInt(userId),
        productId: null // Wallet recharge orders have null productId
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Wallet recharge order not found' });
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

    // Update order status and user income if paid
    if (isPaid && order.status !== 'completed') {
      await order.update({ status: 'completed' });
      order.status = 'completed';
      
      // Update user income
      try {
        const user = await User.findByPk(userId);
        if (user) {
          const currentIncome = parseFloat(user.income || 0);
          const rechargeAmount = parseFloat(order.amount);
          await user.update({
            income: currentIncome + rechargeAmount
          });
          console.log(`User ${userId} income updated: ${currentIncome} + ${rechargeAmount} = ${currentIncome + rechargeAmount}`);
        }
      } catch (incomeError) {
        console.error(`Error updating user income:`, incomeError);
        // Continue - don't fail the payment check if income update fails
      }
    }

    res.json({
      success: true,
      order: order.toJSON(),
      payment: {
        status: paymentStatus,
        isPaid,
        data: paymentData
      }
    });
  } catch (error) {
    console.error('Check wallet recharge status error:', error);
    res.status(500).json({
      error: 'Failed to check wallet recharge status',
      message: error.response?.data?.message || error.message
    });
  }
};

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

