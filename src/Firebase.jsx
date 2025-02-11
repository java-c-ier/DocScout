import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

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
export const addHospital = async (hospital, csvFileName) => {
  const districtName = csvFileName ? csvFileName.replace(/\.[^/.]+$/, "").trim() : 'Unknown District';
  const sanitizedName = hospital.Name ? hospital.Name.trim().replace(/\s+/g, '_').replace(/[^\w-]/g, '') : 'Unknown Hospital';

  const hospitalRef = doc(db, `Odisha/${districtName}/Hospitals`, sanitizedName);

  try {
    await setDoc(hospitalRef, {
      Name: hospital.Name ? hospital.Name.trim() : 'NA',
      Website: hospital.Website ? hospital.Website.trim() : '',
      Rating: hospital.Rating ? parseFloat(hospital.Rating) : 0,
      Type: hospital.Type ? hospital.Type.trim() : '',
      Contact: hospital.Contact ? hospital.Contact.trim() : 'NA',
      'Google Map Link': hospital.GoogleMapLink ? hospital.GoogleMapLink.trim() : '',
    });
    console.log(`${hospital.Name || 'Unknown'} added successfully to ${districtName}!`);
  } catch (error) {
    console.error(`Error adding ${hospital.Name || 'Unknown'} to ${districtName}:`, error);
  }
};

// Function to add reviews
export const addReview = async (district, hospitalName, reviewText, reviewerName) => {
  try {
    const formattedHospitalName = hospitalName.replace(/\s+/g, "_");
    const hospitalRef = doc(db, `Odisha/${district}/Hospitals/${formattedHospitalName}`);

    const review = {
      reviewer: reviewerName.trim(),
      text: reviewText.trim(),
      timestamp: new Date().toISOString(),
    };

    const hospitalDoc = await getDoc(hospitalRef);

    if (hospitalDoc.exists()) {
      await updateDoc(hospitalRef, {
        reviews: arrayUnion(review),
      });
    }
  } catch (error) {
    console.error("Error adding review:", error);
  }
};

export { app, db };
