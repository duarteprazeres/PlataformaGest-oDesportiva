
const axios = require('axios');

async function testLoginAndFetch() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post('http://localhost:3000/auth/global/login', {
            email: 'pai@teste.pt',
            password: '123456'
        });

        const token = loginRes.data.access_token;
        console.log('✅ Login successful. Token obtained.');

        console.log('2. Fetching Athletes...');
        const athletesRes = await axios.get('http://localhost:3000/athletes', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Fetch Athletes successful.');
        console.log('Athletes:', athletesRes.data);

    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 401) {
            console.error('⚠️ Still Unauthorized (401). Fix did not work or backend did not restart.');
        }
    }
}

testLoginAndFetch();
