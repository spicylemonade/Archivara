from datetime import timedelta, datetime
from typing import Annotated
import secrets

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from authlib.integrations.starlette_client import OAuth
import httpx

from app.core.config import settings
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Initialize OAuth
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user."""
    from jose import JWTError, jwt
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    return user


async def send_verification_email(email: str, token: str):
    """Send verification email using Resend API"""
    import resend

    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

    # Check if Resend API key is configured
    if not settings.RESEND_API_KEY:
        print(f"[EMAIL] Resend API key not configured. Verification URL: {verification_url}")
        print(f"[EMAIL] User registered with email: {email}")
        print(f"[EMAIL] For testing, auto-verify users or copy this URL to verify manually")
        return

    try:
        resend.api_key = settings.RESEND_API_KEY

        # HTML content
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #C47456;">Welcome to Archivara!</h2>
              <p>Thank you for registering with {email}. Please verify your email address to activate your account.</p>
              <div style="margin: 30px 0;">
                <a href="{verification_url}"
                   style="background-color: #C47456; color: white; padding: 12px 30px;
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Or copy and paste this link into your browser:<br>
                <a href="{verification_url}" style="color: #C47456;">{verification_url}</a>
              </p>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                This link will expire in 24 hours.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
        """

        # Send email via Resend
        # Note: Resend free tier requires verified domain to send to others
        # For testing, it only sends to the owner's email
        params = {
            "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
            "to": [email],
            "subject": "Verify your Archivara account",
            "html": html,
        }

        resend.Emails.send(params)
        print(f"[EMAIL] Verification email sent to {email}")

    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {email}: {e}")
        print(f"[EMAIL] Verification URL (for manual testing): {verification_url}")
        # Don't fail registration if email fails
        pass


@router.post("/register", response_model=UserResponse)
async def register(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user and send verification email."""
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        # If user exists and is verified, return error
        if existing_user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # If user exists but is not verified, update their info and resend verification
        # This allows users to "retry" registration if they didn't get the email
        verification_token = secrets.token_urlsafe(32)
        verification_expires = datetime.utcnow() + timedelta(hours=24)

        existing_user.hashed_password = get_password_hash(user_in.password)
        existing_user.full_name = user_in.full_name
        existing_user.affiliation = user_in.affiliation
        existing_user.verification_token = verification_token
        existing_user.verification_token_expires = verification_expires

        await db.commit()
        await db.refresh(existing_user)

        # Resend verification email
        background_tasks.add_task(send_verification_email, existing_user.email, verification_token)

        return existing_user

    # Generate verification token for new user
    verification_token = secrets.token_urlsafe(32)
    verification_expires = datetime.utcnow() + timedelta(hours=24)

    # Create new user
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        affiliation=user_in.affiliation,
        verification_token=verification_token,
        verification_token_expires=verification_expires,
        is_verified=False  # User must verify email
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Send verification email in background
    background_tasks.add_task(send_verification_email, user.email, verification_token)

    return user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login for access token."""
    # OAuth2PasswordRequestForm uses username field, but we use email
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if email is verified
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in. Check your inbox for the verification link.",
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user).model_dump()
    }


@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Get current user."""
    return current_user


@router.post("/verify-email")
async def verify_email(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """Verify user email with token."""
    result = await db.execute(
        select(User).where(User.verification_token == token)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )

    if user.verification_token_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired"
        )

    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    await db.commit()

    return {"message": "Email verified successfully"}


@router.get("/google/login")
async def google_login(request: Request):
    """Initiate Google OAuth login flow."""
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Handle Google OAuth callback."""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')

        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user info from Google"
            )

        email = user_info.get('email')
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google"
            )

        # Check if user already exists
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user:
            # Update OAuth info if user exists
            if not user.oauth_provider:
                user.oauth_provider = 'google'
                user.oauth_sub = user_info.get('sub')
                user.is_verified = True  # Google emails are already verified
                user.picture = user_info.get('picture')
        else:
            # Create new user
            user = User(
                email=email,
                full_name=user_info.get('name', email.split('@')[0]),
                oauth_provider='google',
                oauth_sub=user_info.get('sub'),
                is_verified=True,  # Google emails are already verified
                picture=user_info.get('picture')
            )
            db.add(user)

        await db.commit()
        await db.refresh(user)

        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )

        # Redirect to frontend with token
        frontend_url = settings.FRONTEND_URL
        return RedirectResponse(
            url=f"{frontend_url}/login?token={access_token}&email={email}&name={user.full_name}"
        )

    except Exception as e:
        print(f"Google OAuth error: {e}")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=oauth_failed"
        )


@router.post("/google/token", response_model=Token)
async def google_token_login(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """Verify Google ID token and login (for frontend Google Sign-In)."""
    try:
        # Verify the token with Google
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google token"
                )

            user_info = response.json()

            # Verify the token is for our app
            if user_info.get('aud') != settings.GOOGLE_CLIENT_ID:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token not for this application"
                )

            email = user_info.get('email')
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email not provided by Google"
                )

            # Check if user already exists
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()

            if user:
                # Update OAuth info if user exists
                if not user.oauth_provider:
                    user.oauth_provider = 'google'
                    user.oauth_sub = user_info.get('sub')
                    user.is_verified = True
                    user.picture = user_info.get('picture')
            else:
                # Create new user
                user = User(
                    email=email,
                    full_name=user_info.get('name', email.split('@')[0]),
                    oauth_provider='google',
                    oauth_sub=user_info.get('sub'),
                    is_verified=True,
                    picture=user_info.get('picture')
                )
                db.add(user)

            await db.commit()
            await db.refresh(user)

            # Create access token
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": user.email}, expires_delta=access_token_expires
            )

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": UserResponse.model_validate(user).model_dump()
            }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Google token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to verify Google token"
        ) 