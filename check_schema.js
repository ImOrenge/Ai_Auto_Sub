
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching jobs table:", error);
    } else {
        if (data && data.length > 0) {
            console.log("Columns found in 'jobs' table:", Object.keys(data[0]));
        } else {
            console.log("Jobs table is empty, trying another way to get columns...");
            // Try to insert a dummy row or something? No, let's just try to select some columns.
            // Or query information_schema if permitted.
            const { data: cols, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'jobs' });
            if (colError) {
                console.error("Error calling get_table_columns RPC:", colError);
            } else {
                console.log("Columns:", cols);
            }
        }
    }
}

checkSchema();
