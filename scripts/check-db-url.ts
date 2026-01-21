import fs from 'fs';
import path from 'path';

function checkEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.log('❌ .env.local not found');
        return;
    }
    const content = fs.readFileSync(envPath, 'utf8');
    const hasDbUrl = content.includes('DATABASE_URL=');
    const hasPostgresUrl = content.includes('POSTGRES_URL=');
    
    if (hasDbUrl) console.log('✅ DATABASE_URL found');
    else console.log('❌ DATABASE_URL not found');
    
    if (hasPostgresUrl) console.log('✅ POSTGRES_URL found');
    else console.log('❌ POSTGRES_URL not found');
}

checkEnv();
