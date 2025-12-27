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

if (hasGoogleCredentials) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `http://localhost:3001/api/auth/google/callback`,
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
            // Update user with Google ID if not set
            if (!user.username.includes('google_')) {
              await user.update({
                username: `google_${profile.id}`,
                avatar: profile.photos[0]?.value || user.avatar,
              });
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

