const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_API_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const updateSupabase = async (records) => {
    for (const record of records) {
        const { id, fields } = record;

        const { error } = await supabase
            .from('YOUR_TABLE_NAME') // Replace with your Supabase table
            .upsert({
                id,  // Match Airtable record ID with Supabase row ID
                ...fields,
            });

        if (error) {
            console.error('Error updating Supabase:', error);
        } else {
            console.log('Updated record:', id);
        }
    }
};

fetchAirtableData().then((records) => {
    updateSupabase(records);
});
