import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyBtyaqN64R5uNtEnA_SKpzVhJlkIPIb1CU",
  authDomain: "doubtdesk-372b2.firebaseapp.com",
  projectId: "doubtdesk-372b2",
  storageBucket: "doubtdesk-372b2.firebasestorage.app",
  messagingSenderId: "244068887976",
  appId: "1:244068887976:web:26894b3c09fc8a310f419d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);