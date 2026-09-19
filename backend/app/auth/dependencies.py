from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.auth.jwt import verify_token
from app.auth.security import hash_password, verify_password

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

class PwdContextWrapper:
    def hash(self, secret):
        return hash_password(secret)
    def verify(self, secret, hash):
        return verify_password(secret, hash)

pwd_context = PwdContextWrapper()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = verify_token(token)
    if token_data is None:
        raise credentials_exception
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

def require_role(roles: list):
    def role_dependency(current_user: User = Depends(get_current_user)):
        if current_user.role.value not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return current_user
    return role_dependency
