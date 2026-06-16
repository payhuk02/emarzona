-- GRANT manquants sur les RPC push — bloquait save_push_subscription côté client

GRANT EXECUTE ON FUNCTION public.save_push_subscription(TEXT, JSONB, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_push_subscription(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_push_subscriptions() TO authenticated;
