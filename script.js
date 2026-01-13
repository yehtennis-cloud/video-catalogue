console.log("SCRIPT VERSION A — NO TOP LEVEL AWAIT");
// Make sure supabaseClient is defined at the top
const SUPABASE_URL = "https://sdicmtmcanvswsisihqb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pAMpbQ_ZpucKn9X8xgQUdA_as-rPsa7";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Load tags for the submission form
async function loadSubmitTags() {
  console.log("loadSubmitTags() called");

  const { data: tags, error } = await supabaseClient
    .from("tags")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching tags:", error);
    return;
  }

  console.log("Tags fetched:", tags);

  const container = document.getElementById("submitTags");
  if (!container) {
    console.error("#submitTags element not found");
    return;
  }

  container.innerHTML = "";

  tags.forEach(tag => {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="checkbox" value="${tag.id}">
      ${tag.name}
    `;
    container.appendChild(label);
    container.appendChild(document.createElement("br"));
  });
  console.log("Tags rendered successfully");
}

// Ensure the DOM is ready before calling
window.addEventListener("DOMContentLoaded", loadSubmitTags);

// Submission handler
document.getElementById("submitBtn").addEventListener("click", async () => {
  const title = document.getElementById("title").value.trim();
  const url = document.getElementById("url").value.trim();
  const descriptionInput = document.getElementById("description").value.trim();

  // Safe default if user leaves description blank
  const description = descriptionInput.length > 0 ? descriptionInput : "Submitted via website";

  const selectedTags = [...document.querySelectorAll("#submitTags input:checked")]
    .map(cb => cb.value);

  if (!title || !url || selectedTags.length === 0) {
    document.getElementById("submitMessage").textContent =
      "Title, URL, and at least one tag are required.";
    return;
  }

  console.log("Submitting video:", { title, url, description, selectedTags });

  // 1. Insert video
 const { data: video, error: videoError } = await supabaseClient
  .from("videos")
  .insert([{
    title,
    url,
    description,
    status: 'pending'   // explicitly include this to satisfy RLS
  }])
  .select()
  .single();


  if (videoError) {
    console.error("Video insert error:", videoError);
    document.getElementById("submitMessage").textContent = videoError.message;
    return;
  }

  console.log("Video inserted successfully:", video);

  // 2. Insert video_tags
  const videoTags = selectedTags.map(tagId => ({
    video_id: video.id,
    tag_id: tagId
  }));

  const { error: tagError } = await supabaseClient
    .from("video_tags")
    .insert(videoTags);

  if (tagError) {
    console.error("Video tags insert error:", tagError);
    document.getElementById("submitMessage").textContent = tagError.message;
    return;
  }

  console.log("Video tags inserted successfully");

  document.getElementById("submitMessage").textContent = "Video submitted for review!";

  // Clear form
  document.getElementById("title").value = "";
  document.getElementById("url").value = "";
  document.getElementById("description").value = "";
  document.querySelectorAll("#submitTags input:checked").forEach(cb => cb.checked = false);
});
// Load all pending videos
async function loadPendingVideos() {
  const { data: videos, error } = await supabaseClient
    .from('videos')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const container = document.getElementById('adminVideos');
  if (!container) return;

  if (error) {
    console.error('Error fetching pending videos:', error);
    container.innerHTML = '<p>Failed to load pending videos.</p>';
    return;
  }

  if (!videos || videos.length === 0) {
    container.innerHTML = '<p>No pending videos.</p>';
    return;
  }

  container.innerHTML = '';

  videos.forEach(video => {
    const div = document.createElement('div');
    div.style.border = '1px solid #ccc';
    div.style.padding = '10px';
    div.style.marginBottom = '10px';
    div.innerHTML = `
      <h3>${video.title}</h3>
      <p>${video.description}</p>
      <a href="${video.url}" target="_blank">${video.url}</a><br><br>
      <button data-id="${video.id}" class="approveBtn">Approve</button>
      <button data-id="${video.id}" class="denyBtn">Deny</button>
    `;
    container.appendChild(div);
  });

  // Attach click handlers
  document.querySelectorAll('.approveBtn').forEach(btn => {
    btn.addEventListener('click', () => updateVideoStatus(btn.dataset.id, 'approved'));
  });
  document.querySelectorAll('.denyBtn').forEach(btn => {
    btn.addEventListener('click', () => updateVideoStatus(btn.dataset.id, 'denied'));
  });
}

// Update video status in Supabase
async function updateVideoStatus(videoId, newStatus) {
  const { data, error } = await supabaseClient
    .from('videos')
    .update({ status: newStatus })
    .eq('id', videoId);

  if (error) {
    console.error('Error updating video status:', error);
    alert('Failed to update status: ' + error.message);
    return;
  }

  console.log('Video updated:', data);
  loadPendingVideos(); // Refresh list after update
}

// Call this when the admin page loads
window.addEventListener('DOMContentLoaded', loadPendingVideos);

async function checkAdminAccess() {
  const { data: { user }, error: userError } =
    await supabaseClient.auth.getUser();

  if (userError || !user) {
    console.log('No logged-in user');
    return;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return;
  }

  if (profile.role === 'admin') {
    const adminContainer = document.getElementById('adminVideos');
    if (adminContainer) {
      adminContainer.style.display = 'block';
    }
  }
}

window.addEventListener('DOMContentLoaded', checkAdminAccess);
document.getElementById('loginBtn')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    document.getElementById('authMessage').textContent = error.message;
    return;
  }

  document.getElementById('authMessage').textContent = 'Logged in';
  checkAdminAccess();
  if (profile.role === 'admin') {
  document.getElementById('adminVideos').style.display = 'block';
  document.getElementById('loginBtn').style.display = 'none';
  document.getElementById('logoutBtn').style.display = 'inline';
}

  loadPendingVideos();
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  document.getElementById('authMessage').textContent = 'Logged out';
  document.getElementById('adminVideos').style.display = 'none';
});
const SUPABASE_URL = "https://sdicmtmcanvswsisihqb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pAMpbQ_ZpucKn9X8xgQUdA_as-rPsa7";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Admin login
document.getElementById('loginBtn')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    document.getElementById('loginMessage').textContent = error.message;
    return;
  }

  // Verify admin role
  const { data: { user } } = await supabaseClient.auth.getUser();

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    document.getElementById('loginMessage').textContent =
      'Not authorized as admin';
    await supabaseClient.auth.signOut();
    return;
  }

  // Admin confirmed
  window.location.href = 'submission.html';
});

// Guest access
document.getElementById('guestBtn')?.addEventListener('click', () => {
  window.location.href = 'submission.html';
});
async function renderAuthStatus() {
  const statusDiv = document.getElementById('authStatus');
  if (!statusDiv) return;

  const { data: { user } } = await supabaseClient.auth.getUser();

  // Guest
  if (!user) {
    statusDiv.innerHTML = `
      Browsing as <span style="color:#555">Guest</span>
    `;
    return;
  }

  // Fetch role
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    statusDiv.textContent = 'Authentication error';
    return;
  }

  // Admin
  if (profile.role === 'admin') {
    statusDiv.innerHTML = `
      Logged in as <span style="color:green">Admin</span>
      <button id="logoutBtn" style="margin-left:10px;">Logout</button>
    `;

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await supabaseClient.auth.signOut();
      window.location.href = 'index.html';
    });
  }
}
window.addEventListener('DOMContentLoaded', renderAuthStatus);

document.addEventListener('DOMContentLoaded', () => {
  console.log('script.js loaded');

  const loginBtn = document.getElementById('loginBtn');
  const guestBtn = document.getElementById('guestBtn');

  if (loginBtn) {
    loginBtn.addEventListener('click', loginAdmin);
  }

  if (guestBtn) {
    guestBtn.addEventListener('click', () => {
      window.location.href = 'search.html';
    });
  }
});
async function loginAdmin() {
  console.log('Login button clicked');

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const message = document.getElementById('loginMessage');

  if (!email || !password) {
    message.textContent = 'Please enter email and password.';
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error(error);
    message.textContent = error.message;
    return;
  }

  console.log('Login successful');

  window.location.href = 'search.html';
}
