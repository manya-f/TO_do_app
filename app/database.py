import os

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tasks.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def ensure_database_schema() -> None:
    inspector = inspect(engine)
    if not inspector.has_table("tasks"):
        Base.metadata.create_all(bind=engine)
        return

    columns = {column["name"] for column in inspector.get_columns("tasks")}
    if "description" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE tasks ADD COLUMN description VARCHAR NOT NULL DEFAULT ''")
            )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()