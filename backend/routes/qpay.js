const express = require('express');
const router = express.Router();
const qpayController = require('../controllers/qpayController');

// Create QPay invoice (no authentication required - userId can be passed in body)
router.post('/invoice', qpayController.createInvoice);

// Check payment status (no authentication required)
router.get('/check/:invoiceId', qpayController.checkPaymentStatus);

// Get order by invoice ID (no authentication required)
router.get('/order/:invoiceId', qpayController.getOrderByInvoice);

// Webhook endpoint (no authentication - QPay will call this)
router.post('/webhook', qpayController.paymentWebhook);

module.exports = router;

