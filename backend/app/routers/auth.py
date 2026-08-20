import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.schemas.auth import UserRegister, UserLogin, OAuthSyncRequest, Token, UserOut
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
    
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        username=user_in.username,
        name=user_in.username,
        hashed_password=hashed_pwd
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )


@router.post("/login", response_model=Token)
def login_user(user_in: UserLogin, db: Session = Depends(get_db)):
    identifier = user_in.username_or_email or user_in.email
    if not identifier:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or username is required")
        
    user = db.query(User).filter(
        (User.email == identifier) | (User.username == identifier)
    ).first()
    
    if not user or not user.hashed_password or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_access_token(subject=str(user.id))
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )


@router.post("/oauth_sync", response_model=Token)
def sync_oauth_user(oauth_in: OAuthSyncRequest, db: Session = Depends(get_db)):
    """
    Syncs or creates an authenticated user from Google / OAuth provider using stable provider_user_id.
    Ensures exact 1:1 user account ownership and returns an authenticated backend JWT.
    """
    # 1. Search by stable provider_user_id first
    user = db.query(User).filter(User.provider_user_id == oauth_in.provider_user_id).first()
    
    # 2. If not found by provider ID, check by email
    if not user and oauth_in.email:
        user = db.query(User).filter(User.email == oauth_in.email).first()
        if user:
            # Link provider ID to existing account
            user.provider_user_id = oauth_in.provider_user_id
    
    if not user:
        # Create new user with a secure random hash satisfying DB constraints
        base_username = oauth_in.username or oauth_in.name or oauth_in.email.split("@")[0]
        placeholder_hash = get_password_hash(secrets.token_urlsafe(32))
        user = User(
            provider_user_id=oauth_in.provider_user_id,
            email=oauth_in.email,
            username=base_username,
            name=oauth_in.name or base_username,
            profile_image=oauth_in.profile_image,
            hashed_password=placeholder_hash,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update profile info if updated
        changed = False
        if oauth_in.name and user.name != oauth_in.name:
            user.name = oauth_in.name
            changed = True
        if oauth_in.profile_image and user.profile_image != oauth_in.profile_image:
            user.profile_image = oauth_in.profile_image
            changed = True
        if changed:
            db.commit()
            db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )


@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
