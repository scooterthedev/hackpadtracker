import fetch from 'node-fetch';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

export async function fetchAirtableData() {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`, {
        headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
    });
    if (!response.ok) throw new Error("Failed to fetch data from Airtable");
    return await response.json();
}

export async function listenForAirtableChanges(callback) {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
    const headers = {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    };

    const fetchData = async () => {
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error("Failed to fetch data from Airtable");
        const data = await response.json();
        callback(data);
    };

    fetchData();
    setInterval(fetchData, 300000); // Fetch data every 5 minutes
}
