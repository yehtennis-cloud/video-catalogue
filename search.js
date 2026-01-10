// Initialize Supabase
const SUPABASE_URL = "https://sdicmtmcanvswsisihqb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pAMpbQ_ZpucKn9X8xgQUdA_as-rPsa7";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    container.appendChild(document.createElement('br'));
  });
}

// Load all approved videos (no filters yet)
async function loadVideos(tagIds = []) {
  const container = document.getElementById('videoResults');

  if (tagIds.length === 0) {
    // No tags selected → show all approved videos
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
      container.innerHTML = 'Error loading videos';
      return;
    }

    displayVideos(videos);
    return;
  }

  // Filter by tags: video must have all selected tags
  // Supabase cannot do "AND" across many-to-many directly, so we filter client-side
  const { data: videos, error } = await supabaseClient
    .from('videos')
    .select(`
      id, title, url, description,
      video_tags(tag_id)
    `)
    .eq('status', 'approved');

  if (error) {
    console.error("Error fetching videos:", error);
    container.innerHTML = 'Error loading videos';
    return;
  }

  // Keep only videos that contain all selected tags
  const filtered = videos.filter(video => {
    const videoTagIds = video.video_tags.map(vt => vt.tag_id);
    return tagIds.every(id => videoTagIds.includes(id));
  });

  displayVideos(filtered);
}

// Display a list of videos in the page
function displayVideos(videos) {
  const container = document.getElementById('videoResults');
  if (!videos || videos.length === 0) {
    container.innerHTML = '<p>No videos found.</p>';
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
      <a href="${video.url}" target="_blank">${video.url}</a>
    `;
    container.appendChild(div);
  });
}

// Event listener for search button
document.getElementById('searchBtn').addEventListener('click', () => {
  const selectedTagIds = [...document.querySelectorAll('#tagFilters input:checked')]
    .map(cb => cb.value);

  loadVideos(selectedTagIds);
});

// Initial load
window.addEventListener('DOMContentLoaded', () => {
  loadTags();
  loadVideos(); // show all approved videos by default
});
