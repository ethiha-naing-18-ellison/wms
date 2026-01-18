INSERT INTO users (name, email, password_hash, role)
VALUES
(
  'Admin User',
  'admin@wms.com',
  '$2b$10$YypWWMmkeH13LhwHjFTQWuGbtpa8VdWccAsACP0o4uMpXQzB4xOL6',
  'admin'
),
(
  'Manager User',
  'manager@wms.com',
  '$2b$10$C6UzMDM.H6dfI/f/IKcXeOeFtH2D0pD9CzQeL2Yx0Lx0yQJ8R8VfK',
  'manager'
),
(
  'Operator User',
  'operator@wms.com',
  '$2b$10$KIX0F5gXgJH8N9zYw8Y2QeRjD6Y3P8VZJYzQ7E2Q1K6kXxZk9A7C2',
  'operator'
)
ON CONFLICT (email) DO NOTHING;
