const API_URL = "https://doubt-desk-backendd.onrender.com";

async function loadDoubts() {
  try {
    const res = await fetch(`${API_URL}/api/doubts`);
    const doubts = await res.json();

    // 1. Logic for Counts
    const available = doubts.filter((d) => d.status === "open").length;
    const answered = doubts.filter((d) => d.status === "answered").length;

    if (document.getElementById("availableCount"))
      document.getElementById("availableCount").innerText = available;
    if (document.getElementById("answeredCount"))
      document.getElementById("answeredCount").innerText = answered;

    const container = document.getElementById("doubtList");
    container.innerHTML = "";

    // 2. Logic for Displaying Doubts & their Answers
    for (const d of doubts) {
      const div = document.createElement("div");
      div.className = "doubt-card";

      const ansRes = await fetch(`${API_URL}/api/answers/${d.id}`);
      const answers = await ansRes.json();

      let answersHTML = answers
        .map(
          (a) => `
        <div class="answer">
            <strong>${a.role}:</strong> ${a.answerText}
        </div>
      `
        )
        .join("");

      div.innerHTML = `
            <h3>${d.title} <span class="badge ${d.status}">${
        d.status
      }</span></h3>
            <p>${d.description}</p>
            <small>Subject: ${d.subject} | Asked by: ${d.createdBy}</small>
            <div class="answers-section">
                <h4>Discussion:</h4>
                ${answersHTML || "<p>No answers yet.</p>"}
            </div>
            <hr/>
        `;
      container.appendChild(div);
    }
  } catch (err) {
    console.error("Failed to load doubts:", err);
  }
}

async function postDoubt() {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const subject = document.getElementById("subject").value;
  const studentId =
    localStorage.getItem("temp_uid") ||
    "student_" + Math.floor(Math.random() * 1000);
  localStorage.setItem("temp_uid", studentId);

  await fetch(`${API_URL}/api/doubts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      description,
      subject,
      createdBy: studentId,
    }),
  });

  alert("Doubt posted successfully!");
  loadDoubts();
}

loadDoubts();
