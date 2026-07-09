const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://hbdnzajbyjakdhuavrvb.supabase.co", "sb_publishable_DnWWgf93ZvQuoAxM8U0xCw_HYrIy-hL");
(async () => {
  const { data, error } = await supabase.from('user_login_history').select('*').limit(1);
  console.log(error || data);
})();
