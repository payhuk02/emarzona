-- Fix RLS policies for user_behavior_events to allow insertions
-- Users should be able to insert their own behavior events

-- Drop existing policy and recreate with INSERT permission
DROP POLICY IF EXISTS "Users can view their own behavior events" ON user_behavior_events;

-- Create comprehensive policy for user behavior events
CREATE POLICY "Users can manage their own behavior events" ON user_behavior_events
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Also allow service role to insert events for analytics
CREATE POLICY "Service role can manage all behavior events" ON user_behavior_events
  FOR ALL USING (auth.role() = 'service_role');

-- Ensure the table is still enabled for RLS
ALTER TABLE user_behavior_events ENABLE ROW LEVEL SECURITY;