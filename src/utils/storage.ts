import axios from 'axios';

export async function getPRProgress(pr: string) {
    try {
        const response = await axios.get('https://hackpadtracker-eta.vercel.app/api/progress', {
            params: { pr }
        });
        console.log('Progress fetched:', response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.error('Error fetching progress:', error.response.status, error.response.statusText);
            } else {
                console.error('Error fetching progress:', error.message);
            }
        } else {
            console.error('Unexpected error:', error);
        }
    }
}

export async function savePRProgress(pr: string, progress: number, state: string) {
    try {
        const response = await axios.post('https://hackpadtracker-eta.vercel.app/api/progress', {
            pr,
            progress,
            state
        });
        console.log('Progress updated:', response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.error('Error updating progress:', error.response.status, error.response.statusText);
            } else {
                console.error('Error updating progress:', error.message);
            }
        } else {
            console.error('Unexpected error:', error);
        }
    }
}