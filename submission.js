console.log('submission.js loaded');

let selectedTagIds = new Set();

document.addEventListener('DOMContentLoaded', () => {
  loadSubmitTags();
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) submitBtn.addEventListener('click', submitVideo);
});

async function loadSubmitTags() {
  const { data: tags, error } = await supabaseClient
    .from('tags')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error loading tags:', error);
    return;
  }

  const container = document.getElementById('submitTags');
  if (!container) return;

  container.innerHTML = '';

  tags.forEach(tag => {
    const tagEl = document.createElement('div');
    tagEl.classList.add('tag-item');
    tagEl.textContent = tag.name;
    tagEl.dataset.tagId = tag.id;

    tagEl.addEventListener('click', () => {
      tagEl.classList.toggle('selected');
      if (tagEl.classList.contains('selected')) {
        selectedTagIds.add(tag.id);
      } else {
        selectedTagIds.delete(tag.id);
      }
    });

    container.appendChild(tagEl);
  });
}

async function submitVideo() {
  const title = document.getElementById('title').value.trim();
  const url = document.getElementById('url').value.trim();
  const description = 
    document.getElementById('description').value.trim() || 
    'Submitted via website';

  const tags = Array.from(selectedTagIds);

  if (!title || !url || tags.length === 0) {
    document.getElementById('submitMessage').textContent = 
      'Title, URL, and at least one tag required';
    return;
  }

  try {
    const { data, error } = await supabaseClient.rpc('submit_video_with_tags', {
      p_title: title,
      p_url: url,
      p_description: description,
      p_tags: tags   // array of UUID strings - client converts automatically
    });

    if (error) throw error;

    console.log('Video submitted successfully. New ID:', data);

    document.getElementById('submitMessage').textContent = 
      'Video submitted for review! ✓';

    // Reset form & selections
    document.getElementById('title').value = '';
    document.getElementById('url').value = '';
    document.getElementById('description').value = '';
    selectedTagIds.clear();

    document.querySelectorAll('#submitTags .tag-item').forEach(el => {
      el.classList.remove('selected');
    });

  } catch (err) {
    console.error('Submission error:', err);
    let msg = 'Error submitting video. Please try again.';
    if (err.code === '23503') msg += ' (Foreign key issue)';
    if (err.message) msg += ` - ${err.message}`;
    document.getElementById('submitMessage').textContent = msg;
  }
}
