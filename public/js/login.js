// Clear previous session when on login page
localStorage.removeItem('logId');
localStorage.removeItem('username');

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const messageEl = document.getElementById('message');

    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem('logId', data.data.logId);
            localStorage.setItem('username', data.data.username);
            window.location.href = 'logs.html';
        } else {
            // Usually if user exists, the API returns error. 
            // Better to handle "login" if user exists.
            // But current createUser implementation returns error if exists.
            // Let's assume for this demo we just show the error.
            if (data.error === 'Username already exists') {
                // In a real app we would have a separate login, but here let's just 
                // Note: Ideally we should fix the backend to return the existing user or have a login endpoint.
                // For now, let's just tell user.
                messageEl.textContent = 'User already exists. (Ideally this would be a login flow)';
            } else {
                messageEl.textContent = data.error;
            }
        }
    } catch (err) {
        messageEl.textContent = 'Connection error';
    }
});
