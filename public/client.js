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

// Toast Notification System
function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);

    // Add close button for accessibility
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.onclick = () => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0 && container.parentNode) container.remove();
        }, 300);
    };
    toast.appendChild(closeBtn);

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
                if (container.children.length === 0 && container.parentNode) container.remove();
            }, 300); // Wait for fade out
        }
    }, duration);
}
