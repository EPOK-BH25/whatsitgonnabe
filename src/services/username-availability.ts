import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Checks if a username is available by querying Firestore.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }
  
  try {
    const profilesRef = collection(db, "profiles");
    const q = query(profilesRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    // If the querySnapshot is empty, the username is available
    return querySnapshot.empty;
  } catch (error: any) {
    console.error("Error checking username availability:", error.message);
    return true; // If there's an error, assume it's available to allow signup
  }
}
