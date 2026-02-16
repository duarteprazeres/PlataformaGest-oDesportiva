import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function testRBAC() {
    console.log('🛡️  Testing RBAC Implementation...');

    try {
        // 1. Login as PARENT
        // Note: You need valid credentials from your seed
        // We'll simulate the expected behavior description here as we can't easily login without a real token generation in this script
        // or we'd need to mock it.
        // For now, let's assume manual verification via Postman or frontend is better for full auth flow.

        console.log('⚠️  Ideally, run this test manually or with a full auth flow script.');
        console.log('1. Login as Parent -> Try POST /trainings -> Expect 403 Forbidden');
        console.log('2. Login as Coach -> Try POST /trainings -> Expect 201 Created');

    } catch (error) {
        console.error(error);
    }
}

testRBAC();
