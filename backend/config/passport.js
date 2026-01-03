const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');
const { User } = require('../models');

// Only initialize Google OAuth strategy if credentials are provided
const hasGoogleCredentials = 
  process.env.GOOGLE_CLIENT_ID && 
  typeof process.env.GOOGLE_CLIENT_ID === 'string' &&
  process.env.GOOGLE_CLIENT_ID.trim() !== '' &&
  process.env.GOOGLE_CLIENT_SECRET && 
  typeof process.env.GOOGLE_CLIENT_SECRET === 'string' &&
  process.env.GOOGLE_CLIENT_SECRET.trim() !== '';

// Construct callback URL dynamically
const getCallbackURL = () => {
  // If explicitly set, use it
  if (process.env.GOOGLE_CALLBACK_URL) {
    return process.env.GOOGLE_CALLBACK_URL;
  }
  
  // Otherwise, construct from API_URL or BACKEND_URL
  const baseUrl = process.env.API_URL || process.env.BACKEND_URL;
  if (baseUrl) {
    // Remove trailing /api if present to avoid double /api/api/
    const normalizedUrl = baseUrl.trim().endsWith('/api') 
      ? baseUrl.trim().slice(0, -4) 
      : baseUrl.trim();
    return `${normalizedUrl}/api/auth/google/callback`;
  }
  
  // Fallback to localhost for development
  const port = process.env.PORT || 3001;
  return `http://localhost:${port}/api/auth/google/callback`;
};

if (hasGoogleCredentials) {
  const callbackURL = getCallbackURL();
  console.log('Google OAuth callback URL:', callbackURL);
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google ID
          const { Op } = require('sequelize');
          let user = await User.findOne({
            where: {
              [Op.or]: [
                { email: profile.emails[0].value },
                { username: profile.id }
              ]
            }
          });

          if (user) {
            // Update user with Google ID and ensure they have journalist role
            const updateData = {};
            
            if (!user.username.includes('google_')) {
              updateData.username = `google_${profile.id}`;
            }
            
            if (profile.photos[0]?.value) {
              updateData.avatar = profile.photos[0].value;
            }
            
            // Update role to journalist if user doesn't already have admin role
            // This ensures Google OAuth users get journalist role, but preserves admin role
            if (user.role !== 'admin' && user.role !== 'journalist') {
              updateData.role = 'journalist';
            }
            
            if (Object.keys(updateData).length > 0) {
              await user.update(updateData);
              // Reload user from database to get fresh data
              await user.reload();
            }
            
            return done(null, user);
          }

          // Create new user with journalist role
          user = await User.create({
            username: `google_${profile.id}`,
            email: profile.emails[0].value,
            fullName: profile.displayName || profile.name?.givenName || 'User',
            password: crypto.randomBytes(32).toString('hex'), // Random password since OAuth
            role: 'journalist', // Assign journalist role for Google auth users
            avatar: profile.photos[0]?.value || null,
            isActive: true,
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
  console.log('Google OAuth strategy initialized');
} else {
  console.log('Google OAuth credentials not found. Google OAuth strategy skipped.');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

