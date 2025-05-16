
"use client";

import type { ReactNode } from "react";
import React, { createContext, useState, useEffect, useContext } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser,
  signInAnonymously as firebaseSignInAnonymously,
  // Placeholders for Email/Password - UI for these would be a next step
  // createUserWithEmailAndPassword,
  // signInWithEmailAndPassword,
  // sendEmailVerification, 
  // updateProfile 
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import type { UserProfile } from "@/types";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthContextType {
  currentUser: UserProfile | null | undefined; // undefined: loading, null: no user, UserProfile: user object
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  signInAnonymously: () => Promise<FirebaseUser | null>;
  signOutUser: () => Promise<void>;
  loading: boolean;
  // TODO: Add email/password methods here when UI is built
  // signUpWithEmailPassword: (email, password, displayName) => Promise<FirebaseUser | null>;
  // signInWithEmailPassword: (email, password) => Promise<FirebaseUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userProfileRef = doc(db, "users", user.uid);
          let userProfileData: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            isAnonymous: user.isAnonymous,
            totalQuizPoints: 0, // Initialize if not present
          };

          const userProfileSnap = await getDoc(userProfileRef);
          if (!userProfileSnap.exists()) {
            // Create user profile if it doesn't exist, ensure totalQuizPoints is set
            await setDoc(userProfileRef, { ...userProfileData, totalQuizPoints: userProfileData.totalQuizPoints || 0 });
          } else {
            // If it exists, merge with existing data, ensuring totalQuizPoints is preserved or initialized
            const existingData = userProfileSnap.data() as UserProfile;
            userProfileData = { 
              ...existingData, 
              ...userProfileData, 
              totalQuizPoints: existingData.totalQuizPoints || 0 
            };
          }
          setCurrentUser(userProfileData);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error in onAuthStateChanged listener:", error);
        setCurrentUser(null); // Default to no user on error
      } finally {
        setLoading(false); // Ensure loading is set to false in all cases
      }
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle setting currentUser and setLoading(false)
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setLoading(false); // Set loading false on explicit error
      return null;
    }
  };

  const signInAnonymously = async (): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const result = await firebaseSignInAnonymously(auth);
      // onAuthStateChanged will handle setting currentUser and setLoading(false)
      return result.user;
    } catch (error) {
      console.error("Error signing in anonymously:", error);
      setLoading(false); // Set loading false on explicit error
      return null;
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will set currentUser to null and setLoading(false)
    } catch (error) {
      console.error("Error signing out:", error);
      setLoading(false); // Set loading false on explicit error
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, signInWithGoogle, signInAnonymously, signOutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
