export let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

export function setCurrentUser(user) {
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    updateUserUI();
}

export async function login(email, password) {
    const res = await apiCall('/auth/login', 'POST', { email, password });
    setCurrentUser(res.data);
    await loadCart(currentUser.id);
}

export async function register(name, email, password) {
    const res = await apiCall('/auth/register', 'POST', { name, email, password });
    setCurrentUser(res.data);
    await loadCart(currentUser.id);
}

export function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserUI();
}

export function updateUserUI() {
    const btn = document.querySelector('.action-btn:first-child');
    if (!btn) return;

    if (currentUser) {
        btn.innerHTML = `${currentUser.name}`;
        btn.onclick = () => { if(confirm('Logout?')) logout(); };
    } else {
        btn.textContent = 'Account';
        btn.onclick = () => alert('Show login modal');
    }
}