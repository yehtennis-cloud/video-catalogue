console.log('auth.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  renderAuthStatus();

  const loginBtn = document.getElementById('loginBtn');
  const guestBtn = document.getElementById('guestBtn');

  if (loginBtn) loginBtn.addEventListener('click', loginAdmin);
  if (guestBtn) guestBtn.addEventListener('click', continueAsGuest);
});

async function loginAdmin() {
  console.log('Login button clicked');

  const email = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value.trim();
  const message = document.getElementById('loginMessage');

  if (!email || !password) {
    message.textContent = 'Email and password required';
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    message.textContent = error.message;
    return;
  }

  const { data: { user } } = await supabaseClient.auth.getUser();

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    message.textContent = 'Not authorized as admin';
    await supabaseClient.auth.signOut();
    return;
  }

  window.location.href = 'search.html';
}

function continueAsGuest() {
  window.location.href = 'search.html';
}

async function renderAuthStatus() {
  const statusDiv = document.getElementById('authStatus');
  if (!statusDiv) return;

  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    statusDiv.innerHTML = 'Browsing as <strong>Guest</strong>';
    return;
  }

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'admin') {
    statusDiv.innerHTML = `
      Logged in as <strong>Admin</strong>
      <button id="logoutBtn" style="margin-left:10px;">Logout</button>
    `;

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await supabaseClient.auth.signOut();
      window.location.href = 'index.html';
    });
  }
}
