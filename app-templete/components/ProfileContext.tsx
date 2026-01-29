import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { userService } from '../services/api'; // Changed to api.ts where userService is exported
import { useAuth } from '../context/AuthContext';

export interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  profileImage: string;
  role?: string;
}

interface ProfileContextType {
  profileData: ProfileData;
  updateProfile: (data: ProfileData) => void;
  getFullName: () => string;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    profileImage: 'https://i.pravatar.cc/150?img=12',
    role: 'user',
  });

  // Load user data from server on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!isAuthenticated) return;

      try {
        // Try to get from server first
        const response = await userService.getProfile();
        if (response.data && response.data.data && response.data.data.user) {
          // The API response structure in api.ts is ApiResponse<{ user: User }>
          // but the actual response might be { success: true, data: { user: ... } }
          // Let's check api.ts types. api.ts says: api.get<ApiResponse<{ user: User }>>
          // ApiResponse<T> usually has { success: boolean, data: T, message: string }
          // So response.data is { success: true, data: { user: ... }, ... }
          // So we need response.data.data.user
          const user = response.data.data.user;
          setProfileData({
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            email: user.email || '',
            phoneNumber: user.phone_number || '',
            address: user.address || '',
            city: user.city || '',
            state: user.state || '',
            profileImage: user.avatar || 'https://i.pravatar.cc/150?img=12',
            role: user.role || 'user',
          });
        } else {
          // Fallback to cached user data
          const cachedUser = await authService.getCurrentUser();
          if (cachedUser) {
            setProfileData({
              firstName: cachedUser.first_name || '',
              lastName: cachedUser.last_name || '',
              email: cachedUser.email || '',
              phoneNumber: cachedUser.phone_number || '',
              address: cachedUser.address || '',
              city: cachedUser.city || '',
              state: cachedUser.state || '',
              profileImage: cachedUser.avatar || 'https://i.pravatar.cc/150?img=12',
              role: cachedUser.role || 'user',
            });
          }
        }
      } catch (error) {
        console.log('Failed to load profile from server, using cached data');
        // Fallback to cached user data
        const cachedUser = await authService.getCurrentUser();
        if (cachedUser) {
          setProfileData({
            firstName: cachedUser.first_name || '',
            lastName: cachedUser.last_name || '',
            email: cachedUser.email || '',
            phoneNumber: cachedUser.phone_number || '',
            address: cachedUser.address || '',
            city: cachedUser.city || '',
            state: cachedUser.state || '',
            profileImage: cachedUser.avatar || 'https://i.pravatar.cc/150?img=12',
            role: cachedUser.role || 'user',
          });
        }
      }
    };

    loadUserProfile();
  }, [isAuthenticated]);

  const updateProfile = (data: ProfileData) => {
    setProfileData(data);
  };

  const getFullName = () => {
    return `${profileData.firstName} ${profileData.lastName}`;
  };

  return (
    <ProfileContext.Provider value={{ profileData, updateProfile, getFullName }}>
      {children}
    </ProfileContext.Provider>
  );
};