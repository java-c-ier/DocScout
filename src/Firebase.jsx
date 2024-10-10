// require('dotenv').config();
// const key = process.env.myAPIKey;

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBjmd1hdBpoOa_xpOExanUwrPgX3nvaROA",
  authDomain: "healthcare-finder-cse-2025.firebaseapp.com",
  databaseURL: "https://healthcare-finder-cse-2025-default-rtdb.firebaseio.com",
  projectId: "healthcare-finder-cse-2025",
  storageBucket: "healthcare-finder-cse-2025.appspot.com",
  messagingSenderId: "703706911369",
  appId: "1:703706911369:web:71efc548c25d72a5206c58"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to add hospital data to Firestore
export const addHospital = async (hospital) => {
  const sanitizedName = hospital.Name.trim().replace(/\s+/g, '_').replace(/[^\w-]/g, '');
  const hospitalRef = doc(db, "Odisha/Cuttack/Hospitals", sanitizedName);
  
  try {
    await setDoc(hospitalRef, {
      Name: hospital.Name ? hospital.Name.trim() : '',
      Website: hospital.Website ? hospital.Website.trim() : '',
      Rating: hospital.Rating ? parseFloat(hospital.Rating) : 0,
      Type: hospital.Type ? hospital.Type.trim() : '',
      Contact: hospital.Contact ? hospital.Contact.trim() : '',
      'Google Map Link': hospital.GoogleMapLink ? hospital.GoogleMapLink.trim() : '',
    });
    console.log(`${hospital.Name} added successfully!`);
  } catch (error) {
    console.error(`Error adding ${hospital.Name}:`, error);
  }
};




export { app, db };
