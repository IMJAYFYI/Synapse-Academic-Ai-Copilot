from database import engine, Base
from sqlalchemy import text
import models

with engine.connect() as con:
    con.execute(text('DROP SCHEMA public CASCADE; CREATE SCHEMA public;'))
    con.commit()

Base.metadata.create_all(bind=engine)
print('SUCCESS: Postgres tables completely reset!')
