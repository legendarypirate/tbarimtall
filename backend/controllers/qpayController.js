const { Order, User, Product } = require('../models');
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
    const order = await Order.create({
      userId: finalUserId || null,
      productId,
      amount: parseFloat(amount),
      paymentMethod: 'qpay',
      status: 'pending',
      invoiceId: invoiceData.invoice_id,
      qrImage: invoiceData.qr_image || null,
      qrText: invoiceData.qr_text || null
    });

    // Get order with relations
    const orderWithRelations = await Order.findByPk(order.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email', 'fullName'] },
        { model: Product, as: 'product', attributes: ['id', 'title', 'price'] }
      ]
    });

    res.json({
      success: true,
      order: orderWithRelations,
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
    const order = await Order.findOne({
      where: { invoiceId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email', 'fullName'] },
        { model: Product, as: 'product', attributes: ['id', 'title', 'price'] }
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
      order.status = 'completed';
    }

    res.json({
      success: true,
      order,
      payment: {
        status: paymentStatus,
        isPaid,
        data: paymentData
      }
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

// Get order by invoice ID (for frontend polling)
exports.getOrderByInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Find order by invoice ID (no userId filter - anyone can get by invoice ID)
    const order = await Order.findOne({
      where: { invoiceId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email', 'fullName'] },
        { model: Product, as: 'product', attributes: ['id', 'title', 'price'] }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      error: 'Failed to get order',
      message: error.message
    });
  }
};

