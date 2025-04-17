import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';

export interface Profile {
  uid: string;
  email?: string;
  phoneNumber: string;
  username?: string;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
}

export async function createProfile(profile: Profile): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  try {
    console.log('Creating profile with data:', profile);
    
    const profileRef = doc(db, 'profiles', profile.uid);
    const profileData = {
      ...profile,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(profileRef, profileData);
    console.log('Profile created successfully');
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}

export async function updateProfile(uid: string, data: Partial<Profile>): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  try {
    console.log('Updating profile with data:', data);
    
    const profileRef = doc(db, 'profiles', uid);
    const updateData = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(profileRef, updateData);
    console.log('Profile updated successfully');
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

export async function getProfile(uid: string): Promise<Profile | null> {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  try {
    const profileRef = doc(db, 'profiles', uid);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      const data = profileSnap.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Profile;
    }
    return null;
  } catch (error) {
    console.error('Error getting profile:', error);
    throw error;
  }
} 