
async function testSignup() {
  const url = 'https://hidayah-lpqy.vercel.app/api/auth/signup';
  const body = JSON.stringify({ 
    username: 'testuser' + Math.floor(Math.random() * 1000), 
    email: 'test' + Math.floor(Math.random() * 1000) + '@example.com', 
    password: 'password123' 
  });
  
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

testSignup();
