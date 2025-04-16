
import { FirebaseStorage, getStorage, ref, getMetadata } from "firebase/storage";

const USERNAME_LIST_PATH = "usernames.txt";

let storage: FirebaseStorage | null = null;

function getFirebaseStorage(): FirebaseStorage {
  if (storage) {
    return storage;
  }
  storage = getStorage();
  return storage;
}

/**
 * Checks if a username is available by checking against existing usernames
 * stored in Firebase Storage.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const storage = getFirebaseStorage();
    const usernameListRef = ref(storage, USERNAME_LIST_PATH);

    // Attempt to fetch metadata for the file
    await getMetadata(usernameListRef);

    // Fetch the file content if it exists
    const response = await fetch(
      `https://firebasestorage.googleapis.com/v0/b/${storage.bucket}/o/${encodeURIComponent(
        USERNAME_LIST_PATH
      )}?alt=media`
    );

    if (!response.ok) {
      console.error(
        "Failed to fetch username list:",
        response.status,
        response.statusText
      );
      return false;
    }

    const text = await response.text();

    // Check if the username exists in the list
    const usernames = text.split("\n").map((u) => u.trim());
    return !usernames.includes(username);
  } catch (error: any) {
    // Handle cases where the file might not exist or other errors occur
    console.error("Error checking username availability:", error.message);
    return true; // If there's an error, assume it's available to allow signup
  }
}
