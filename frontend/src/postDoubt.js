import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { addDoc, collection } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
/* AUTH CHECK */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Login required");
    window.location.href = "login.html";
  }
});
/* SAVE DOUBT */
window.postDoubt = async function () {
  const doubtText = document.getElementById("doubt").value;

  await addDoc(collection(db, "doubts"), {
    question: doubtText,
    userId: auth.currentUser.uid,
    email: auth.currentUser.email,
    createdAt: new Date()
  });

  alert("Doubt posted successfully");
};