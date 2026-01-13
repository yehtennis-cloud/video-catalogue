console.log('submission.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  loadSubmitTags();

  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) submitBtn.addEventListener('click', submitVideo);
});

async function loadSubmitTags() {
  const { data: tags } = await supabaseClient
    .from('tags')
    .select('*')
    .order('name');

  const container = document.getElementById('submitTags');
  if (!container) return;

  container.innerHTML = '';

  tags.forEach(tag => {
    container.innerHTML += `
      <label>
        <input type="checkbox" value="${tag.id}"> ${tag.name}
      </label><br>
    `;
  });
}

async function submitVideo() {
  const title = document.getElementById('title').value.trim();
  const url = document.getElementById('url').value.trim();
  const description =
    document.getElementById('description').value.trim() ||
    'Submitted via website';

  const tags = [...document.querySelectorAll('#submitTags input:checked')]
    .map(cb => cb.value);

  if (!title || !url || tags.length === 0) {
    document.getElementById('submitMessage').textContent =
      'Title, URL, and at least one tag required';
    return;
  }

  const { data: video } = await supabaseClient
    .from('videos')
    .insert([{ title, url, description, status: 'pending' }])
    .select()
    .single();

  await supabaseClient
    .from('video_tags')
    .insert(tags.map(tagId => ({
      video_id: video.id,
      tag_id: tagId
    })));

  document.getElementById('submitMessage').textContent =
    'Video submitted for review';
}

// submission.js
document.addEventListener('DOMContentLoaded', async () => {
  // Do NOT redirect if no user
  loadSubmitTags();
});
