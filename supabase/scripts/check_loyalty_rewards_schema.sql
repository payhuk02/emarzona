SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('loyalty_rewards', 'loyalty_reward_redemptions')
ORDER BY table_name, ordinal_position;
