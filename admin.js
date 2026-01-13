console.log('admin.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  loadPendingVideos();
});

async function loadPendingVideos() {
  const { data: videos } = await supabaseClient
    .from('videos')
    .select('*')
    .eq('status', 'pending')
    .order('created_at');

  const container = document.getElementById('adminVideos');
  if (!container) return;

  container.innerHTML = '';

  videos.forEach(video => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h3>${video.title}</h3>
      <p>${video.description}</p>
      <a href="${video.url}" target="_blank">${video.url}</a><br><br>
      <button onclick="updateVideoStatus('${video.id}', 'approved')">Approve</button>
      <button onclick="updateVideoStatus('${video.id}', 'denied')">Deny</button>
    `;
    container.appendChild(div);
  });
}

async function updateVideoStatus(videoId, status) {
  await supabaseClient
    .from('videos')
    .update({ status })
    .eq('id', videoId);

  loadPendingVideos();
}
