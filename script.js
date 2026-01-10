// 1. Connect to Supabase
const SUPABASE_URL = "https://sdicmtmcanvswsisihqb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pAMpbQ_ZpucKn9X8xgQUdA_as-rPsa7";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// 2. Submit video
document.getElementById("submitBtn").addEventListener("click", async () => {
  const title = document.getElementById("title").value;
  const url = document.getElementById("url").value;

  const selectedTags = [...document.querySelectorAll("#submitTags input:checked")]
    .map(cb => cb.value);

  if (!title || !url || selectedTags.length === 0) {
    document.getElementById("submitMessage").textContent =
      "Title, URL, and at least one tag are required.";
    return;
  }

  // 1. Insert video
const { data: video, error: videoError } = await supabaseClient
  .from("videos")
  .insert([{
    title,
    url,
    description: ""   // Provide empty string if description is optional
  }])
  .select()
  .single();


  if (videoError) {
    document.getElementById("submitMessage").textContent =
      videoError.message;
    return;
  }

  // 2. Insert video_tags
  const videoTags = selectedTags.map(tagId => ({
    video_id: video.id,
    tag_id: tagId
  }));

  const { error: tagError } = await supabaseClient
    .from("video_tags")
    .insert(videoTags);

  if (tagError) {
    document.getElementById("submitMessage").textContent =
      tagError.message;
    return;
  }

  document.getElementById("submitMessage").textContent =
    "Submitted for review.";

  document.getElementById("title").value = "";
  document.getElementById("url").value = "";
});


// 3. Load tags for filtering
async function loadTags() {
  const { data: tags } = await supabaseClient
    .from("tags")
    .select("*")
    .order("name");

  const container = document.getElementById("tagFilters");
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
}

// 4. Search videos by selected tags (ALL tags required)
document.getElementById("searchBtn").addEventListener("click", async () => {
  const checked = [...document.querySelectorAll("#tagFilters input:checked")]
    .map(cb => cb.value);

  if (checked.length === 0) {
    document.getElementById("results").textContent =
      "Select at least one tag.";
    return;
  }

  const { data, error } = await supabaseClient.rpc(
    "videos_with_all_tags",
    { tag_ids: checked }
  );

  const results = document.getElementById("results");
  results.innerHTML = "";

  if (error) {
    results.textContent = error.message;
    return;
  }

  data.forEach(video => {
    const div = document.createElement("div");
    div.innerHTML = `
      <h3>${video.title}</h3>
      <a href="${video.url}" target="_blank">${video.url}</a>
    `;
    results.appendChild(div);
  });
});

// Load tags on page load
loadTags();
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

loadSubmitTags();
window.addEventListener("DOMContentLoaded", loadSubmitTags);

