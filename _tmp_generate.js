const { execSync } = require('child_process');
process.env.DATABASE_URL = 'postgresql://localhost:5432/dummy';
execSync('node node_modules/prisma/build/index.js generate', { stdio: 'inherit' });
