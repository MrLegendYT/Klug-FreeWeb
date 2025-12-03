import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme, User, ViewState, UserTheme } from './types';
import { auth, db } from './services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  onSnapshot,
  addDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

interface StoreContextType {
  themes: Theme[];
  userThemes: UserTheme[];
  user: User | null;
  currentView: ViewState;
  selectedThemeId: string | null;
  isLoading: boolean;
  
  // Actions
  setView: (view: ViewState) => void;
  selectTheme: (id: string) => void;
  openEditor: (id: string) => void; 
  unlockTheme: (themeId: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  addTheme: (theme: Omit<Theme, 'id' | 'downloads'>) => Promise<void>;
  deleteTheme: (id: string) => Promise<void>;
  saveUserTheme: (originalThemeId: string, newHtml: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [userThemes, setUserThemes] = useState<UserTheme[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Listen for Themes (Real-time)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'themes'), (snapshot) => {
      const themesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Theme[];
      setThemes(themesData);
    });

    return () => unsubscribe();
  }, []);

  // 2. Listen for Auth State & User Data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch extended user data from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubUser = onSnapshot(userDocRef, (docSnap) => {
           if (docSnap.exists()) {
             setUser({
               id: firebaseUser.uid,
               ...docSnap.data()
             } as User);
           }
        });

        // Listen for User's Saved Themes
        const q = query(collection(db, 'user_themes'), where('userId', '==', firebaseUser.uid));
        const unsubUserThemes = onSnapshot(q, (snapshot) => {
          const uThemes = snapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data()
          })) as UserTheme[];
          setUserThemes(uThemes);
        });

        return () => {
          unsubUser();
          unsubUserThemes();
        };
      } else {
        setUser(null);
        setUserThemes([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setView = (view: ViewState) => setCurrentView(view);

  const selectTheme = (id: string) => {
    setSelectedThemeId(id);
    setView(ViewState.THEME_DETAILS);
  };

  const openEditor = (id: string) => {
    setSelectedThemeId(id);
    setView(ViewState.AI_EDITOR);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    setView(ViewState.HOME);
  };

  const signup = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    // Create user profile in Firestore
    const newUser: Omit<User, 'id'> = {
      name,
      email,
      unlockedThemeIds: [],
      isAdmin: false
    };
    
    await setDoc(doc(db, 'users', uid), newUser);
    setView(ViewState.HOME);
  };

  const logout = async () => {
    await signOut(auth);
    setView(ViewState.LOGIN);
  };

  const unlockTheme = async (themeId: string) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.id);
    await updateDoc(userRef, {
      unlockedThemeIds: arrayUnion(themeId)
    });
  };

  const addTheme = async (themeData: Omit<Theme, 'id' | 'downloads'>) => {
    const newTheme = {
      ...themeData,
      downloads: 0,
      createdAt: new Date()
    };
    await addDoc(collection(db, 'themes'), newTheme);
  };

  const deleteTheme = async (id: string) => {
    await deleteDoc(doc(db, 'themes', id));
  };

  const saveUserTheme = async (originalThemeId: string, newHtml: string) => {
    if (!user) return;
    
    // Check if user already has a saved version of this theme
    const existingUserTheme = userThemes.find(ut => ut.originalThemeId === originalThemeId);
    
    if (existingUserTheme) {
      // Update existing
      const themeRef = doc(db, 'user_themes', existingUserTheme.id);
      await updateDoc(themeRef, { 
        previewHtml: newHtml,
        updatedAt: new Date() 
      });
    } else {
      // Create new fork
      const originalTheme = themes.find(t => t.id === originalThemeId);
      if (!originalTheme) throw new Error("Original theme not found");

      await addDoc(collection(db, 'user_themes'), {
        userId: user.id,
        originalThemeId: originalThemeId,
        title: originalTheme.title,
        description: originalTheme.description,
        previewHtml: newHtml,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  };

  return (
    <StoreContext.Provider value={{
      themes,
      userThemes,
      user,
      currentView,
      selectedThemeId,
      isLoading,
      setView,
      selectTheme,
      openEditor,
      unlockTheme,
      login,
      signup,
      logout,
      addTheme,
      deleteTheme,
      saveUserTheme
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};