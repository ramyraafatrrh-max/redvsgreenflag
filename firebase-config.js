// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCtcM0xVhMdpdNGdsuS80X7futXslgCei0",
  authDomain: "redvsgreenflag-2e8ea.firebaseapp.com",
  projectId: "redvsgreenflag-2e8ea",
  storageBucket: "redvsgreenflag-2e8ea.firebasestorage.app",
  messagingSenderId: "159874679159",
  appId: "1:159874679159:web:27bbd80cc68ab5e2be2172",
  measurementId: "G-M3WQ5D32EH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
