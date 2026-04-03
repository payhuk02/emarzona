-- ================================================================
-- Notification System - Default Templates (English)
-- Date: 2 Février 2025
-- Description: Templates par défaut en anglais pour tous les types de notifications
-- ================================================================

-- Templates Email par défaut (Anglais)
INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  -- Digital Products
  ('digital_product_purchased', 'Digital Product Purchased', 'email', 'en', 
   '✅ Your purchase: {{product_name}}',
   'Hello {{user_name}},\n\nYour purchase of "{{product_name}}" has been confirmed.\n\nYou can now download your product from your account.\n\n{{action_url}}',
   '<h2>✅ Your purchase: {{product_name}}</h2><p>Hello {{user_name}},</p><p>Your purchase of "<strong>{{product_name}}</strong>" has been confirmed.</p><p>You can now download your product from your account.</p><p><a href="{{action_url}}">Download now</a></p>',
   ARRAY['user_name', 'product_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('digital_product_download_ready', 'Download Ready', 'email', 'en',
   '📥 Your product is ready to download',
   'Hello {{user_name}},\n\nYour product "{{product_name}}" is now ready to download.\n\n{{action_url}}',
   '<h2>📥 Your product is ready</h2><p>Hello {{user_name}},</p><p>Your product "<strong>{{product_name}}</strong>" is now ready to download.</p><p><a href="{{action_url}}">Download</a></p>',
   ARRAY['user_name', 'product_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('digital_product_version_update', 'Version Update', 'email', 'en',
   '🆕 New version available: {{product_name}}',
   'Hello {{user_name}},\n\nA new version of "{{product_name}}" is available (v{{version}}).\n\n{{changelog}}\n\n{{action_url}}',
   '<h2>🆕 New version available</h2><p>Hello {{user_name}},</p><p>A new version of "<strong>{{product_name}}</strong>" is available (v{{version}}).</p><p>{{changelog}}</p><p><a href="{{action_url}}">Download update</a></p>',
   ARRAY['user_name', 'product_name', 'version', 'changelog', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('digital_product_license_expiring', 'License Expiring Soon', 'email', 'en',
   '⏰ Your license expires soon',
   'Hello {{user_name}},\n\nYour license for "{{product_name}}" expires in {{days_left}} day(s).\n\nRenew now to continue using the product.\n\n{{action_url}}',
   '<h2>⏰ Your license expires soon</h2><p>Hello {{user_name}},</p><p>Your license for "<strong>{{product_name}}</strong>" expires in <strong>{{days_left}} day(s)</strong>.</p><p>Renew now to continue using the product.</p><p><a href="{{action_url}}">Renew</a></p>',
   ARRAY['user_name', 'product_name', 'days_left', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('digital_product_license_expired', 'License Expired', 'email', 'en',
   '❌ Your license has expired',
   'Hello {{user_name}},\n\nYour license for "{{product_name}}" has expired.\n\nRenew now to continue using the product.\n\n{{action_url}}',
   '<h2>❌ Your license has expired</h2><p>Hello {{user_name}},</p><p>Your license for "<strong>{{product_name}}</strong>" has expired.</p><p>Renew now to continue using the product.</p><p><a href="{{action_url}}">Renew</a></p>',
   ARRAY['user_name', 'product_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

  -- Physical Products
INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('physical_product_order_placed', 'Order Placed', 'email', 'en',
   '✅ Order confirmed #{{order_number}}',
   'Hello {{user_name}},\n\nYour order #{{order_number}} has been confirmed.\n\nTotal: {{total}} {{currency}}\n\nWe will keep you informed about your order progress.',
   '<h2>✅ Order confirmed</h2><p>Hello {{user_name}},</p><p>Your order <strong>#{{order_number}}</strong> has been confirmed.</p><p><strong>Total:</strong> {{total}} {{currency}}</p><p>We will keep you informed about your order progress.</p><p><a href="{{action_url}}">View order</a></p>',
   ARRAY['user_name', 'order_number', 'total', 'currency', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('physical_product_order_confirmed', 'Order Confirmed', 'email', 'en',
   '✅ Order confirmed #{{order_number}}',
   'Hello {{user_name}},\n\nYour order #{{order_number}} has been confirmed and is being prepared.\n\n{{action_url}}',
   '<h2>✅ Order confirmed</h2><p>Hello {{user_name}},</p><p>Your order <strong>#{{order_number}}</strong> has been confirmed and is being prepared.</p><p><a href="{{action_url}}">Track order</a></p>',
   ARRAY['user_name', 'order_number', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('physical_product_order_shipped', 'Order Shipped', 'email', 'en',
   '📦 Your order has been shipped',
   'Hello {{user_name}},\n\nYour order #{{order_number}} has been shipped.\n\nTracking number: {{tracking_number}}\n\n{{action_url}}',
   '<h2>📦 Your order has been shipped</h2><p>Hello {{user_name}},</p><p>Your order <strong>#{{order_number}}</strong> has been shipped.</p><p><strong>Tracking number:</strong> {{tracking_number}}</p><p><a href="{{action_url}}">Track shipment</a></p>',
   ARRAY['user_name', 'order_number', 'tracking_number', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('physical_product_order_delivered', 'Order Delivered', 'email', 'en',
   '🎉 Your order has been delivered',
   'Hello {{user_name}},\n\nYour order #{{order_number}} has been delivered.\n\nWe hope you are satisfied with your purchase!\n\n{{action_url}}',
   '<h2>🎉 Your order has been delivered</h2><p>Hello {{user_name}},</p><p>Your order <strong>#{{order_number}}</strong> has been delivered.</p><p>We hope you are satisfied with your purchase!</p><p><a href="{{action_url}}">View order</a></p>',
   ARRAY['user_name', 'order_number', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('physical_product_order_cancelled', 'Order Cancelled', 'email', 'en',
   '❌ Order cancelled #{{order_number}}',
   'Hello {{user_name}},\n\nYour order #{{order_number}} has been cancelled.\n\nReason: {{reason}}\n\n{{action_url}}',
   '<h2>❌ Order cancelled</h2><p>Hello {{user_name}},</p><p>Your order <strong>#{{order_number}}</strong> has been cancelled.</p><p><strong>Reason:</strong> {{reason}}</p><p><a href="{{action_url}}">View details</a></p>',
   ARRAY['user_name', 'order_number', 'reason', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('physical_product_low_stock', 'Low Stock', 'email', 'en',
   '⚠️ Low stock: {{product_name}}',
   'Hello {{user_name}},\n\nThe product "{{product_name}}" has low stock ({{stock_quantity}} units remaining).\n\n{{action_url}}',
   '<h2>⚠️ Low stock</h2><p>Hello {{user_name}},</p><p>The product "<strong>{{product_name}}</strong>" has low stock (<strong>{{stock_quantity}} units remaining</strong>).</p><p><a href="{{action_url}}">View product</a></p>',
   ARRAY['user_name', 'product_name', 'stock_quantity', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('physical_product_out_of_stock', 'Out of Stock', 'email', 'en',
   '❌ Out of stock: {{product_name}}',
   'Hello {{user_name}},\n\nThe product "{{product_name}}" is out of stock.\n\n{{action_url}}',
   '<h2>❌ Out of stock</h2><p>Hello {{user_name}},</p><p>The product "<strong>{{product_name}}</strong>" is out of stock.</p><p><a href="{{action_url}}">View product</a></p>',
   ARRAY['user_name', 'product_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('physical_product_back_in_stock', 'Back in Stock', 'email', 'en',
   '✅ {{product_name}} is back in stock',
   'Hello {{user_name}},\n\nThe product "{{product_name}}" is back in stock!\n\n{{action_url}}',
   '<h2>✅ Back in stock</h2><p>Hello {{user_name}},</p><p>The product "<strong>{{product_name}}</strong>" is back in stock!</p><p><a href="{{action_url}}">Buy now</a></p>',
   ARRAY['user_name', 'product_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

  -- Services
INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('service_booking_confirmed', 'Booking Confirmed', 'email', 'en',
   '✅ Booking confirmed',
   'Hello {{user_name}},\n\nYour booking for "{{service_name}}" has been confirmed.\n\nDate: {{booking_date}}\nTime: {{booking_time}}\n\n{{action_url}}',
   '<h2>✅ Booking confirmed</h2><p>Hello {{user_name}},</p><p>Your booking for "<strong>{{service_name}}</strong>" has been confirmed.</p><p><strong>Date:</strong> {{booking_date}}<br><strong>Time:</strong> {{booking_time}}</p><p><a href="{{action_url}}">View booking</a></p>',
   ARRAY['user_name', 'service_name', 'booking_date', 'booking_time', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('service_booking_reminder', 'Booking Reminder', 'email', 'en',
   '⏰ Reminder: Your booking is approaching',
   'Hello {{user_name}},\n\nReminder: Your booking for "{{service_name}}" is scheduled for {{booking_date}} at {{booking_time}}.\n\n{{action_url}}',
   '<h2>⏰ Booking reminder</h2><p>Hello {{user_name}},</p><p>Reminder: Your booking for "<strong>{{service_name}}</strong>" is scheduled for <strong>{{booking_date}}</strong> at <strong>{{booking_time}}</strong>.</p><p><a href="{{action_url}}">View booking</a></p>',
   ARRAY['user_name', 'service_name', 'booking_date', 'booking_time', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('service_booking_cancelled', 'Booking Cancelled', 'email', 'en',
   '❌ Booking cancelled',
   'Hello {{user_name}},\n\nYour booking for "{{service_name}}" has been cancelled.\n\nReason: {{reason}}\n\n{{action_url}}',
   '<h2>❌ Booking cancelled</h2><p>Hello {{user_name}},</p><p>Your booking for "<strong>{{service_name}}</strong>" has been cancelled.</p><p><strong>Reason:</strong> {{reason}}</p><p><a href="{{action_url}}">View details</a></p>',
   ARRAY['user_name', 'service_name', 'reason', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('service_booking_completed', 'Booking Completed', 'email', 'en',
   '✅ Booking completed',
   'Hello {{user_name}},\n\nYour booking for "{{service_name}}" has been completed.\n\nThank you for using our services!\n\n{{action_url}}',
   '<h2>✅ Booking completed</h2><p>Hello {{user_name}},</p><p>Your booking for "<strong>{{service_name}}</strong>" has been completed.</p><p>Thank you for using our services!</p><p><a href="{{action_url}}">Leave a review</a></p>',
   ARRAY['user_name', 'service_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('service_payment_required', 'Payment Required', 'email', 'en',
   '💳 Payment required for your booking',
   'Hello {{user_name}},\n\nA payment is required for your booking "{{service_name}}".\n\nAmount: {{amount}} {{currency}}\n\n{{action_url}}',
   '<h2>💳 Payment required</h2><p>Hello {{user_name}},</p><p>A payment is required for your booking "<strong>{{service_name}}</strong>".</p><p><strong>Amount:</strong> {{amount}} {{currency}}</p><p><a href="{{action_url}}">Pay now</a></p>',
   ARRAY['user_name', 'service_name', 'amount', 'currency', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

  -- Courses
INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('course_enrollment', 'Course Enrollment', 'email', 'en',
   '🎓 Enrollment confirmed: {{course_name}}',
   'Hello {{user_name}},\n\nYour enrollment in the course "{{course_name}}" has been confirmed.\n\nStart learning now!\n\n{{action_url}}',
   '<h2>🎓 Enrollment confirmed</h2><p>Hello {{user_name}},</p><p>Your enrollment in the course "<strong>{{course_name}}</strong>" has been confirmed.</p><p>Start learning now!</p><p><a href="{{action_url}}">Access course</a></p>',
   ARRAY['user_name', 'course_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('course_lesson_complete', 'Lesson Complete', 'email', 'en',
   '✅ Lesson completed: {{lesson_name}}',
   'Hello {{user_name}},\n\nCongratulations! You have completed the lesson "{{lesson_name}}".\n\nContinue your learning!\n\n{{action_url}}',
   '<h2>✅ Lesson completed</h2><p>Hello {{user_name}},</p><p>Congratulations! You have completed the lesson "<strong>{{lesson_name}}</strong>".</p><p>Continue your learning!</p><p><a href="{{action_url}}">Next lesson</a></p>',
   ARRAY['user_name', 'lesson_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('course_complete', 'Course Complete', 'email', 'en',
   '🎉 Congratulations! Course completed',
   'Hello {{user_name}},\n\nCongratulations! You have completed the course "{{course_name}}".\n\nYou have done excellent work!\n\n{{action_url}}',
   '<h2>🎉 Congratulations!</h2><p>Hello {{user_name}},</p><p>Congratulations! You have completed the course "<strong>{{course_name}}</strong>".</p><p>You have done excellent work!</p><p><a href="{{action_url}}">View certificate</a></p>',
   ARRAY['user_name', 'course_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('course_certificate_ready', 'Certificate Ready', 'email', 'en',
   '🏆 Your certificate is ready',
   'Hello {{user_name}},\n\nYour certificate for the course "{{course_name}}" is now available.\n\n{{action_url}}',
   '<h2>🏆 Your certificate is ready</h2><p>Hello {{user_name}},</p><p>Your certificate for the course "<strong>{{course_name}}</strong>" is now available.</p><p><a href="{{action_url}}">Download certificate</a></p>',
   ARRAY['user_name', 'course_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('course_new_content', 'New Content', 'email', 'en',
   '🆕 New content available',
   'Hello {{user_name}},\n\nNew content is available in the course "{{course_name}}".\n\n{{content_description}}\n\n{{action_url}}',
   '<h2>🆕 New content available</h2><p>Hello {{user_name}},</p><p>New content is available in the course "<strong>{{course_name}}</strong>".</p><p>{{content_description}}</p><p><a href="{{action_url}}">View new content</a></p>',
   ARRAY['user_name', 'course_name', 'content_description', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('course_quiz_passed', 'Quiz Passed', 'email', 'en',
   '✅ Quiz passed: {{quiz_name}}',
   'Hello {{user_name}},\n\nCongratulations! You passed the quiz "{{quiz_name}}" with a score of {{score}}%.\n\n{{action_url}}',
   '<h2>✅ Quiz passed</h2><p>Hello {{user_name}},</p><p>Congratulations! You passed the quiz "<strong>{{quiz_name}}</strong>" with a score of <strong>{{score}}%</strong>.</p><p><a href="{{action_url}}">View results</a></p>',
   ARRAY['user_name', 'quiz_name', 'score', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('course_quiz_failed', 'Quiz Failed', 'email', 'en',
   '❌ Quiz failed: {{quiz_name}}',
   'Hello {{user_name}},\n\nYou did not pass the quiz "{{quiz_name}}" (score: {{score}}%).\n\nYou can try again!\n\n{{action_url}}',
   '<h2>❌ Quiz failed</h2><p>Hello {{user_name}},</p><p>You did not pass the quiz "<strong>{{quiz_name}}</strong>" (score: <strong>{{score}}%</strong>).</p><p>You can try again!</p><p><a href="{{action_url}}">Retry</a></p>',
   ARRAY['user_name', 'quiz_name', 'score', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

  -- Artists
INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('artist_product_purchased', 'Artist Product Purchased', 'email', 'en',
   '✅ Your purchase: {{product_name}}',
   'Hello {{user_name}},\n\nYour purchase of "{{product_name}}" by {{artist_name}} has been confirmed.\n\n{{action_url}}',
   '<h2>✅ Your purchase</h2><p>Hello {{user_name}},</p><p>Your purchase of "<strong>{{product_name}}</strong>" by <strong>{{artist_name}}</strong> has been confirmed.</p><p><a href="{{action_url}}">View product</a></p>',
   ARRAY['user_name', 'product_name', 'artist_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('artist_product_certificate_ready', 'Certificate of Authenticity Ready', 'email', 'en',
   '🏆 Certificate of authenticity available',
   'Hello {{user_name}},\n\nYour certificate of authenticity for "{{product_name}}" is now available.\n\n{{action_url}}',
   '<h2>🏆 Certificate of authenticity available</h2><p>Hello {{user_name}},</p><p>Your certificate of authenticity for "<strong>{{product_name}}</strong>" is now available.</p><p><a href="{{action_url}}">Download certificate</a></p>',
   ARRAY['user_name', 'product_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('artist_product_edition_sold_out', 'Edition Sold Out', 'email', 'en',
   '⚠️ Edition sold out: {{product_name}}',
   'Hello {{user_name}},\n\nThe edition "{{edition_name}}" of "{{product_name}}" is now sold out.\n\n{{action_url}}',
   '<h2>⚠️ Edition sold out</h2><p>Hello {{user_name}},</p><p>The edition "<strong>{{edition_name}}</strong>" of "<strong>{{product_name}}</strong>" is now sold out.</p><p><a href="{{action_url}}">View other editions</a></p>',
   ARRAY['user_name', 'product_name', 'edition_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('artist_product_shipping_update', 'Shipping Update', 'email', 'en',
   '📦 Shipping update',
   'Hello {{user_name}},\n\nUpdate regarding the shipment of "{{product_name}}".\n\n{{shipping_status}}\n\n{{action_url}}',
   '<h2>📦 Shipping update</h2><p>Hello {{user_name}},</p><p>Update regarding the shipment of "<strong>{{product_name}}</strong>".</p><p>{{shipping_status}}</p><p><a href="{{action_url}}">Track shipment</a></p>',
   ARRAY['user_name', 'product_name', 'shipping_status', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

  -- General
INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('order_payment_received', 'Payment Received', 'email', 'en',
   '✅ Payment received',
   'Hello {{user_name}},\n\nYour payment of {{amount}} {{currency}} has been confirmed.\n\n{{action_url}}',
   '<h2>✅ Payment received</h2><p>Hello {{user_name}},</p><p>Your payment of <strong>{{amount}} {{currency}}</strong> has been confirmed.</p><p><a href="{{action_url}}">View transaction</a></p>',
   ARRAY['user_name', 'amount', 'currency', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('order_payment_failed', 'Payment Failed', 'email', 'en',
   '❌ Payment failed',
   'Hello {{user_name}},\n\nYour payment of {{amount}} {{currency}} has failed.\n\nReason: {{reason}}\n\n{{action_url}}',
   '<h2>❌ Payment failed</h2><p>Hello {{user_name}},</p><p>Your payment of <strong>{{amount}} {{currency}}</strong> has failed.</p><p><strong>Reason:</strong> {{reason}}</p><p><a href="{{action_url}}">Retry</a></p>',
   ARRAY['user_name', 'amount', 'currency', 'reason', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('order_refund_processed', 'Refund Processed', 'email', 'en',
   '💰 Refund processed',
   'Hello {{user_name}},\n\nYour refund of {{amount}} {{currency}} has been processed.\n\n{{action_url}}',
   '<h2>💰 Refund processed</h2><p>Hello {{user_name}},</p><p>Your refund of <strong>{{amount}} {{currency}}</strong> has been processed.</p><p><a href="{{action_url}}">View details</a></p>',
   ARRAY['user_name', 'amount', 'currency', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('affiliate_commission_earned', 'Commission Earned', 'email', 'en',
   '💰 Commission earned',
   'Hello {{user_name}},\n\nYou have earned a commission of {{amount}} {{currency}}.\n\n{{action_url}}',
   '<h2>💰 Commission earned</h2><p>Hello {{user_name}},</p><p>You have earned a commission of <strong>{{amount}} {{currency}}</strong>.</p><p><a href="{{action_url}}">View details</a></p>',
   ARRAY['user_name', 'amount', 'currency', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('affiliate_commission_paid', 'Commission Paid', 'email', 'en',
   '✅ Commission paid',
   'Hello {{user_name}},\n\nYour commission of {{amount}} {{currency}} has been paid.\n\n{{action_url}}',
   '<h2>✅ Commission paid</h2><p>Hello {{user_name}},</p><p>Your commission of <strong>{{amount}} {{currency}}</strong> has been paid.</p><p><a href="{{action_url}}">View details</a></p>',
   ARRAY['user_name', 'amount', 'currency', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('product_review_received', 'Review Received', 'email', 'en',
   '⭐ New review received',
   'Hello {{user_name}},\n\nA new review has been left on your product "{{product_name}}".\n\nRating: {{rating}}/5\n\n{{action_url}}',
   '<h2>⭐ New review received</h2><p>Hello {{user_name}},</p><p>A new review has been left on your product "<strong>{{product_name}}</strong>".</p><p><strong>Rating:</strong> {{rating}}/5</p><p><a href="{{action_url}}">View review</a></p>',
   ARRAY['user_name', 'product_name', 'rating', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('system_announcement', 'System Announcement', 'email', 'en',
   '📢 {{title}}',
   'Hello {{user_name}},\n\n{{message}}\n\n{{action_url}}',
   '<h2>📢 {{title}}</h2><p>Hello {{user_name}},</p><p>{{message}}</p><p><a href="{{action_url}}">Learn more</a></p>',
   ARRAY['user_name', 'title', 'message', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

