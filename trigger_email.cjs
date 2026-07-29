const { createClient } = require('@supabase/supabase-js');

async function triggerEmail() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  
  console.log('Fetching order...');
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', 'b0b98e0e-1fe0-4a78-aa4e-0cb9325286b2')
    .single();

  if (orderError) {
    console.error('Error fetching order:', orderError);
    return;
  }
  
  console.log('Invoking function...');
  const payload = { type: 'UPDATE', table: 'orders', record: order };
  const { data, error } = await supabase.functions.invoke('send-order-confirmation-email', {
    body: payload
  });

  if (error) {
    console.error('Error invoking function:', error);
  } else {
    console.log('Function invoked successfully:', data);
  }
}

triggerEmail();
