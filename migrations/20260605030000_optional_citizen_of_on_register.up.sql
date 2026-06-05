-- Accounts can be created before eIDAS verification supplies citizenship.

ALTER TABLE account.user
    DROP CONSTRAINT IF EXISTS user_citizen_of_check;
