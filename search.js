// search.js
let selectedTagIds = new Set();
let allTags = [];
let currentMode = 'title'; // or 'tags'

// ─── DOM elements ────────────────────────────────────────────────
const searchInput    = document.getElementById('searchInput');
const tagsContainer  = document.getElementById('tagsContainer');
const videoResults   = document.getElementById('videoResults');     // add this too (you use it later)
const modeRadios     = document.querySelectorAll('input[name="searchMode"]');

// ─── Back button ─────────────────────────────────────────────────
document.getElementById('backToSubmission')?.addEventListener('click', () => {
  window.location.href = 'submission.html';
});

// ─── Switch between search modes ─────────────────────────────────
modeRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    currentMode = e.target.value;
    tagsContainer.style.display = currentMode === 'tags' ? 'grid' : 'none';
    if (currentMode === 'tags') {
      searchInput.value = ''; // optional: clear title search
    }
    filterVideos();
  });
});

// The rest of your code remains unchanged...
// (loadTags, renderTagGrid, filterVideos, displayVideos, event listeners, init, etc.)
// Load tags once + create nice clickable grid
async function loadTags() {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error loading tags:', error);
    return [];
  }

  allTags = data;
  renderTagGrid();
  return data;
}

function renderTagGrid() {
  tagsContainer.innerHTML = '';
  allTags.forEach(tag => {
    const el = document.createElement('div');
    el.className = 'tag-item';
    el.textContent = tag.name;
    el.dataset.tagId = tag.id;

    el.addEventListener('click', () => {
      el.classList.toggle('selected');
      if (el.classList.contains('selected')) {
        selectedTagIds.add(tag.id);
      } else {
        selectedTagIds.delete(tag.id);
      }
      filterVideos();
    });

    tagsContainer.appendChild(el);
  });
}

// Main filtering function
async function filterVideos() {
  videoResults.innerHTML = '<p>Loading...</p>';

  let query = supabase
    .from('videos')
    .select(`
      id, title, url, description, status, created_at,
      video_tags!inner (tag_id)
    `)
    .eq('status', 'approved');

  // Title search (only when in title mode and input has value)
  if (currentMode === 'title' && searchInput.value.trim().length > 1) {
    query = query.ilike('title', `%${searchInput.value.trim()}%`);
  }

  // Tag filter (when in tags mode and at least one selected)
  if (currentMode === 'tags' && selectedTagIds.size > 0) {
    query = query.in('video_tags.tag_id', Array.from(selectedTagIds));
  }

  const { data: videos, error } = await query
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Search error:', error);
    videoResults.innerHTML = '<p style="color:red">Error loading videos</p>';
    return;
  }

  displayVideos(videos || []);
}

function displayVideos(videos) {
  if (videos.length === 0) {
    videoResults.innerHTML = '<p>No matching videos found.</p>';
    return;
  }

  videoResults.innerHTML = '';

  videos.forEach(video => {
    const card = document.createElement('div');
    card.className = 'video-card';

    let tagsHtml = '';
    if (video.video_tags?.length > 0) {
      tagsHtml = '<div class="video-tags">Tags: ' +
        video.video_tags.map(vt => {
          const tag = allTags.find(t => t.id === vt.tag_id);
          return tag ? `<span class="tag-pill">${tag.name}</span>` : '';
        }).join('') +
        '</div>';
    }

    card.innerHTML = `
      <h3>${video.title}</h3>
      <p>${video.description || '<em>No description</em>'}</p>
      <a href="${video.url}" target="_blank" rel="noopener noreferrer">${video.url}</a>
      ${tagsHtml}
    `;

    videoResults.appendChild(card);
  });
}

// Event listeners
searchInput.addEventListener('input', debounce(filterVideos, 400));

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  await loadTags();
  await filterVideos(); // show all approved on start
});
