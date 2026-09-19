import hashlib
import os

def hash_password(password: str) -> str:
    """Hash password using sha256 + salt for robust, portable hashing."""
    salt = os.urandom(16).hex()
    hashed = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
    return f"sha256${salt}${hashed}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against stored hash (supports sha256 and legacy bcrypt fallback)."""
    if not hashed_password:
        return False
    if hashed_password.startswith("sha256$"):
        try:
            parts = hashed_password.split("$")
            if len(parts) != 3:
                return False
            salt, stored_hash = parts[1], parts[2]
            computed = hashlib.sha256((salt + plain_password).encode('utf-8')).hexdigest()
            return computed == stored_hash
        except Exception:
            return False
    else:
        # Fallback for plain bcrypt if present
        try:
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return plain_password == hashed_password
