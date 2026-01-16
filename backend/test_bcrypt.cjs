// Quick test to verify exact backend password hashing
const bcrypt = require('bcryptjs');

async function test() {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Hash:', hash);

    const match = await bcrypt.compare(password, hash);
    console.log('Match:', match);

    // Test with the hash in the database
    const dbHash = '$2b$10$ocXgjX1F0BBVcG6t.7TBOOAz/MG9f9cKeZ6zrYUgQwrk2QBK1R1B2';
    const dbMatch = await bcrypt.compare(password, dbHash);
    console.log('DB Match:', dbMatch);
}

test();
