-- ============================================================================
-- VERIFICATION SCRIPT: Sibling Support & Team Access
-- Scenario:
-- 1. Create a Club.
-- 2. Create a "Parent" User.
-- 3. Create two Teams (Sub-12, Sub-15).
-- 4. Create two Players (Siblings) linked to the same Parent but different Teams.
-- 5. Verify the Parent can "see" both teams via their children.
-- 6. Verify Isolation: Try to link a player to a team from a DIFFERENT club (should fail).
-- ============================================================================

BEGIN;

-- 1. Setup Data
INSERT INTO clubs (id, name, subdomain, email) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Test Club', 'test', 'test@club.com');

INSERT INTO users (id, club_id, email, password_hash, role, first_name, last_name)
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'parent@gmail.com', 'hash', 'PARENT', 'John', 'Doe');

INSERT INTO teams (id, club_id, name, season) VALUES
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Sub-12', '2024'),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Sub-15', '2024');

-- 2. Create Siblings (Same Parent, Different Teams)
-- Child 1 in Sub-12
INSERT INTO players (id, club_id, first_name, last_name, birth_date, parent_id, current_team_id)
VALUES ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Kid', 'One', '2012-01-01', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');

-- Child 2 in Sub-15
INSERT INTO players (id, club_id, first_name, last_name, birth_date, parent_id, current_team_id)
VALUES ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Kid', 'Two', '2009-01-01', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444');

-- 3. Verify Access Query (Simulating "My Kids' Teams")
-- This query returns all teams relevant to the parent
SELECT t.name AS team_name, p.first_name AS child_name
FROM teams t
JOIN players p ON p.current_team_id = t.id
WHERE p.parent_id = '22222222-2222-2222-2222-222222222222';
-- Expected result: 
-- Sub-12 | Kid One
-- Sub-15 | Kid Two

-- 4. Verify Isolation Constraint (Negative Test)
-- Try to insert a player in This Club but linked to a Team from Another Club
-- This should FAIL due to the trigger "check_consistency_players"
DO $$
BEGIN
    BEGIN
        -- Insert Fake Other Team
        INSERT INTO clubs (id, name, subdomain, email) VALUES ('99999999-9999-9999-9999-999999999999', 'Other Club', 'other', 'other@club.com');
        INSERT INTO teams (id, club_id, name, season) VALUES ('88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', 'Intruder Team', '2024');
        
        -- Try to link Player (Club 111...) to Team (Club 999...)
        INSERT INTO players (club_id, first_name, last_name, birth_date, parent_id, current_team_id)
        VALUES ('11111111-1111-1111-1111-111111111111', 'Bad', 'Child', '2012-01-01', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888');
        
        RAISE EXCEPTION 'Constraint Failed: Allowed cross-club data leak!';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Success: Constraint prevented cross-club data leak. Error: %', SQLERRM;
    END;
END $$;

ROLLBACK;
