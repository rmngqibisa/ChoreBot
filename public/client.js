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

// Toast notification helper
function showToast(message, type = 'success') {
    // Remove existing toast if any to prevent stacking overflow, or stack them?
    // For simplicity, let's remove existing ones or just append.
    // Let's allow stacking but maybe limit it? For now, standard append is fine.

    const toast = document.createElement('div');
    toast.className = `alert alert-${type} toast`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease-out';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
