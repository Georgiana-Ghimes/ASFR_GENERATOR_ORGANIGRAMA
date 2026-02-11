from app.database import engine, SessionLocal
from app.models import Base, User
import os

def init_db():
    # Set DATABASE_URL if not set
    if not os.getenv("DATABASE_URL"):
        os.environ["DATABASE_URL"] = "postgresql://postgres:password@localhost:5432/organigrama"
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create default admin user with simple hash (for development only)
    db = SessionLocal()
    try:
        existing_admin = db.query(User).filter(User.email == "admin@organigrama.ro").first()
        if not existing_admin:
            # Simple hash for development - in production use proper bcrypt
            from passlib.hash import pbkdf2_sha256
            admin = User(
                email="admin@organigrama.ro",
                hashed_password=pbkdf2_sha256.hash("admin123"),
                role="admin"
            )
            db.add(admin)
            db.commit()
            print("✓ Admin user created: admin@organigrama.ro / admin123")
        else:
            print("✓ Admin user already exists")
    finally:
        db.close()
    
    print("✓ Database initialized successfully")

if __name__ == "__main__":
    init_db()
