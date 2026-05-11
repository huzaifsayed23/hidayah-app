
async function testLogin() {
  const url = 'https://hidayah-lpqy.vercel.app/api/auth/login';
  const body = JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' });
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}

testLogin();
