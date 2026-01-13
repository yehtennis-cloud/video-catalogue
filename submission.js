console.log('submission.js loaded');

let selectedTagIds = new Set(); // We'll use this to track selected tags

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

  container.innerHTML = ''; // Clear previous content

  tags.forEach(tag => {
    const tagEl = document.createElement('div');
    tagEl.classList.add('tag-item');
    tagEl.textContent = tag.name;
    tagEl.dataset.tagId = tag.id; // Store the tag ID

    // Click to toggle selection
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

  const tags = Array.from(selectedTagIds); // array of strings (UUIDs)

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
      p_tags: tags  // supabase-js handles string[] → uuid[]
    });

    if (error) {
      console.error('RPC error:', error);
      throw error;
    }

    console.log('Success! Video ID:', data);

    document.getElementById('submitMessage').textContent = 
      'Video submitted for review! ✓';

    // Reset everything
    document.getElementById('title').value = '';
    document.getElementById('url').value = '';
    document.getElementById('description').value = '';
    selectedTagIds.clear();
    document.querySelectorAll('#submitTags .tag-item').forEach(el => {
      el.classList.remove('selected');
    });

  } catch (err) {
    console.error('Submission failed:', err);
    document.getElementById('submitMessage').textContent = 
      'Error: ' + (err.message || 'Failed to submit. Check console.');
  }
}
    // Insert the video
    const { data: video, error: videoError } = await supabaseClient
      .from('videos')
      .insert([{ title, url, description, status: 'pending' }])
      .select()
      .single();

    if (videoError) throw videoError;

    // Insert video ↔ tag relationships
    if (tags.length > 0) {
      const videoTagInserts = tags.map(tagId => ({
        video_id: video.id,
        tag_id: tagId
      }));

      const { error: tagError } = await supabaseClient
        .from('video_tags')
        .insert(videoTagInserts);

      if (tagError) throw tagError;
    }

    document.getElementById('submitMessage').textContent = 
      'Video submitted for review! ✓';
    
    // Optional: Reset form & selection
    document.getElementById('title').value = '';
    document.getElementById('url').value = '';
    document.getElementById('description').value = '';
    selectedTagIds.clear();
    
    // Remove 'selected' class from all tags
    document.querySelectorAll('#submitTags .tag-item').forEach(el => {
      el.classList.remove('selected');
    });

  } catch (err) {
    console.error('Submission error:', err);
    document.getElementById('submitMessage').textContent = 
      'Error submitting video. Try again.';
  }
}
