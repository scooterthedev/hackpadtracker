// Import modules using ES module syntax
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables (if you are using .env)
dotenv.config();

// Airtable API configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'patoXOlWhMRzk9tnB.9efabb416f71189cec993f0bd7212b5ebad497242d65a7745a92d0823789fadc';
const BASE_ID = process.env.BASE_ID || 'appj0zZfsSC7YuKvl';
const TABLE_NAME = process.env.TABLE_NAME || 'test';

const fetchAirtableData = async () => {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            },
        });
        return response.data.records;
    } catch (error) {
        console.error('Error fetching Airtable data:', error);
        return [];
    }
};

// Fetch and log the records
fetchAirtableData().then((records) => {
    console.log(records);
});
