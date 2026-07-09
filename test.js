const url = "https://hbdnzajbyjakdhuavrvb.supabase.co/rest/v1/products?limit=1";
const key = "sb_publishable_DnWWgf93ZvQuoAxM8U0xCw_HYrIy-hL";

fetch(url, {
  headers: {
    "apikey": key,
    "Authorization": `Bearer ${key}`
  }
}).then(r => r.json().then(data => console.log(r.status, data)));
