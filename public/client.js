// public/client.js

const API_URL = '/api';
let currentUser = null;

function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// Toast Notification System
function showToast(msg, type = 'info') {
    let box = document.getElementById('toast-box');
    if (!box) {
        box = document.createElement('div');
        box.id = 'toast-box';
        // Use inline style to reduce CSS file size dependency if desired, but we have CSS
        document.body.appendChild(box);
    }
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    box.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
    }, 3000);
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

function getAuthHeader() {
    if (!currentUser || !currentUser.token) return {};
    return { 'Authorization': `Bearer ${currentUser.token}` };
}

async function createChore(title, description, payment) {
    if (!currentUser) return;
    const res = await fetch(`${API_URL}/chores`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
        },
        body: JSON.stringify({
            title, description, payment,
            latitude: currentUser.latitude,
            longitude: currentUser.longitude
        })
    });
    return res.json();
}

async function payChore(choreId) {
    const res = await fetch(`${API_URL}/chores/${choreId}/pay`, {
        method: 'POST',
        headers: getAuthHeader()
    });
    return res.json();
}

async function getAvailableChores() {
    if (!currentUser) return [];
    const res = await fetch(`${API_URL}/chores?latitude=${currentUser.latitude}&longitude=${currentUser.longitude}`, {
        headers: getAuthHeader()
    });
    return res.json();
}

async function assignChore(choreId) {
    if (!currentUser) return;
    const res = await fetch(`${API_URL}/chores/${choreId}/assign`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
        }
    });
    return res.json();
}

async function completeChore(choreId) {
    const res = await fetch(`${API_URL}/chores/${choreId}/complete`, {
        method: 'POST',
        headers: getAuthHeader()
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
