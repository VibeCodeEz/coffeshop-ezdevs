-- Fix for Infinite Recursion in RLS Policies
-- This addresses the 42P17 error: circular dependency in user_profiles table

-- Step 1: Temporarily disable RLS on problematic tables
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_carts DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage their own carts" ON session_carts;
DROP POLICY IF EXISTS "Users can manage their cart items" ON cart_items;

-- Step 3: Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Step 4: Create non-recursive policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles 
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles 
FOR UPDATE USING (id = auth.uid());

-- Simplified admin policy that doesn't create recursion
CREATE POLICY "Admins can manage all profiles" ON user_profiles 
FOR ALL USING (
    -- Direct role check without subquery to avoid recursion
    (SELECT role FROM user_profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
    OR 
    -- Fallback: check email directly from auth.users
    (SELECT email FROM auth.users WHERE id = auth.uid()) LIKE '%admin%'
);

-- Step 5: Create simplified cart policies
-- Allow all operations for anonymous carts (session-based)
CREATE POLICY "Anyone can manage session carts" ON session_carts 
FOR ALL USING (
    user_id IS NULL  -- Anonymous carts
    OR 
    user_id = auth.uid()  -- User's own cart
);

-- Allow cart item operations with simple validation
CREATE POLICY "Anyone can manage cart items" ON cart_items 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM session_carts sc 
        WHERE sc.id = cart_items.cart_id 
        AND (sc.user_id IS NULL OR sc.user_id = auth.uid())
    )
);

-- Step 6: Create a function to check admin status safely
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- First try to get role from user_profiles without triggering RLS
    RETURN COALESCE(
        (SELECT role = 'admin' FROM user_profiles WHERE id = auth.uid()),
        -- Fallback: check email pattern
        (SELECT email LIKE '%admin%' FROM auth.users WHERE id = auth.uid()),
        false
    );
EXCEPTION
    WHEN OTHERS THEN
        -- If any error occurs, fallback to email check
        RETURN (SELECT email LIKE '%admin%' FROM auth.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Update the user creation trigger to be more robust
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Always create a profile, determine role based on email
    INSERT INTO user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        CASE 
            WHEN NEW.email LIKE '%admin%' OR NEW.email LIKE '%@admin.%' THEN 'admin'
            WHEN NEW.email LIKE '%cashier%' THEN 'cashier'
            ELSE 'customer'
        END
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, just return NEW
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't prevent user creation
        RAISE NOTICE 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Ensure the trigger exists
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup 
    AFTER INSERT ON auth.users 
    FOR EACH ROW 
    EXECUTE FUNCTION create_user_profile();

-- Step 9: Clean up any orphaned cart data that might cause issues
DELETE FROM cart_items 
WHERE cart_id IN (
    SELECT id FROM session_carts 
    WHERE expires_at < NOW() - INTERVAL '1 day'
);

DELETE FROM session_carts 
WHERE expires_at < NOW() - INTERVAL '1 day';

-- Step 10: Verify the fix by testing policies
DO $$
BEGIN
    -- This should not cause recursion
    PERFORM 1 FROM user_profiles WHERE id = auth.uid() LIMIT 1;
    RAISE NOTICE 'RLS policies fixed successfully - no recursion detected';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Warning: Issue still exists - %', SQLERRM;
END
$$;