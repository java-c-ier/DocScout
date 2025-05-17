import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc,
  collection,
  addDoc,
} from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DB_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Add a hospital document under:
 * /Odisha/{districtName}/Hospitals/{sanitizedHospitalName}
 */
export const addHospital = async (hospital, csvFileName) => {
  const districtName = csvFileName
    ? csvFileName.replace(/\.[^/.]+$/, "").trim()
    : "Unknown District";

  const sanitizedName = hospital.Name
    ? hospital.Name.trim().replace(/\s+/g, "_").replace(/[^\w-]/g, "")
    : "Unknown_Hospital";

  const hospitalRef = doc(
    db,
    "Odisha",
    districtName,
    "Hospitals",
    sanitizedName
  );

  try {
    await setDoc(hospitalRef, {
      Name: hospital.Name ? hospital.Name.trim() : "NA",
      Website: hospital.Website ? hospital.Website.trim() : "",
      Rating: hospital.Rating ? parseFloat(hospital.Rating) : 0,
      Type: hospital.Type ? hospital.Type.trim() : "",
      Contact: hospital.Contact ? hospital.Contact.trim() : "NA",
      "Google Map Link": hospital.GoogleMapLink
        ? hospital.GoogleMapLink.trim()
        : "",
    });
    console.log(
      `${hospital.Name || "Unknown"} added successfully to ${districtName}!`
    );
  } catch (error) {
    console.error(
      `Error adding ${hospital.Name || "Unknown"} to ${districtName}:`,
      error
    );
  }
};

/**
 * Append a single aspect review under:
 * /Odisha/{district}/Hospitals/{hospitalId}/Reviews/reviews/aspects_reviews/{aspectDoc}
 *
 * Each aspect document has one field:
 *   review: string[]   // array of submitted reviews for that aspect
 *
 * @param {string} district     e.g. "Angul"
 * @param {string} hospitalName e.g. "Arete_Care_Hospital"
 * @param {string} aspect       e.g. "Cleanliness_and_Hygiene"
 * @param {string} reviewText   the textual review for that aspect
 */
export const addAspectReview = async (
  district,
  hospitalName,
  aspect,
  reviewText
) => {
  try {
    const hospId = hospitalName.trim().replace(/\s+/g, "_");
    const aspectId = aspect.trim().replace(/\s+/g, "_");

    // Reference to the category document
    const aspectDocRef = doc(
      db,
      "Odisha",
      district,
      "Hospitals",
      hospId,
      "Reviews",
      "reviews",
      "aspects_reviews",
      aspectId
    );

    // Ensure the aspect document exists with an array field
    const snap = await getDoc(aspectDocRef);
    if (!snap.exists()) {
      await setDoc(aspectDocRef, { review: [] });
    }

    // Append the new review text
    await updateDoc(aspectDocRef, {
      review: arrayUnion(reviewText.trim()),
    });

    console.log(
      `Added review to ${aspectId} of ${hospId}: "${reviewText.trim()}"`
    );
  } catch (error) {
    console.error("Error adding aspect review:", error);
  }
};

/**
 * Add a doctor document under:
 * /Odisha/{district}/Hospitals/{hospitalName}/{department}/{doctorId}
 *
 * Also appends the department name to the hospital's `departments` array.
 */
export const addDoctor = async (doctorData) => {
  const {
    Name,
    Qualification,
    Experience,
    Department,
    Specialization,
    Timing,
    District,
    Hospital,
  } = doctorData;

  if (!District || !Hospital || !Department) {
    console.error("Missing required fields");
    return;
  }

  const formattedDistrict = District.trim();
  const formattedHospital = Hospital.trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "");
  const formattedDepartment = Department.trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9-_&]/g, "");

  const docId = Name.trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase();

  const doctorRef = doc(
    db,
    "Odisha",
    formattedDistrict,
    "Hospitals",
    formattedHospital,
    formattedDepartment,
    docId
  );

  try {
    // Upsert doctor record
    await setDoc(
      doctorRef,
      {
        Name,
        Qualification,
        Experience,
        Department,
        Specialization,
        Timing,
        District: formattedDistrict,
        Hospital,
      },
      { merge: true }
    );

    // Ensure the department is listed in the hospital document
    const hospitalDocRef = doc(
      db,
      "Odisha",
      formattedDistrict,
      "Hospitals",
      formattedHospital
    );
    await updateDoc(hospitalDocRef, {
      departments: arrayUnion(formattedDepartment),
    });

    console.log(
      `Upserted doctor ${docId} under ${formattedDepartment} of ${formattedHospital}`
    );
  } catch (error) {
    console.error(`Error upserting doctor ${docId}:`, error);
  }
};

export { app, db };
