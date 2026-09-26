const http = require('http');
const { app, startServer } = require('./server');

let server;
let baseUrl;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = {};
    let data = null;

    if (body) {
      data = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(data);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch (e) {
            parsed = raw;
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('\n========================================');
  console.log(' RUNNING E-FIR SYSTEM AUTOMATED TESTS');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(` PASS: ${testName}`);
      passed++;
    } else {
      console.error(` FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.data.status === 'healthy', 'API Health Check returns 200 and healthy');

    // 2. Public categories lookup
    const categories = await request('GET', '/api/public/categories');
    assert(categories.status === 200 && categories.data.categories.length >= 10, 'Public Categories returns active categories list');

    // 3. Citizen Login
    const citizenLogin = await request('POST', '/api/auth/login', {
      email: 'citizen@example.com',
      password: 'Password@123',
    });
    assert(citizenLogin.status === 200 && citizenLogin.data.token, 'Citizen Login with valid credentials');
    const citizenToken = citizenLogin.data.token;

    // 4. Police Officer Login
    const policeLogin = await request('POST', '/api/auth/login', {
      email: 'police@example.com',
      password: 'Password@123',
    });
    assert(policeLogin.status === 200 && policeLogin.data.user.role === 'police', 'Police Officer Login with valid credentials');
    const policeToken = policeLogin.data.token;

    // 5. Admin Login
    const adminLogin = await request('POST', '/api/auth/login', {
      email: 'admin@example.com',
      password: 'Password@123',
    });
    assert(adminLogin.status === 200 && adminLogin.data.user.role === 'admin', 'Admin Login with valid credentials');
    const adminToken = adminLogin.data.token;

    // 6. Role Authorization: Citizen attempting police endpoint
    const forbiddenTest = await request('GET', '/api/police/dashboard', null, citizenToken);
    assert(forbiddenTest.status === 403, 'Role Authorization: Citizen blocked from police dashboard (HTTP 403)');

    // 7. Citizen Profile
    const profile = await request('GET', '/api/auth/profile', null, citizenToken);
    assert(profile.status === 200 && profile.data.user.email === 'citizen@example.com', 'Fetch Citizen Profile returns correct identity');

    // 8. Citizen Complaint Submission
    const newComplaint = await request(
      'POST',
      '/api/complaints',
      {
        categoryId: 1,
        policeStationId: 1,
        title: 'Automated Test: Lost Wallet at Bus Terminus',
        description: 'Black leather wallet with cards and cash lost near Bus Bay 4 during morning transit.',
        incidentDate: '2026-09-26',
        incidentTime: '08:30:00',
        incidentLocation: 'Kashmere Gate ISBT',
        district: 'Central Delhi',
        state: 'Delhi',
        pincode: '110006',
      },
      citizenToken
    );
    assert(
      newComplaint.status === 201 &&
        newComplaint.data.complaint &&
        newComplaint.data.complaint.complaint_number.startsWith('E-FIR-'),
      `Complaint Creation generates unique reference (${newComplaint.data?.complaint?.complaint_number})`
    );

    const createdComplaintId = newComplaint.data?.complaint?.id;

    // 9. Citizen Complaint Retrieval
    const myComplaints = await request('GET', '/api/complaints', null, citizenToken);
    assert(myComplaints.status === 200 && myComplaints.data.complaints.length > 0, 'Citizen Complaint Retrieval returns list');

    // 10. Status Tracking
    const statusTrack = await request('GET', `/api/complaints/status/${createdComplaintId}`);
    assert(statusTrack.status === 200 && statusTrack.data.statusData.status === 'Submitted', 'Public Status Tracking retrieves complaint status');

    // 11. Police Verification
    const verifyRes = await request(
      'PUT',
      `/api/police/complaints/${createdComplaintId}/verify`,
      { remarks: 'Verified by Officer in automated test suite' },
      policeToken
    );
    assert(verifyRes.status === 200 && verifyRes.data.complaint.status === 'Accepted', 'Police Verification sets status to Accepted');

    // 12. FIR Registration
    const firRes = await request(
      'POST',
      '/api/firs',
      {
        complaintId: createdComplaintId,
        sections: 'Section 379 IPC (Automated Test)',
        description: 'Formal First Information Report recorded post investigation officer verification.',
      },
      policeToken
    );
    assert(
      firRes.status === 201 && firRes.data.fir && firRes.data.fir.fir_number.startsWith('FIR/'),
      `Police FIR Registration generates official FIR number (${firRes.data?.fir?.fir_number})`
    );

    // 13. Notifications check
    const notifs = await request('GET', '/api/notifications', null, citizenToken);
    assert(notifs.status === 200 && notifs.data.notifications.length > 0, 'Notifications system delivered updates to citizen');

    // 14. Admin Analytics Dashboard
    const adminDash = await request('GET', '/api/admin/dashboard', null, adminToken);
    assert(adminDash.status === 200 && adminDash.data.stats.total_complaints > 0, 'Admin Dashboard metrics loaded with chart data');

    console.log('\n----------------------------------------');
    console.log(` TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('----------------------------------------\n');

    return failed === 0;
  } catch (err) {
    console.error('Test execution error:', err);
    return false;
  }
}

async function main() {
  const expressServer = await startServer();
  const address = expressServer.address();
  baseUrl = `http://localhost:${address.port}`;

  const allPassed = await runTests();

  expressServer.close(() => {
    process.exit(allPassed ? 0 : 1);
  });
}

main();
