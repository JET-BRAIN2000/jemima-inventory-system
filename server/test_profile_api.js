// Quick end-to-end test for profile save/load
// Run: node test_profile_api.js

const BASE = 'http://localhost:4000';

async function req(method, path, body, token) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const r = await fetch(`${BASE}${path}`, opts);
  const json = await r.json().catch(() => ({}));
  return { status: r.status, data: json };
}

async function run() {
  console.log('=== PROFILE API TEST ===\n');

  // 1. Login
  console.log('1. Logging in as admin...');
  const login = await req('POST', '/api/auth/login', { username: 'admin', password: 'Admin@123' });
  if (!login.data.token) { console.error('  FAIL: login failed', login.data); process.exit(1); }
  const token = login.data.token;
  console.log('  OK: logged in, got token\n');

  // 2. Get current profile
  console.log('2. Fetching current profile...');
  const get1 = await req('GET', '/api/profile', null, token);
  console.log('  Current profile:', JSON.stringify(get1.data, null, 2), '\n');

  // 3. Update with phone, date_of_birth, address
  const testPhone    = '+234 900 555 1234';
  const testDob      = '1990-05-15';
  const testAddress  = '45 Bode Thomas Street, Surulere, Lagos';

  console.log('3. Saving phone, date_of_birth, address...');
  const put = await req('PUT', '/api/profile', {
    full_name:           get1.data?.full_name || 'Jemima Store Admin',
    job_title:           get1.data?.job_title  || 'Store Owner',
    phone_number:        testPhone,
    date_of_birth:       testDob,
    address:             testAddress,
    profile_picture_path: '',
  }, token);
  console.log('  PUT status:', put.status);
  console.log('  Returned profile from DB:', JSON.stringify(put.data?.profile, null, 2), '\n');

  if (put.status !== 200) { console.error('  FAIL: PUT failed'); process.exit(1); }

  // 4. Fetch again and verify
  console.log('4. Fetching profile again to verify DB persistence...');
  const get2 = await req('GET', '/api/profile', null, token);
  console.log('  Retrieved profile:', JSON.stringify(get2.data, null, 2), '\n');

  const ok = (
    get2.data?.phone_number  === testPhone   &&
    get2.data?.date_of_birth === testDob     &&
    get2.data?.address       === testAddress
  );

  if (ok) {
    console.log('✅ ALL CHECKS PASSED');
    console.log(`  phone_number  : "${get2.data.phone_number}"  ✓`);
    console.log(`  date_of_birth : "${get2.data.date_of_birth}"  ✓`);
    console.log(`  address       : "${get2.data.address}"  ✓`);
  } else {
    console.error('❌ CHECKS FAILED');
    console.error(`  phone_number  : got "${get2.data?.phone_number}"   expected "${testPhone}"`);
    console.error(`  date_of_birth : got "${get2.data?.date_of_birth}"  expected "${testDob}"`);
    console.error(`  address       : got "${get2.data?.address}"        expected "${testAddress}"`);
    process.exit(1);
  }

  // 5. Test empty date_of_birth doesn't break (1900 sentinel handling)
  console.log('\n5. Testing empty date_of_birth (sentinel handling)...');
  const put2 = await req('PUT', '/api/profile', {
    full_name:    get2.data.full_name,
    job_title:    get2.data.job_title,
    phone_number: '+234 900 555 1234',
    date_of_birth: '',   // intentionally empty
    address:      testAddress,
    profile_picture_path: '',
  }, token);
  const get3 = await req('GET', '/api/profile', null, token);
  const emptyDobOk = get3.data?.date_of_birth === '';
  console.log(`  date_of_birth when empty: "${get3.data?.date_of_birth}" → ${emptyDobOk ? '✅ returns "" (not "1900-01-01")' : '❌ FAIL'}`);

  // Restore original phone
  await req('PUT', '/api/profile', {
    full_name:    get2.data.full_name,
    job_title:    get2.data.job_title,
    phone_number: testPhone,
    date_of_birth: testDob,
    address:      testAddress,
    profile_picture_path: '',
  }, token);

  console.log('\n=== TEST COMPLETE ===');
  process.exit(0);
}

run().catch(e => { console.error('Unhandled error:', e); process.exit(1); });
