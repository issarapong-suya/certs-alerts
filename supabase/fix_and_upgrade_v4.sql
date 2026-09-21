-- ==============================================================================
-- Upgrade v4: Fix Admin Role, User Visibility, and System Notification Settings
-- Run this in Supabase SQL Editor
-- ==============================================================================

-- 1. Create table: system_notification_settings
CREATE TABLE IF NOT EXISTS public.system_notification_settings (
    id INT PRIMARY KEY DEFAULT 1,
    discord_webhook_url TEXT,
    admin_emails TEXT,
    enable_discord BOOLEAN DEFAULT TRUE,
    enable_email BOOLEAN DEFAULT TRUE,
    schedule_frequency TEXT DEFAULT 'daily', -- 'daily' | 'weekly' | 'monthly'
    schedule_day_of_week INT DEFAULT 1,     -- 1 = Monday, 7 = Sunday
    schedule_day_of_month INT DEFAULT 1,    -- 1 to 31
    schedule_time TEXT DEFAULT '08:00',     -- '08:00'
    last_run_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Insert default single row if not exists
INSERT INTO public.system_notification_settings (
    id, 
    discord_webhook_url, 
    admin_emails, 
    enable_discord, 
    enable_email, 
    schedule_frequency, 
    schedule_day_of_week, 
    schedule_day_of_month, 
    schedule_time
)
VALUES (
    1, 
    'https://discord.com/api/webhooks/1346469720508993547/I11oYNP6Pfm2AG0bTc8U-8-s6j5lW24Mif3cZKkWhqvOBpZnVGIH-y349YMiTSfV15zF', 
    'issarapong.suya@gmail.com', 
    TRUE, 
    TRUE, 
    'daily', 
    1, 
    1, 
    '08:00'
)
ON CONFLICT (id) DO NOTHING;

-- RLS for system_notification_settings
ALTER TABLE public.system_notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated to read system_notification_settings" ON public.system_notification_settings;
CREATE POLICY "Allow authenticated to read system_notification_settings" 
    ON public.system_notification_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to update system_notification_settings" ON public.system_notification_settings;
CREATE POLICY "Allow authenticated to update system_notification_settings" 
    ON public.system_notification_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated to insert system_notification_settings" ON public.system_notification_settings;
CREATE POLICY "Allow authenticated to insert system_notification_settings" 
    ON public.system_notification_settings FOR INSERT TO authenticated WITH CHECK (true);


-- 2. Guarantee Admin & Approved status for issarapong.suya@gmail.com
UPDATE public.user_profiles
SET role = 'admin', status = 'approved', updated_at = NOW()
WHERE email ILIKE 'issarapong.suya@gmail.com';

-- Sync any users in auth.users that might be missing from user_profiles
INSERT INTO public.user_profiles (id, email, full_name, role, status)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    CASE WHEN u.email ILIKE 'issarapong.suya@gmail.com' THEN 'admin' ELSE 'staff' END,
    CASE WHEN u.email ILIKE 'issarapong.suya@gmail.com' THEN 'approved' ELSE 'pending' END
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
    role = CASE WHEN EXCLUDED.email ILIKE 'issarapong.suya@gmail.com' THEN 'admin' ELSE user_profiles.role END,
    status = CASE WHEN EXCLUDED.email ILIKE 'issarapong.suya@gmail.com' THEN 'approved' ELSE user_profiles.status END;


-- 3. Fix RLS on user_profiles (prevent RLS recursion)
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;

-- Allow all authenticated users to read profiles
CREATE POLICY "Allow authenticated to read user_profiles" 
    ON public.user_profiles FOR SELECT 
    TO authenticated 
    USING (true);

-- Allow authenticated users to update profiles
CREATE POLICY "Allow authenticated to update user_profiles" 
    ON public.user_profiles FOR UPDATE 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

-- 4. Update trigger function to ensure default admin assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_first BOOLEAN;
    is_default_admin BOOLEAN;
BEGIN
    SELECT (COUNT(*) = 0) INTO is_first FROM public.user_profiles;
    is_default_admin := (NEW.email ILIKE 'issarapong.suya@gmail.com') OR is_first;

    INSERT INTO public.user_profiles (id, email, full_name, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        CASE WHEN is_default_admin THEN 'admin' ELSE 'staff' END,
        CASE WHEN is_default_admin THEN 'approved' ELSE 'pending' END
    )
    ON CONFLICT (id) DO UPDATE SET
        role = CASE WHEN EXCLUDED.email ILIKE 'issarapong.suya@gmail.com' THEN 'admin' ELSE user_profiles.role END,
        status = CASE WHEN EXCLUDED.email ILIKE 'issarapong.suya@gmail.com' THEN 'approved' ELSE user_profiles.status END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
