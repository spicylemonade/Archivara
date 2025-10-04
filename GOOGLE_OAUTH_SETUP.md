# Google OAuth Setup Instructions

Google OAuth has been integrated into your Archivara application! Follow these steps to complete the setup:

## 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - For local development: `http://localhost:8000/api/v1/auth/google/callback`
     - For production: `https://your-domain.com/api/v1/auth/google/callback`
   - Click "Create"
   - Copy the **Client ID** and **Client Secret**

## 2. Configure Backend

Update your backend `.env` file (`archivara/backend/.env`) with your Google OAuth credentials:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
```

**Important:** For production, update `GOOGLE_REDIRECT_URI` to match your production domain.

## 3. Run Database Migration

The User model has been updated to support OAuth. Run the migration:

```bash
cd archivara/backend
source venv/bin/activate
alembic upgrade head
```

## 4. Test the Integration

1. Start your backend server:
   ```bash
   cd archivara/backend
   source venv/bin/activate
   uvicorn app.main:app --reload
   ```

2. Start your frontend:
   ```bash
   cd archivara/frontend
   npm run dev
   ```

3. Visit `http://localhost:3000/login` or `http://localhost:3000/register`
4. Click the "Continue with Google" button
5. Sign in with your Google account
6. You'll be redirected back and automatically logged in!

## Features Implemented

- ✅ "Continue with Google" button on login page
- ✅ "Continue with Google" button on register page  
- ✅ Automatic account creation for new Google users
- ✅ Automatic login for existing users
- ✅ No password required for Google sign-in users
- ✅ Profile picture support from Google
- ✅ Email automatically verified for Google users

## How It Works

1. User clicks "Continue with Google"
2. User is redirected to Google's OAuth consent screen
3. User authorizes the application
4. Google redirects back to your backend with an authorization code
5. Backend exchanges the code for user information
6. Backend creates or updates the user account
7. Backend generates a JWT access token
8. User is redirected to frontend with the token
9. Frontend stores the token and logs the user in

## Security Notes

- OAuth users don't have passwords stored
- Email addresses from Google are automatically verified
- The `oauth_provider` and `oauth_sub` fields link users to their Google accounts
- Existing users can link their Google account by signing in with Google using the same email

## Troubleshooting

**"OAuth failed" error:**
- Check that your Google Client ID and Secret are correct
- Verify the redirect URI matches exactly in Google Console
- Make sure the Google+ API is enabled

**User not being created:**
- Check backend logs for errors
- Verify database connection
- Run migrations: `alembic upgrade head`

**Redirect issues:**
- Update `FRONTEND_URL` in backend `.env` to match your frontend URL
- For production, update all URLs to use your production domain
