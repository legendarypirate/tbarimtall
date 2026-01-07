const express = require('express');
const router = express.Router();
const qpayController = require('../controllers/qpayController');
const { authenticate } = require('../middleware/auth');

// Create QPay invoice (no authentication required - userId can be passed in body)
router.post('/invoice', qpayController.createInvoice);

// Wallet payment endpoint (require authentication)
router.post('/wallet/pay', authenticate, qpayController.payWithWallet);

// Wallet recharge endpoints (require authentication)
router.post('/wallet/recharge', authenticate, qpayController.createWalletRechargeInvoice);
router.get('/wallet/check/:invoiceId', authenticate, qpayController.checkWalletRechargeStatus);

// Membership payment endpoints (require authentication)
router.post('/membership/invoice', authenticate, qpayController.createMembershipInvoice);
router.get('/membership/check/:invoiceId', authenticate, qpayController.checkMembershipPaymentStatus);

// Check payment status (no authentication required)
router.get('/check/:invoiceId', qpayController.checkPaymentStatus);

// Get order by invoice ID (no authentication required)
router.get('/order/:invoiceId', qpayController.getOrderByInvoice);

// Webhook endpoint (no authentication - QPay will call this)
router.post('/webhook', qpayController.paymentWebhook);

module.exports = router;

