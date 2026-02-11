from app.database import engine, SessionLocal
from app.models import Base, User
from app.auth import get_password_hash

def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create default admin user
    db = SessionLocal()
    try:
        existing_admin = db.query(User).filter(User.email == "admin@organigrama.ro").first()
        if not existing_admin:
            admin = User(
                email="admin@organigrama.ro",
                hashed_password=get_password_hash("admin123"),
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
