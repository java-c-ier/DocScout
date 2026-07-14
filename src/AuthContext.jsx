import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./Firebase";

const ADMIN_EMAIL = "jimutksahoo99@gmail.com";

const BLOCKED_MSG = "Your account doesn't exist or is inactive. Please contact your admin or fill the contact form.";

const AuthContext = createContext({ user: null, role: null, authReady: false, blockedError: null });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [blockedError, setBlockedError] = useState(null);

  useEffect(() => {
    if (!auth) { setAuthReady(true); return; }
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await firebaseUser.reload();
        setUser({ ...firebaseUser });

        if (db) {
          const isGoogle = firebaseUser.providerData?.[0]?.providerId === "google.com";
          const userRef = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            if (!isGoogle && snap.data().blocked) {
              await signOut(auth);
              setBlockedError(BLOCKED_MSG);
              return;
            }
            setRole(snap.data().role || "user");
          } else {
            const assignedRole = firebaseUser.email === ADMIN_EMAIL ? "admin" : "user";
            await setDoc(userRef, {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || "",
              role: assignedRole,
              provider: firebaseUser.providerData?.[0]?.providerId || "unknown",
              createdAt: serverTimestamp(),
            });
            setRole(assignedRole);
          }
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setAuthReady(true);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{
      user, setUser, role, authReady,
      blockedError, clearBlockedError: () => setBlockedError(null),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
