export function showNotification(text, type = '') {
    const container = document.getElementById('notification-container');
    const msg = document.createElement('div');
    msg.className = `toast ${type}`;
    msg.textContent = text;
    container.appendChild(msg);
    setTimeout(() => { if (msg.parentNode) msg.remove(); }, 4000);
}