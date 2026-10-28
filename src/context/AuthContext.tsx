import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../services/db';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: (customDetails?: { email?: string; name?: string; picture?: string; role?: UserRole }) => Promise<User>;
  switchUserRole: (targetRole: UserRole) => void;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
  completeProfileSetup: (data: { displayName: string; studentId?: string; course?: string; yearLevel?: string; section?: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load current user from DB
    const currentUser = db.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const loginWithGoogle = async (customDetails?: { email?: string; name?: string; picture?: string; role?: UserRole }): Promise<User> => {
    setIsLoading(true);

    const email = customDetails?.email || 'n.roferos.566703@umindanao.edu.ph';
    const fullName = customDetails?.name || 'Alex Morgan';
    const profilePictureUrl = customDetails?.picture || '/src/assets/images/student_avatar_portrait_1792551232666.jpg';
    const role = customDetails?.role || 'student';

    // Check if user already exists
    let existing = db.getUserByEmail(email);

    if (!existing) {
      existing = db.upsertUser({
        email,
        fullName,
        displayName: fullName,
        profilePictureUrl,
        role,
        isSetupComplete: false,
      });
    }

    db.setCurrentUser(existing.id);
    setUser(existing);
    setIsLoading(false);
    return existing;
  };

  const switchUserRole = (targetRole: UserRole) => {
    setIsLoading(true);
    const users = db.getUsers();
    let targetUser: User | undefined;

    if (targetRole === 'admin') {
      targetUser = users.find((u) => u.role === 'admin') || users.find((u) => u.id === 'user_admin_eleanor');
      if (!targetUser) {
        targetUser = db.upsertUser({
          email: 'dean.vance@university.edu',
          fullName: 'Dean Eleanor Vance',
          displayName: 'Dean Vance',
          role: 'admin',
          profilePictureUrl: '/src/assets/images/admin_avatar_portrait_1792551232986.jpg',
          isSetupComplete: true,
        });
      }
    } else {
      targetUser = users.find((u) => u.role === 'student') || users.find((u) => u.id === 'user_alex_morgan');
      if (!targetUser) {
        targetUser = db.upsertUser({
          email: 'n.roferos.566703@umindanao.edu.ph',
          fullName: 'Alex Morgan',
          displayName: 'Alex Morgan',
          role: 'student',
          profilePictureUrl: '/src/assets/images/student_avatar_portrait_1792551232666.jpg',
          isSetupComplete: true,
        });
      }
    }

    db.setCurrentUser(targetUser.id);
    setUser(targetUser);
    setIsLoading(false);
  };

  const logout = () => {
    db.setCurrentUser(null);
    setUser(null);
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (!user) return;
    const updated = db.updateUser(user.id, updates);
    if (updated) {
      setUser(updated);
    }
  };

  const completeProfileSetup = (data: {
    displayName: string;
    studentId?: string;
    course?: string;
    yearLevel?: string;
    section?: string;
  }) => {
    if (!user) return;
    const updated = db.updateUser(user.id, {
      ...data,
      isSetupComplete: true,
    });
    if (updated) {
      setUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        switchUserRole,
        logout,
        updateUserProfile,
        completeProfileSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
