-- Templates email plateforme — enchères gagnantes (H-03 / notification_templates)

INSERT INTO public.notification_templates (
  slug,
  name,
  channel,
  language,
  subject,
  body,
  html,
  variables,
  store_id,
  is_active,
  created_at,
  updated_at
)
VALUES
  (
    'auction_won',
    'Enchère remportée',
    'email',
    'fr',
    'Vous avez gagné l''enchère « {{auction_title}} »',
    'Bonjour {{user_name}}, vous avez remporté l''enchère « {{auction_title}} » pour {{current_bid}} XOF. Réglez avant le {{winner_payment_deadline}}.',
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/></head><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px;">
<h1 style="color:#7c3aed;font-size:22px;">Félicitations !</h1>
<p>Bonjour {{user_name}},</p>
<p>Vous avez remporté l''enchère <strong>{{auction_title}}</strong> pour <strong>{{current_bid}} XOF</strong>.</p>
<p style="color:#555;">{{message}}</p>
<p style="margin:28px 0;"><a href="{{action_url}}" style="background:#7c3aed;color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:600;">{{action_label}}</a></p>
<p style="font-size:13px;color:#888;">— {{platform_name}}</p>
</body></html>',
    ARRAY['user_name', 'auction_title', 'current_bid', 'action_url', 'action_label', 'message', 'winner_payment_deadline', 'platform_name'],
    NULL,
    true,
    now(),
    now()
  ),
  (
    'auction_won',
    'Auction won',
    'email',
    'en',
    'You won the auction « {{auction_title}} »',
    'Hello {{user_name}}, you won « {{auction_title}} » for {{current_bid}} XOF. Please pay by {{winner_payment_deadline}}.',
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/></head><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px;">
<h1 style="color:#7c3aed;font-size:22px;">Congratulations!</h1>
<p>Hello {{user_name}},</p>
<p>You won <strong>{{auction_title}}</strong> for <strong>{{current_bid}} XOF</strong>.</p>
<p style="color:#555;">{{message}}</p>
<p style="margin:28px 0;"><a href="{{action_url}}" style="background:#7c3aed;color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:600;">{{action_label}}</a></p>
<p style="font-size:13px;color:#888;">— {{platform_name}}</p>
</body></html>',
    ARRAY['user_name', 'auction_title', 'current_bid', 'action_url', 'action_label', 'message', 'winner_payment_deadline', 'platform_name'],
    NULL,
    true,
    now(),
    now()
  )
ON CONFLICT (slug, channel, language, store_id) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  html = EXCLUDED.html,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  updated_at = now();
