from sqlalchemy import inspect, text
from app.db.database import engine, Base
from app.core.logging import logger

def init_and_upgrade_db():
    """
    Safely creates any missing tables, adds missing columns, and applies composite performance indexes.
    Works with both SQLite and PostgreSQL.
    """
    # 1. Create tables that do not yet exist
    Base.metadata.create_all(bind=engine)

    # 2. Check for missing columns on existing tables (safe ALTER TABLE)
    try:
        with engine.connect() as conn:
            inspector = inspect(engine)
            
            # Users table columns
            if "users" in inspector.get_table_names():
                user_cols = [col["name"] for col in inspector.get_columns("users")]
                if "provider_user_id" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN provider_user_id VARCHAR"))
                    conn.commit()
                if "name" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR"))
                    conn.commit()
                if "profile_image" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN profile_image VARCHAR"))
                    conn.commit()

            # Research tasks table columns
            if "research_tasks" in inspector.get_table_names():
                task_cols = [col["name"] for col in inspector.get_columns("research_tasks")]
                task_col_defs = {
                    "conversation_id": "VARCHAR",
                    "user_id": "INTEGER",
                    "quality_score": "FLOAT",
                    "source_diversity_score": "FLOAT",
                    "evidence_coverage_score": "FLOAT",
                    "token_usage": "TEXT",
                    "cost_estimate": "FLOAT",
                    "sub_queries": "TEXT",
                    "sources": "TEXT",
                    "evidence_matrix": "TEXT",
                    "claims": "TEXT",
                    "contradictions": "TEXT",
                    "report_markdown": "TEXT",
                    "report_summary": "TEXT",
                }
                for col_name, col_type in task_col_defs.items():
                    if col_name not in task_cols:
                        try:
                            conn.execute(text(f"ALTER TABLE research_tasks ADD COLUMN {col_name} {col_type}"))
                            conn.commit()
                            logger.info(f"Migrated research_tasks table: added {col_name}")
                        except Exception as e:
                            logger.debug(f"Column {col_name} migration skipped: {e}")

            # Generated documents table columns
            if "generated_documents" in inspector.get_table_names():
                doc_cols = [col["name"] for col in inspector.get_columns("generated_documents")]
                if "user_id" not in doc_cols:
                    conn.execute(text("ALTER TABLE generated_documents ADD COLUMN user_id INTEGER"))
                    conn.commit()
                    logger.info("Migrated generated_documents table: added user_id")

            # Document files table columns
            if "document_files" in inspector.get_table_names():
                docfile_cols = [col["name"] for col in inspector.get_columns("document_files")]
                if "user_id" not in docfile_cols:
                    conn.execute(text("ALTER TABLE document_files ADD COLUMN user_id INTEGER"))
                    conn.commit()
                    logger.info("Migrated document_files table: added user_id")
            
            # 3. Create high-performance composite indexes (IF NOT EXISTS works on both SQLite and PG)
            indexes = [
                "CREATE INDEX IF NOT EXISTS ix_conversations_user_updated ON conversations(user_id, updated_at DESC)",
                "CREATE INDEX IF NOT EXISTS ix_messages_convo_created ON messages(conversation_id, created_at ASC)",
                "CREATE INDEX IF NOT EXISTS ix_research_tasks_user_created ON research_tasks(user_id, created_at DESC)",
                "CREATE INDEX IF NOT EXISTS ix_research_tasks_convo ON research_tasks(conversation_id)",
                "CREATE INDEX IF NOT EXISTS ix_projects_user ON projects(user_id)",
                "CREATE INDEX IF NOT EXISTS ix_document_files_user ON document_files(user_id)",
            ]
            for idx_sql in indexes:
                try:
                    conn.execute(text(idx_sql))
                    conn.commit()
                except Exception as ie:
                    logger.debug(f"Index check: {ie}")
                    
    except Exception as e:
        logger.warning(f"Database migration check note: {e}")
