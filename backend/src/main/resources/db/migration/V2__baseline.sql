ALTER TABLE users
DROP COLUMN password_hash;

ALTER TABLE users
ADD COLUMN app_account_token UUID;

ALTER TABLE users
ADD CONSTRAINT uk_users_app_account_token
UNIQUE (app_account_token);