// Ensure environment variables are loaded
require('dotenv').config();

const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticate, authController.getProfile);

// Google OAuth routes - only register if Google OAuth is configured
const hasGoogleCredentials = 
  process.env.GOOGLE_CLIENT_ID && 
  typeof process.env.GOOGLE_CLIENT_ID === 'string' &&
  process.env.GOOGLE_CLIENT_ID.trim() !== '' &&
  process.env.GOOGLE_CLIENT_SECRET && 
  typeof process.env.GOOGLE_CLIENT_SECRET === 'string' &&
  process.env.GOOGLE_CLIENT_SECRET.trim() !== '';

if (hasGoogleCredentials) {
  router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' // Force account selection
  }));
  router.get('/google/callback', 
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    authController.googleCallback
  );
} else {
  // Provide helpful error messages if Google OAuth is not configured
  router.get('/google', (req, res) => {
    res.status(503).json({ 
      error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.' 
    });
  });
  router.get('/google/callback', (req, res) => {
    res.status(503).json({ 
      error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.' 
    });
  });
}

// Facebook OAuth routes - only register if Facebook OAuth is configured
const hasFacebookCredentials = 
  process.env.FACEBOOK_APP_ID && 
  typeof process.env.FACEBOOK_APP_ID === 'string' &&
  process.env.FACEBOOK_APP_ID.trim() !== '' &&
  process.env.FACEBOOK_APP_SECRET && 
  typeof process.env.FACEBOOK_APP_SECRET === 'string' &&
  process.env.FACEBOOK_APP_SECRET.trim() !== '';

// Debug logging to help diagnose issues
if (!hasFacebookCredentials) {
  console.log('Facebook OAuth Configuration Check:');
  console.log('  FACEBOOK_APP_ID exists:', !!process.env.FACEBOOK_APP_ID);
  console.log('  FACEBOOK_APP_ID type:', typeof process.env.FACEBOOK_APP_ID);
  console.log('  FACEBOOK_APP_ID value:', process.env.FACEBOOK_APP_ID ? `"${process.env.FACEBOOK_APP_ID.substring(0, 10)}..."` : 'undefined');
  console.log('  FACEBOOK_APP_SECRET exists:', !!process.env.FACEBOOK_APP_SECRET);
  console.log('  FACEBOOK_APP_SECRET type:', typeof process.env.FACEBOOK_APP_SECRET);
  console.log('  FACEBOOK_APP_SECRET value:', process.env.FACEBOOK_APP_SECRET ? `"${process.env.FACEBOOK_APP_SECRET.substring(0, 10)}..."` : 'undefined');
}

if (hasFacebookCredentials) {
  router.get('/facebook', passport.authenticate('facebook', { 
    scope: ['email']
  }));
  router.get('/facebook/callback', 
    passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
    authController.facebookCallback
  );
} else {
  // Provide helpful error messages if Facebook OAuth is not configured
  router.get('/facebook', (req, res) => {
    res.status(503).json({ 
      error: 'Facebook OAuth is not configured. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.' 
    });
  });
  router.get('/facebook/callback', (req, res) => {
    res.status(503).json({ 
      error: 'Facebook OAuth is not configured. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.' 
    });
  });
}

module.exports = router;

