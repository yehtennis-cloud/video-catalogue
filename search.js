// Initialize Supabase
const SUPABASE_URL = "https://sdicmtmcanvswsisihqb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pAMpbQ_ZpucKn9X8xgQUdA_as-rPsa7";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Navigate back to submission page
// Navigate back to submission page
document.getElementById('backToSubmission').addEventListener('click', () => {
  window.location.href = 'submission.html';
});


// Load all tags and display as checkboxes
async function loadTags() {
  const { data: tags, error } = await supabaseClient
    .from('tags')
    .select('*')
    .order('name');

  if (error) {
    console.error("Error fetching tags:", error);
    return;
  }

  const container = document.getElementById('tagFilters');
  container.innerHTML = '';

  tags.forEach(tag => {
    const label = document.createElement('label');
    label.innerHTML = `
      <input type="checkbox" value="${tag.id}"> ${tag.name}
    `;
    container.appendChild(label);

    // Add listener to filter videos on change
    label.querySelector('input').addEventListener('change', filterVideos);

    container.appendChild(document.createTextNode(' '));
  });
}

// Load all approved videos (with optional filtering)
async function loadVideos() {
  const { data: videos, error } = await supabaseClient
    .from('videos')
    .select(`
      id, title, url, description,
      video_tags(tag_id)
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error fetching videos:", error);
    document.getElementById('videoResults').innerHTML = 'Error loading videos';
    return [];
  }

  return videos;
}

// Filter videos client-side based on selected tags
async function filterVideos() {
  const allVideos = await loadVideos();

  const selectedTagIds = [...document.querySelectorAll('#tagFilters input:checked')]
    .map(cb => cb.value);

  const filtered = selectedTagIds.length === 0
    ? allVideos
    : allVideos.filter(video => {
        const videoTagIds = video.video_tags.map(vt => vt.tag_id);
        return selectedTagIds.every(id => videoTagIds.includes(id));
      });

  displayVideos(filtered);
}

// Display a list of videos
function displayVideos(videos) {
  const container = document.getElementById('videoResults');
  if (!videos || videos.length === 0) {
    container.innerHTML = '<p>No videos found.</p>';
    return;
  }

  container.innerHTML = '';
  videos.forEach(video => {
    const div = document.createElement('div');
    div.className = 'video-card';
    div.innerHTML = `
      <h3>${video.title}</h3>
      <p>${video.description}</p>
      <a href="${video.url}" target="_blank">${video.url}</a>
    `;
    container.appendChild(div);
  });
}

// Initial page load
window.addEventListener('DOMContentLoaded', async () => {
  await loadTags();
  await filterVideos(); // show all approved videos initially
});
