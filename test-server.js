const http = require('http');

// Test if the server can be reached
const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`\nStatus Code: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Response:', json);
    } catch (e) {
      console.log('Response (raw):', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

const body = JSON.stringify({
  email: 'testuser123@example.com',
  password: 'test123456',
  name: 'Test User'
});

console.log('Sending request to POST http://localhost:5001/api/auth/signup');
console.log('Body:', body);

req.write(body);
req.end();
