// frontend/api.js
const API_BASE_URL = 'http://localhost:3000/api';

export async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };

    if (data) options.body = JSON.stringify(data);

    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'API request failed');
        return result;
    } catch (err) {
        console.error('API Error:', err);
        throw err;
    }
}