-- Add admin support via auth.users app_metadata
-- This migration provides a utility function to promote users to Super Admin.

-- Function to promote a user to super admin
-- Usage: SELECT public.promote_user_to_admin('user_id_here');
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- We use raw_app_meta_data because it is only editable by the service role
  UPDATE auth.users
  SET raw_app_meta_data = 
    raw_app_meta_data || 
    jsonb_build_object('is_super_admin', true)
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for security
COMMENT ON FUNCTION public.promote_user_to_admin IS 'Promotes a user to super admin by updating their app_metadata. Must be run as superuser or service role.';
