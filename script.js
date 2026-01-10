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
