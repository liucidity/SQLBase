CREATE TABLE IF NOT EXISTS databases(
  id SERIAL PRIMARY KEY NOT NULL,
  database_uuid UUID NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  global_state TEXT,
  query_string TEXT,
  seed_string TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uuid_constraint UNIQUE (database_uuid)
);
CREATE TABLE IF NOT EXISTS schema_forms(
  id SERIAL PRIMARY KEY NOT NULL,
  database_id INTEGER REFERENCES databases(id) ON DELETE CASCADE,
  schema_form_json json,
  form_schema_string TEXT
);
CREATE TABLE IF NOT EXISTS query_forms(
  id SERIAL PRIMARY KEY NOT NULL,
  database_id INTEGER REFERENCES databases(id) ON DELETE CASCADE,
  query_form_json json,
  form_schema_string TEXT
);
