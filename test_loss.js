const jwt = require('jsonwebtoken');

const token = jwt.sign(
    {
        userId: 'some-user-id',
        supermarketId: 'e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221',
        role: 'ADMIN'
    },
    process.env.JWT_SECRET || 'super-secret-key-v2',
    { expiresIn: '1h' }
);

fetch('http://localhost:3000/api/stock/expired', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${token}`
    },
    body: JSON.stringify({
        productId: '58dabf90-1e4a-488b-8500-293d8c0758df',
        batchId: 'b7011bcb-36e4-479c-9f0a-7d9f5d6e9d3c',
        quantity: 0.359,
        type: 'LOSS',
        note: ''
    })
}).then(r => r.json()).then(console.log).catch(console.error);
