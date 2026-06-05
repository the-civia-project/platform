ALTER TABLE account.user
    ADD CONSTRAINT user_citizen_of_check CHECK (cardinality(citizen_of) > 0);
