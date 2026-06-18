-- FAQ plateforme : traductions JSONB (EN) + RPC localisée

ALTER TABLE public.platform_faq_categories
  ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.platform_faq_items
  ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.faq_pick_translation(
  p_translations JSONB,
  p_locale TEXT,
  p_field TEXT,
  p_fallback TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    NULLIF(TRIM(p_translations -> p_locale ->> p_field), ''),
    p_fallback
  );
$$;

DROP FUNCTION IF EXISTS public.get_public_platform_faqs();

CREATE OR REPLACE FUNCTION public.get_public_platform_faqs(p_locale TEXT DEFAULT 'fr')
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH loc AS (
    SELECT CASE WHEN lower(split_part(COALESCE(p_locale, 'fr'), '-', 1)) = 'en' THEN 'en' ELSE 'fr' END AS code
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'slug', c.slug,
        'title', public.faq_pick_translation(c.translations, (SELECT code FROM loc), 'title', c.title),
        'description', public.faq_pick_translation(
          c.translations,
          (SELECT code FROM loc),
          'description',
          COALESCE(c.description, '')
        ),
        'audience', c.audience,
        'sort_order', c.sort_order,
        'items', (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', i.id,
                'question', public.faq_pick_translation(
                  i.translations,
                  (SELECT code FROM loc),
                  'question',
                  i.question
                ),
                'answer', public.faq_pick_translation(
                  i.translations,
                  (SELECT code FROM loc),
                  'answer',
                  i.answer
                ),
                'keywords', i.keywords,
                'sort_order', i.sort_order
              )
              ORDER BY i.sort_order, i.created_at
            ),
            '[]'::jsonb
          )
          FROM public.platform_faq_items i
          WHERE i.category_id = c.id AND i.is_active = true
        )
      )
      ORDER BY c.sort_order, c.created_at
    ),
    '[]'::jsonb
  )
  FROM public.platform_faq_categories c
  WHERE c.is_active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_platform_faqs(TEXT) TO anon, authenticated;

-- Catégories EN
UPDATE public.platform_faq_categories SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'title', 'Getting started on Emarzona',
    'description', 'Store creation, commerce types and first steps for sellers.'
  )
) WHERE slug = 'getting-started';

UPDATE public.platform_faq_categories SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'title', 'Product types',
    'description', 'Emarzona''s five verticals: digital, physical, service, course and artist.'
  )
) WHERE slug = 'product-types';

UPDATE public.platform_faq_categories SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'title', 'Payments and commissions',
    'description', 'Checkout, Moneroo, platform fees and invoicing.'
  )
) WHERE slug = 'payments';

UPDATE public.platform_faq_categories SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'title', 'Orders and shipping',
    'description', 'Order tracking, FedEx integration and post-payment fulfillment.'
  )
) WHERE slug = 'orders-shipping';

UPDATE public.platform_faq_categories SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'title', 'Digital products and courses',
    'description', 'Secure downloads, online courses and free enrollments.'
  )
) WHERE slug = 'digital-courses';

UPDATE public.platform_faq_categories SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'title', 'Account and security',
    'description', 'Authentication, personal data and disputes.'
  )
) WHERE slug = 'account-security';

UPDATE public.platform_faq_categories SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'title', 'Buyer guide',
    'description', 'Guest checkout, contacting sellers, refunds and affiliates.'
  )
) WHERE slug = 'buyers';

-- Questions EN (appariement catégorie + ordre)
UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'What is Emarzona?',
    'answer', 'Emarzona is an all-in-one e-commerce platform to sell digital products, physical goods, services, online courses and artist works from a personalized store. You manage catalog, orders, payments and customers in one place.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'getting-started' AND i.sort_order = 10;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'How do I create my first store?',
    'answer', 'Sign up at emarzona.com, complete your seller profile, choose your commerce type in store settings, then add your first products from the dashboard. Your store is available on a myemarzona.shop subdomain.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'getting-started' AND i.sort_order = 20;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'Which commerce types can I choose?',
    'answer', 'Emarzona offers five verticals: digital (files and licenses), physical (inventory and shipping), service (bookings and time slots), course (online training) and artist (artworks and editions). Your choice shapes the features available in your dashboard.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'getting-started' AND i.sort_order = 30;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'How much does Emarzona cost?',
    'answer', 'Plans and commissions are listed on the Pricing page. Emarzona charges a platform fee on successful sales depending on your plan; payment processing fees depend on your provider (e.g. Moneroo). Check your dashboard for payout details.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'getting-started' AND i.sort_order = 40;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'What types of products can I sell?',
    'answer', 'You can sell digital files, physical products with inventory, bookable services, courses with modules and quizzes, and artist works. Each type has tailored product pages and workflows.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'product-types' AND i.sort_order = 10;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'Can I sell multiple verticals in one store?',
    'answer', 'Depending on your store setup, you can offer several product families. The buyer cart supports multi-type items within checkout rules (some reserved services may require validation before payment).'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'product-types' AND i.sort_order = 20;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'What is an artist product on Emarzona?',
    'answer', 'The artist vertical lets you sell original or limited-edition works with dedicated listings, rich media and delivery or pickup options based on your configuration.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'product-types' AND i.sort_order = 30;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'How does the course catalog work?',
    'answer', 'Courses are listed on /courses and on your store. You structure modules, lessons and assessments from the dashboard. Free courses allow direct enrollment; paid courses go through Emarzona checkout.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'product-types' AND i.sort_order = 40;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'Which payment methods are accepted?',
    'answer', 'Emarzona integrates Moneroo for mobile money and cards in Africa, orchestrated from your dashboard. Other providers may be available depending on your region and admin configuration.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'payments' AND i.sort_order = 10;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'How do Emarzona commissions work?',
    'answer', 'A platform fee is applied on each successful sale according to your plan. Net balance is credited to your seller wallet; you can request a payout under the rules and timelines shown in Settings > Payments.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'payments' AND i.sort_order = 20;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'When does the seller receive funds?',
    'answer', 'Funds are recorded after payment confirmation. Availability and payout delays depend on the provider and any KYC checks. Track status in your seller dashboard or Admin > Payments.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'payments' AND i.sort_order = 30;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'Is VAT calculated automatically?',
    'answer', 'Emarzona checkout applies tax rules configured for your store and delivery zone. Review your tax settings and the invoice generated after purchase for tax details.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'payments' AND i.sort_order = 40;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'How do I track a physical order?',
    'answer', 'After payment you receive a confirmation email with your order number. Sign in to your customer account or use the tracking link from the seller to see shipping status and carrier tracking number.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'orders-shipping' AND i.sort_order = 10;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'Does Emarzona offer FedEx integration?',
    'answer', 'Yes, physical stores can connect FedEx to generate labels and track parcels. Configure the integration in Settings > Shipping and define your zones and rates.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'orders-shipping' AND i.sort_order = 20;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'What if fulfillment fails after payment?',
    'answer', 'Emarzona monitors post-payment fulfillment. If something goes wrong (stock, digital delivery, etc.), an alert is created for the team and the seller is notified. Contact support@emarzona.com for help.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'orders-shipping' AND i.sort_order = 30;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'Can I order multiple product types in one cart?',
    'answer', 'Yes, the Emarzona cart accepts items from different verticals (digital, physical, service, course, artist). Some combinations with reserved services may require validation before final payment.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'orders-shipping' AND i.sort_order = 40;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'How do I download a digital product after purchase?',
    'answer', 'After confirmed payment you receive an email with a secure download link. You can also access purchases from your customer account. Links are signed and time-limited to protect your files.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'digital-courses' AND i.sort_order = 10;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'Do download links expire?',
    'answer', 'Yes, download links are issued with a limited TTL for security. If a link expired, sign in to your account or contact support with your order number.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'digital-courses' AND i.sort_order = 20;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'How do I enroll in a free course?',
    'answer', 'Go to the course page or the /courses catalog and click Enroll for free. No payment is required; you access content from your learner space after enrollment.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'digital-courses' AND i.sort_order = 30;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'Are quizzes and certificates included?',
    'answer', 'Sellers can enable quizzes, attempts and certificates per course. After passing, a certificate or badge may be issued automatically depending on the instructor setup.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'digital-courses' AND i.sort_order = 40;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'How do I enable two-factor authentication?',
    'answer', 'From your account, open security settings and enable 2FA (authenticator app or SMS where available). We recommend 2FA for all seller accounts.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'account-security' AND i.sort_order = 10;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'Is my data GDPR compliant?',
    'answer', 'Emarzona processes data under its Privacy Policy. You can exercise access, rectification and deletion rights by emailing privacy@emarzona.com or via your account settings.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'account-security' AND i.sort_order = 20;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'How do I dispute an order?',
    'answer', 'Contact the seller first via the store page. If unresolved, open a dispute from your order or email support@emarzona.com with your order number and supporting documents.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'account-security' AND i.sort_order = 30;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'What if I forgot my password?',
    'answer', 'On the login page, click Forgot password and follow the email link. The link is single-use and expires after a limited time.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'account-security' AND i.sort_order = 40;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'Do I need an account to buy?',
    'answer', 'An account makes it easier to track orders, courses and downloads. Some stores support guest checkout; you will receive email confirmation with access links.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'buyers' AND i.sort_order = 10;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'How do I contact a seller?',
    'answer', 'Use the form or messaging on the seller''s store page. For platform questions (payment, account), contact support@emarzona.com.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'buyers' AND i.sort_order = 20;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'What is the refund policy?',
    'answer', 'Terms depend on the seller and product type. Read Emarzona''s Refund Policy and the terms shown before purchase. Digital products and services may have specific rules.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'buyers' AND i.sort_order = 30;

UPDATE public.platform_faq_items i SET translations = jsonb_build_object(
  'en', jsonb_build_object(
    'question', 'How do I join the affiliate program?',
    'answer', 'The affiliate program lets you promote products and earn commission on qualified sales. Sign up from your account or the Affiliate page, then share your referral links.'
  )
)
FROM public.platform_faq_categories c
WHERE i.category_id = c.id AND c.slug = 'buyers' AND i.sort_order = 40;
