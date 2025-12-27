# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for the application.

## Backend Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - For development: `http://localhost:5000/api/auth/google/callback`
   - For production: `https://your-backend-domain.com/api/auth/google/callback`
7. Copy the Client ID and Client Secret

### 2. Backend Environment Variables

Add these to your `backend/.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Backend URL
BACKEND_URL=http://localhost:5000

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000

# Session Secret (generate a random string)
SESSION_SECRET=your-random-session-secret-here
```

### 3. Install Dependencies

The following packages have been installed:
- `passport`
- `passport-google-oauth20`
- `express-session`

## Frontend Setup

### Environment Variables

Add to your `tbarimt/.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## How It Works

1. User clicks "Google-аар нэвтрэх" button on homepage or login page
2. User is redirected to Google OAuth consent screen
3. After authentication, Google redirects back to backend callback URL
4. Backend creates/updates user with `journalist` role
5. Backend generates JWT token and redirects to frontend with token
6. Frontend stores token and user data, then redirects to journalist dashboard

## User Role Assignment

**Important**: Users who authenticate via Google OAuth are automatically assigned the `journalist` role.

If a user already exists with the same email:
- The existing user account is updated (avatar, username)
- The role remains as it was (unless you want to change this behavior)

If it's a new user:
- A new account is created with `journalist` role
- Username is set to `google_{google_id}`
- Random password is generated (not used for OAuth users)

## Testing

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd tbarimt
   npm run dev
   ```

3. Navigate to `http://localhost:3000` and click "Google-аар нэвтрэх"

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Make sure the callback URL in Google Console matches exactly with `GOOGLE_CALLBACK_URL`
   - Include the full URL with protocol (http:// or https://)

2. **CORS errors**
   - Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
   - Check that CORS is properly configured in `server.js`

3. **Session errors**
   - Make sure `SESSION_SECRET` is set in backend `.env`
   - Use a strong random string for production

4. **User not getting journalist role**
   - Check the passport configuration in `backend/config/passport.js`
   - Verify the role assignment logic in the GoogleStrategy callback

