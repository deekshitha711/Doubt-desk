const API_URL = "https://doubt-desk-backend.onrender.com";

// Load doubts from backend
async function loadDoubts() {
  const res = await fetch(`${API_URL}/api/doubts`);
  const doubts = await res.json();

  const container = document.getElementById("doubtList");
  container.innerHTML = "";

  doubts.forEach(d => {
    const div = document.createElement("div");
div.className = "doubt-card";

    div.innerHTML = `
      <h3>${d.title}</h3>
      <p>${d.description}</p>
      <small>${d.subject}</small>
      <hr/>
    `;
    container.appendChild(div);
  });
}

// Post a new doubt
async function postDoubt() {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const subject = document.getElementById("subject").value;

  await fetch(`${API_URL}/api/doubts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title, description, subject })
  });

  alert("Doubt posted successfully!");
  loadDoubts();
}

// Load doubts when page opens
loadDoubts();
