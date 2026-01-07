/* Doubt Desk – Working localStorage prototype
   - Six default faculty assigned to six semesters (3 real subjects each)
   - Faculty login only (no registration) with password "password"
   - Student registration + login
   - Students ask doubts (text/image/video), view own and subject doubts
   - Faculty can answer doubts only for assigned subjects
   - Admin can view all and update assignments
*/
const API_URL = "https://doubt-desk-backend.onrender.com";
// Firebase config (use your real keys)
firebase.initializeApp({
  apiKey: "AIzaSyBtyaqN64R5uNtEnA_SKpzVhJlkIPIb1CU",
  authDomain: "doubtdesk-372b2.firebaseapp.com",
  storageBucket: "doubtdesk-372b2.firebasestorage.app"
});

const storage = firebase.storage();

(function () {
  // Utils
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const STORAGE_KEYS = {
    users: 'dd_users',
    assignments: 'dd_assignments',
    doubts: 'dd_doubts',
    session: 'dd_session'
  };
  const ROLES = { STUDENT: 'student', FACULTY: 'faculty', ADMIN: 'admin' };

  // Default faculty and subjects (real names)
  const DEFAULT_FACULTY = [
    { name: 'Dr. A. Prakash', email: 'fac1@example.com', password: 'password', semesters: [1] },
    { name: 'Dr. B. SriDevi', email: 'fac2@example.com', password: 'password', semesters: [2] },
    { name: 'Dr. C. BhanuSridhar', email: 'fac3@example.com', password: 'password', semesters: [3] },
    { name: 'Dr. D. Gowthami', email: 'fac4@example.com', password: 'password', semesters: [4] },
    { name: 'Dr. E. Ashwini', email: 'fac5@example.com', password: 'password', semesters: [5] },
    { name: 'Dr. F. Santoshi', email: 'fac6@example.com', password: 'password', semesters: [6] }
  ];
  const DEFAULT_ASSIGNMENTS = {
    1: { facultyEmail: 'fac1@example.com', subjects: ['Mathematics I', 'Physics', 'Programming in C'] },
    2: { facultyEmail: 'fac2@example.com', subjects: ['Data Structures', 'Digital Logic Design', 'Discrete Mathematics'] },
    3: { facultyEmail: 'fac3@example.com', subjects: ['DBMS', 'Operating Systems', 'Computer Networks'] },
    4: { facultyEmail: 'fac4@example.com', subjects: ['Software Engineering', 'Design & Analysis of Algorithms', 'Microprocessors'] },
    5: { facultyEmail: 'fac5@example.com', subjects: ['Compiler Design', 'Web Technologies', 'Artificial Intelligence'] },
    6: { facultyEmail: 'fac6@example.com', subjects: ['Machine Learning', 'Cloud Computing', 'Cyber Security'] }
  };

  // Load existing or seed
  let users = load(STORAGE_KEYS.users) || seedUsers();
  let assignments = load(STORAGE_KEYS.assignments) || seedAssignments();
  let doubts = load(STORAGE_KEYS.doubts) || [];
  let session = load(STORAGE_KEYS.session) || { role: null, email: null, name: null };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    wireRoleSelection();
    wireTabs();
    wireAuth();
    wireBackButton()
    wireStudent();
    wireFaculty();
    wireAdmin();
    wireModal();
    renderOnSession();
  }

  // Storage helpers
  function load(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
  function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  // Seeding
  function seedUsers() {
    return {
      students: [],
      faculty: DEFAULT_FACULTY.map(f => ({ ...f })), // clone
      admins: [{ name: 'Admin', email: 'admin123@example.com', password: 'admin123' }]
    };
  }
  function seedAssignments() {
    return JSON.parse(JSON.stringify(DEFAULT_ASSIGNMENTS));
  }

  // Role selection
  function wireRoleSelection() {
  document.querySelectorAll("#roleSelection .role-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const role = btn.dataset.role;
      session = { role, email: null, name: null };
      save(STORAGE_KEYS.session, session);

      document.getElementById("authSection").classList.remove("hidden");
      document.getElementById("roleSelection").classList.add("hidden");
      document.getElementById("authTitle").textContent = role + " authentication";

      // Student: show tabs for login/register
      if (role === ROLES.STUDENT) {
        document.getElementById("studentTabs").classList.remove("hidden");
        document.getElementById("loginForm").classList.remove("hidden");
        document.getElementById("registerForm").classList.add("hidden");
      } else {
        // Faculty/Admin: only login
        document.getElementById("studentTabs").classList.add("hidden");
        document.getElementById("loginForm").classList.remove("hidden");
        document.getElementById("registerForm").classList.add("hidden");
      }
    });
  });

  // Tab switching for student
  document.getElementById("showLogin").addEventListener("click", () => {
    document.getElementById("loginForm").classList.remove("hidden");
    document.getElementById("registerForm").classList.add("hidden");
  });
  document.getElementById("showRegister").addEventListener("click", () => {
    document.getElementById("registerForm").classList.remove("hidden");
    document.getElementById("loginForm").classList.add("hidden");
  });
}
  function setAuthTitle(role) {
    $('#authTitle').textContent = {
      [ROLES.STUDENT]: 'Student authentication',
      [ROLES.FACULTY]: 'Faculty authentication',
      [ROLES.ADMIN]: 'Admin authentication'
    }[role];
  }
  function toggleStudentRegFields(role) {
    const sr = $('#studentRegFields');
    if (role === ROLES.STUDENT) sr.classList.remove('hidden');
    else sr.classList.add('hidden');
  }

  // Tabs
  function wireTabs() {
    const tabs = $$('.tab-btn');
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const target = t.dataset.tab;
      $$('.tab-content').forEach(c => c.classList.toggle('active', c.id === target));
    }));
  }

  // Auth
  function wireAuth() {
    $('#loginForm').addEventListener('submit', handleLogin);
    $('#registerForm').addEventListener('submit', handleRegisterStudent);
  }
  function wireBackButton() {
  const backBtn = document.getElementById("backToRoles");
  backBtn.addEventListener("click", () => {
    // Reset session role
    session = { role: null, email: null, name: null };
    localStorage.setItem("dd_session", JSON.stringify(session));

    // Hide auth section, show role selection again
    document.getElementById("authSection").classList.add("hidden");
    document.getElementById("roleSelection").classList.remove("hidden");
  });
}


  function handleLogin(e) {
    e.preventDefault();
    const email = $('#loginEmail').value.trim().toLowerCase();
    const password = $('#loginPassword').value.trim();
    const role = session.role;
    const msgEl = $('#loginMsg');

    let user;
    if (role === ROLES.STUDENT) user = users.students.find(u => u.email === email && u.password === password);
    else if (role === ROLES.FACULTY) user = users.faculty.find(u => u.email === email && u.password === password);
    else user = users.admins.find(u => u.email === email && u.password === password);

    if (!user) {
      msgEl.textContent = 'Invalid credentials.';
      msgEl.className = 'msg err';
      return;
    }
    session.email = user.email;
    session.name = user.name;
    save(STORAGE_KEYS.session, session);
    msgEl.textContent = 'Login successful.';
    msgEl.className = 'msg ok';
    setTimeout(renderOnSession, 300);
  }

  function handleRegisterStudent(e) {
    e.preventDefault();
    if (session.role !== ROLES.STUDENT) {
      setMsg('#registerMsg', 'Only students can register here.', 'err');
      return;
    }
    const name = $('#regName').value.trim();
    const email = $('#regEmail').value.trim().toLowerCase();
    const password = $('#regPassword').value.trim();
    const semesterVal = parseInt($('#regSemester').value, 10);
    const msgEl = $('#registerMsg');

    if (!name || !email || !password || isNaN(semesterVal) || semesterVal < 1 || semesterVal > 6) {
      msgEl.textContent = 'Fill all fields and use valid semester (1–6).';
      msgEl.className = 'msg err';
      return;
    }
    if (users.students.find(u => u.email === email)) {
      msgEl.textContent = 'Account already exists.';
      msgEl.className = 'msg err';
      return;
    }
    const anonId = genAnonId();
    users.students.push({ name, email, password, semester: semesterVal, anonId });
    save(STORAGE_KEYS.users, users);
    msgEl.textContent = 'Registration successful. You can login now.';
    msgEl.className = 'msg ok';
  }

  function genAnonId() {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `STD-${rand}`;
  }

  // View routing
  function renderOnSession() {
    ['#roleSelection', '#authSection', '#studentDashboard', '#facultyDashboard', '#adminDashboard']
      .forEach(id => $(id).classList.add('hidden'));

    if (!session.role || !session.email) {
      $('#roleSelection').classList.remove('hidden');
      return;
    }
    if (session.role === ROLES.STUDENT) renderStudentView();
    else if (session.role === ROLES.FACULTY) renderFacultyView();
    else renderAdminView();
  }

  // Student view
  function wireStudent() {
    $('#logoutStudent').addEventListener('click', logout);
    $('#askDoubtForm').addEventListener('submit', handleAskDoubt);
    $('#sdSemester').addEventListener('change', () => {
      populateStudentSubjects();
      populateSubjectFilter();
    });
    $('#sdSubjectFilter').addEventListener('change', renderSubjectDoubts);
  }

  function renderStudentView() {
    const me = users.students.find(u => u.email === session.email);
    if (!me) return logout();
    $('#studentWelcome').textContent = `Welcome, ${me.name} (Sem ${me.semester})`;
    $('#studentDashboard').classList.remove('hidden');

    populateStudentSemesters(me.semester);
    populateStudentSubjects();
    populateSubjectFilter();
    renderMyDoubts();
    renderSubjectDoubts();
  }

  function populateStudentSemesters(mySemester) {
    const semSel = $('#sdSemester');
    semSel.innerHTML = '';
    const opt = document.createElement('option');
    opt.value = mySemester; opt.textContent = `Semester ${mySemester}`;
    semSel.appendChild(opt);
    semSel.value = mySemester;
  }

  function populateStudentSubjects() {
    const sem = parseInt($('#sdSemester').value, 10);
    const subs = (assignments[sem]?.subjects) || [];
    const sel = $('#sdSubject');
    sel.innerHTML = '';
    subs.forEach(s => {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      sel.appendChild(o);
    });
  }

  function populateSubjectFilter() {
    const sem = parseInt($('#sdSemester').value, 10);
    const subs = (assignments[sem]?.subjects) || [];
    const sel = $('#sdSubjectFilter');
    sel.innerHTML = '';
    subs.forEach(s => {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      sel.appendChild(o);
    });
  }

  async function handleAskDoubt(e) {
    e.preventDefault();
    const me = users.students.find(u => u.email === session.email);
    if (!me) return;

    const semester = parseInt($('#sdSemester').value, 10);
    const subject = $('#sdSubject').value;
    const text = $('#sdText').value.trim();
    const imgFile = $('#sdImage').files[0];
    const vidFile = $('#sdVideo').files[0];

    if (!text) { setMsg('#askMsg', 'Please describe your doubt.', 'err'); return; }

    const attachments = [];
    if (imgFile) attachments.push({ type: 'image', url: await fileToDataUrl(imgFile) });
    if (vidFile) attachments.push({ type: 'video', url: await fileToDataUrl(vidFile) });

    const id = 'D-' + Date.now();
    doubts.push({
      id,
      semester,
      subject,
      studentAnonId: me.anonId,
      studentRealId: me.email,
      question: { text, attachments },
      status: 'pending',
      answer: null,
      createdAt: new Date().toISOString()
    });
    save(STORAGE_KEYS.doubts, doubts);

    $('#askDoubtForm').reset();
    populateStudentSubjects();
    setMsg('#askMsg', 'Doubt submitted.', 'ok');

    renderMyDoubts();
    renderSubjectDoubts();
  }

  function renderMyDoubts() {
    const me = users.students.find(u => u.email === session.email);
    const mine = doubts.filter(d => d.studentRealId === me.email).sort(sortByDate);
    $('#myDoubtsList').innerHTML = mine.map(renderDoubtItemForStudent).join('');
  }

  function renderSubjectDoubts() {
    const subject = $('#sdSubjectFilter').value;
    const me = users.students.find(u => u.email === session.email);
    const list = doubts
      .filter(d => d.semester === me.semester && d.subject === subject)
      .sort(sortByDate);
    $('#subjectDoubtsList').innerHTML = list.map(renderDoubtItemForStudent).join('');
  }

  function renderDoubtItemForStudent(d) {
    const statusClass = d.status === 'answered' ? 'answered' : 'pending';
    const qAtt = renderAttachments(d.question.attachments);
    const aAtt = d.answer ? renderAttachments(d.answer.attachments) : '';
    const answerBlock = d.answer ? `
      <div class="item-body">
        <strong>Answer:</strong> ${escapeHtml(d.answer.text)}
        ${aAtt}
      </div>` : '';
    return `
      <div class="item">
        <div class="item-header">
          <div class="badge">ID: ${d.id}</div>
          <div class="status ${statusClass}">${d.status}</div>
        </div>
        <div class="item-body">
          <strong>Subject:</strong> ${escapeHtml(d.subject)} • <strong>Semester:</strong> ${d.semester}<br/>
          <strong>Your anon ID:</strong> ${d.studentAnonId}<br/>
          <strong>Question:</strong> ${escapeHtml(d.question.text)}
          ${qAtt}
        </div>
        ${answerBlock}
      </div>`;
  }

  // Faculty view
  function wireFaculty() {
    $('#logoutFaculty').addEventListener('click', logout);
    // Delegated Answer button click handled in wireModal()
  }

  function renderFacultyView() {
    const me = users.faculty.find(u => u.email === session.email);
    if (!me) return logout();

    $('#facultyWelcome').textContent = `Welcome, ${me.name}`;
    $('#facultyDashboard').classList.remove('hidden');

    // Subjects chips
    const chips = (me.semesters || []).map(s => {
      return (assignments[s]?.subjects || [])
        .map(sub => `<span class="chip">Sem ${s}: ${escapeHtml(sub)}</span>`).join('');
    }).join('');
    $('#facultySubjects').innerHTML = chips || '<span class="chip">No subjects assigned yet</span>';

    // Doubts limited to faculty semesters and subjects they handle
    const myDoubts = doubts
      .filter(d => (me.semesters || []).includes(d.semester) &&
                   (assignments[d.semester]?.subjects || []).includes(d.subject))
      .sort(sortByDate);

    $('#facultyDoubtsList').innerHTML = myDoubts.map(renderDoubtItemForFaculty).join('');
  }

  function renderDoubtItemForFaculty(d) {
    const statusClass = d.status === 'answered' ? 'answered' : 'pending';
    const qAtt = renderAttachments(d.question.attachments);
    const answerBtn = d.status === 'pending'
      ? `<button class="primary" data-action="answer" data-did="${d.id}">Answer</button>`
      : '';
    return `
      <div class="item">
        <div class="item-header">
          <div class="badge">ID: ${d.id}</div>
          <div class="status ${statusClass}">${d.status}</div>
        </div>
        <div class="item-body">
          <strong>Subject:</strong> ${escapeHtml(d.subject)} • <strong>Semester:</strong> ${d.semester}<br/>
          <strong>Student anon ID:</strong> ${d.studentAnonId}<br/>
          <strong>Question:</strong> ${escapeHtml(d.question.text)}
          ${qAtt}
        </div>
        <div class="item-footer">
          ${answerBtn}
        </div>
      </div>`;
  }

  // Answer modal
  function wireModal() {
    $('#closeAnswerModal').addEventListener('click', closeAnswerModal);
    $('#answerDoubtForm').addEventListener('submit', submitFacultyAnswer);
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action="answer"]');
      if (!btn) return;
      const did = btn.dataset.did;
      openAnswerModal(did);
    });
  }

  function openAnswerModal(did) {
    const d = doubts.find(x => x.id === did);
    if (!d) return;
    $('#answerDoubtBody').innerHTML = `
      <div class="item">
        <div class="item-header">
          <div class="badge">ID: ${d.id}</div>
          <div class="status pending">pending</div>
        </div>
        <div class="item-body">
          <strong>Subject:</strong> ${escapeHtml(d.subject)} • <strong>Semester:</strong> ${d.semester}<br/>
          <strong>Student anon ID:</strong> ${d.studentAnonId}<br/>
          <strong>Question:</strong> ${escapeHtml(d.question.text)}
          ${renderAttachments(d.question.attachments)}
        </div>
      </div>
    `;
    $('#answerModal').dataset.did = did;
    $('#answerModal').classList.remove('hidden');
    setMsg('#answerMsg', '');
    $('#fdAnswerText').value = '';
    $('#fdImage').value = '';
    $('#fdVideo').value = '';
  }

  function closeAnswerModal() {
    $('#answerModal').classList.add('hidden');
    $('#answerModal').dataset.did = '';
  }

  async function submitFacultyAnswer(e) {
    e.preventDefault();
    const did = $('#answerModal').dataset.did;
    const d = doubts.find(x => x.id === did);
    if (!d) return;
=======
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
>>>>>>> 1efcf360f63ef3c18db7cf78ecdc1086d68df901

    const text = $('#fdAnswerText').value.trim();
    const imgFile = $('#fdImage').files[0];
    const vidFile = $('#fdVideo').files[0];

<<<<<<< HEAD
    if (!text) { setMsg('#answerMsg', 'Answer cannot be empty.', 'err'); return; }

    // Permission check: only assigned faculty can answer
    const me = users.faculty.find(u => u.email === session.email);
    const allowed = (me.semesters || []).includes(d.semester) &&
                    (assignments[d.semester]?.subjects || []).includes(d.subject);
    if (!allowed) { setMsg('#answerMsg', 'You are not assigned to this subject.', 'err'); return; }

    const attachments = [];
    if (imgFile) attachments.push({ type: 'image', url: await fileToDataUrl(imgFile) });
    if (vidFile) attachments.push({ type: 'video', url: await fileToDataUrl(vidFile) });

    d.answer = { facultyEmail: me.email, text, attachments, timestamp: new Date().toISOString() };
    d.status = 'answered';
    save(STORAGE_KEYS.doubts, doubts);

    setMsg('#answerMsg', 'Answer submitted.', 'ok');
    setTimeout(() => {
      closeAnswerModal();
      renderFacultyView();
      // If student/admin viewing simultaneously, re-render based on role
      if (session.role === ROLES.STUDENT) renderStudentView();
      if (session.role === ROLES.ADMIN) renderAdminView();
    }, 300);
  }

  // Admin view
  function wireAdmin() {
    $('#logoutAdmin').addEventListener('click', logout);
    $('#assignForm').addEventListener('submit', handleAssign);
  }

  function renderAdminView() {
    const me = users.admins.find(u => u.email === session.email);
    if (!me) return logout();

    $('#adminWelcome').textContent = `Welcome, ${me.name}`;
    $('#adminDashboard').classList.remove('hidden');

    // Populate selects
    const semSel = $('#adSemester'); semSel.innerHTML = '';
    for (let s = 1; s <= 6; s++) {
      const o = document.createElement('option');
      o.value = s; o.textContent = `Semester ${s}`; semSel.appendChild(o);
    }
    const facSel = $('#adFaculty'); facSel.innerHTML = users.faculty
      .map(f => `<option value="${f.email}">${escapeHtml(f.name)} (${f.email})</option>`).join('');

    renderAssignmentsView();

    // Doubts for admin
    const all = doubts.slice().sort(sortByDate);
    $('#adminDoubtsList').innerHTML = all.map(renderDoubtItemForAdmin).join('');
  }

  function renderAssignmentsView() {
    const view = $('#assignmentsView');
    const rows = [];
    for (let s = 1; s <= 6; s++) {
      const a = assignments[s];
      const facName = a?.facultyEmail
        ? (users.faculty.find(f => f.email === a.facultyEmail)?.name || a.facultyEmail)
        : 'Unassigned';
      const subs = (a?.subjects || []).join(', ');
      rows.push(`
        <div class="item">
          <div class="item-header">
            <div class="badge">Semester ${s}</div>
            <span class="chip">${escapeHtml(facName)}</span>
          </div>
          <div class="item-body">
            <strong>Subjects:</strong> ${escapeHtml(subs)}
          </div>
        </div>
      `);
    }
    view.innerHTML = rows.join('');
  }

  function handleAssign(e) {
    e.preventDefault();
    const sem = parseInt($('#adSemester').value, 10);
    const facEmail = $('#adFaculty').value;
    const subsInput = $('#adSubjects').value.trim();
    const subs = subsInput.split(',').map(s => s.trim()).filter(Boolean);

    if (subs.length === 0) { setMsg('#assignMsg', 'Enter at least one subject.', 'err'); return; }

    assignments[sem] = { facultyEmail: facEmail, subjects: subs };

    // Update faculty semesters mapping
    users.faculty.forEach(f => { f.semesters = (f.semesters || []).filter(s => s !== sem); });
    const fac = users.faculty.find(f => f.email === facEmail);
    if (fac) fac.semesters = Array.from(new Set([...(fac.semesters || []), sem]));

    save(STORAGE_KEYS.assignments, assignments);
    save(STORAGE_KEYS.users, users);

    setMsg('#assignMsg', 'Assignment updated.', 'ok');
    renderAssignmentsView();
    if (session.role === ROLES.FACULTY) renderFacultyView();
  }

  function renderDoubtItemForAdmin(d) {
    const statusClass = d.status === 'answered' ? 'answered' : 'pending';
    const qAtt = renderAttachments(d.question.attachments);
    const aAtt = d.answer ? renderAttachments(d.answer.attachments) : '';
    const answerBlock = d.answer ? `
      <div class="item-body">
        <strong>Answer:</strong> ${escapeHtml(d.answer.text)} (by ${d.answer.facultyEmail})
        ${aAtt}
      </div>` : '';
    return `
      <div class="item">
        <div class="item-header">
          <div class="badge">ID: ${d.id}</div>
          <div class="status ${statusClass}">${d.status}</div>
        </div>
        <div class="item-body">
          <strong>Student anon ID:</strong> ${d.studentAnonId} • <strong>Student email:</strong> ${d.studentRealId}<br/>
          <strong>Semester:</strong> ${d.semester} • <strong>Subject:</strong> ${escapeHtml(d.subject)}<br/>
          <strong>Question:</strong> ${escapeHtml(d.question.text)}
          ${qAtt}
        </div>
        ${answerBlock}
      </div>`;
  }

  // Common helpers
  function logout() {
    session = { role: null, email: null, name: null };
    save(STORAGE_KEYS.session, session);
    ['#roleSelection', '#authSection', '#studentDashboard', '#facultyDashboard', '#adminDashboard']
      .forEach(id => $(id).classList.add('hidden'));
    $('#roleSelection').classList.remove('hidden');
  }

  function sortByDate(a, b) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }

  function renderAttachments(att = []) {
    if (!att || att.length === 0) return '';
    const blocks = att.map(x => {
      if (x.type === 'image') return `<div><img src="${x.url}" alt="attachment" style="max-width:100%; border-radius:10px; margin-top:6px;"/></div>`;
      if (x.type === 'video') return `<div style="margin-top:6px;"><video controls src="${x.url}" style="width:100%; border-radius:10px;"></video></div>`;
      return '';
    }).join('');
    return `<div class="item-footer">${blocks}</div>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

})();
=======
loadDoubts();
>>>>>>> 1efcf360f63ef3c18db7cf78ecdc1086d68df901
