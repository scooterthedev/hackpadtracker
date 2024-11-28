import fetch from 'node-fetch';

const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const TABLE_NAME = import.meta.env.VITE_AIRTABLE_TABLE_NAME;

export async function fetchAirtableData() {
    if (!AIRTABLE_API_KEY || !BASE_ID || !TABLE_NAME) {
        throw new Error("Missing environment variables for Airtable configuration");
    }

    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`, {
        headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
    });

    if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Failed to fetch data from Airtable: ${response.status} ${response.statusText} - ${errorDetails}`);
    }

    return await response.json();
}

export async function listenForAirtableChanges(callback) {
    if (!AIRTABLE_API_KEY || !BASE_ID || !TABLE_NAME) {
        throw new Error("Missing environment variables for Airtable configuration");
    }

    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
    const headers = {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    };

    const fetchData = async () => {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`Failed to fetch data from Airtable: ${response.status} ${response.statusText} - ${errorDetails}`);
        }
        const data = await response.json();
        callback(data);
    };

    fetchData();
    setInterval(fetchData, 300000); // Fetch data every 5 minutes
}
