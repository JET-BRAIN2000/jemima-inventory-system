(async () => {
  try {
    const base = 'http://localhost:4000';
    console.log('Logging in...');
    const loginRes = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@123' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginData));
    const token = loginData.token;
    console.log('Got token:', token ? 'yes' : 'no');

    const payload = {
      store_name: 'E2E Test Store',
      base_currency: 'USD',
      currency_symbol: '$',
      timezone: 'UTC+0',
      store_description: 'Updated by automated test',
      store_address: '123 Test Rd',
      store_phone: '+1 555 5555',
      store_email: 'test@example.com'
    };

    console.log('PUT /api/store with payload:', payload);
    const putRes = await fetch(base + '/api/store', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(payload)
    });
    const putData = await putRes.json();
    console.log('PUT response:', putData);

    console.log('GET /api/store to verify...');
    const getRes = await fetch(base + '/api/store', { headers: { 'Authorization': 'Bearer ' + token } });
    const getData = await getRes.json();
    console.log('GET response:', getData);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
