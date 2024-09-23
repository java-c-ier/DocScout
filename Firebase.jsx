import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBjmd1hdBpoOa_xpOExanUwrPgX3nvaROA",
  authDomain: "healthcare-finder-cse-2025.firebaseapp.com",
  projectId: "healthcare-finder-cse-2025",
  storageBucket: "healthcare-finder-cse-2025.appspot.com",
  messagingSenderId: "703706911369",
  appId: "1:703706911369:web:71efc548c25d72a5206c58",
  databaseURL: "https://healthcare-finder-cse-2025-default-rtdb.firebaseio.com/"
};

export const app = initializeApp(firebaseConfig);