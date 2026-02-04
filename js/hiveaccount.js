// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCFIJpJ9IlPVKl9ZD-T5RB8_Zk2F11Txa0",
  authDomain: "hiveaccount-e12bd.firebaseapp.com",
  projectId: "hiveaccount-e12bd",
  storageBucket: "hiveaccount-e12bd.firebasestorage.app",
  messagingSenderId: "901425687184",
  appId: "1:901425687184:web:ab76181a84f2dd0e2a8615",
  measurementId: "G-M570031WGQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);