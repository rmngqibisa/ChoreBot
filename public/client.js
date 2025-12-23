// public/client.js

const API_URL = '/api';
let currentUser = null;

function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

async function register(name, email, password, type, address, lat, lon) {
    const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, type, address, latitude: lat, longitude: lon })
    });
    return res.json();
}

async function login(email, password, type) {
    const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, type })
    });
    return res.json();
}

async function createChore(title, description, payment) {
    if (!currentUser) return;
    const res = await fetch(`${API_URL}/chores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title, description, payment,
            userId: currentUser.id,
            latitude: currentUser.latitude,
            longitude: currentUser.longitude
        })
    });
    return res.json();
}

async function payChore(choreId) {
    const res = await fetch(`${API_URL}/chores/${choreId}/pay`, {
        method: 'POST'
    });
    return res.json();
}

async function getAvailableChores() {
    if (!currentUser) return [];
    const res = await fetch(`${API_URL}/chores?latitude=${currentUser.latitude}&longitude=${currentUser.longitude}`);
    return res.json();
}

async function assignChore(choreId) {
    if (!currentUser) return;
    const res = await fetch(`${API_URL}/chores/${choreId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: currentUser.id })
    });
    return res.json();
}

async function completeChore(choreId) {
    const res = await fetch(`${API_URL}/chores/${choreId}/complete`, {
        method: 'POST'
    });
    return res.json();
}

// Geo helper
function getLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
                (err) => resolve({ lat: 40.7128, lon: -74.0060 }) // Default to NYC if denied/error
            );
        } else {
            resolve({ lat: 40.7128, lon: -74.0060 });
        }
    });
}
