// 1. Connect to Supabase
const SUPABASE_URL = "https://sdicmtmcanvswsisihqb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pAMpbQ_ZpucKn9X8xgQUdA_as-rPsa7";

const supabase = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// 2. Submit video
document.getElementById("submitBtn").addEventListener("click", async () => {
  const title = document.getElementById("title").value;
  const url = document.getElementById("url").value;

  const { error } = await supabase
    .from("videos")
    .insert([{ title, url }]);

  document.getElementById("submitMessage").textContent =
    error ? error.message : "Submitted for review.";
});

// 3. Load tags for filtering
async function loadTags() {
  const { data: tags } = await supabase
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

  const { data, error } = await supabase.rpc(
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

