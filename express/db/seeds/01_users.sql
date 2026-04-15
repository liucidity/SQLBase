-- Seed users are for development only. Password for all: 'password123'
INSERT INTO users (email, password_hash)
VALUES
  ('mario@nintendo.com', '$2b$12$n5S.I2KyD2uWa3odpdgCc.xDlvtV0cOoUHkFcV2YySnOj.u4iUpsO'),
  ('luigi@nintendo.com', '$2b$12$n5S.I2KyD2uWa3odpdgCc.xDlvtV0cOoUHkFcV2YySnOj.u4iUpsO'),
  ('peach@nintendo.com', '$2b$12$n5S.I2KyD2uWa3odpdgCc.xDlvtV0cOoUHkFcV2YySnOj.u4iUpsO');
