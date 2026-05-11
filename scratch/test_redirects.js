
async function testRedirect() {
  const urls = [
    'https://hidayah-lpqy.vercel.app/api/auth/login',
    'https://hidayah-lpqy.vercel.app/api/auth/login/'
  ];
  
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'POST', redirect: 'manual' });
      console.log(`URL: ${url}`);
      console.log(`Status: ${res.status}`);
      console.log(`Location Header: ${res.headers.get('location')}`);
      console.log('---');
    } catch (e) {
      console.error(`Error for ${url}:`, e);
    }
  }
}

testRedirect();
