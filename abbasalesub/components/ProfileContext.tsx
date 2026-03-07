import React, { createContext, ReactNode, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User } from '../services/types';

export interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  profileImage: string;
  role?: string;
  kyc_status?: 'pending' | 'verified' | 'rejected' | 'none';
  bvn?: string;
  nin?: string;
  date_of_birth?: string;
}

interface ProfileContextType {
  profileData: ProfileData;
  updateProfile: (data: ProfileData) => void;
  getFullName: () => string;
  refreshProfile: () => Promise<void>;
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
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    state: '',
    profileImage: 'https://i.pravatar.cc/150?img=12',
    role: 'user',
    kyc_status: 'none',
  });

  const loadUserProfile = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await userService.getProfile();
      if (response.data && response.data.success && response.data.data) {
        const user = response.data.data as User;

        setProfileData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone_number: user.phone_number || '',
          address: user.address || '',
          city: user.city || '',
          state: user.state || '',
          profileImage: user.profile_picture_url || user.avatar || 'https://i.pravatar.cc/150?img=12',
          role: user.role || 'user',
          kyc_status: user.kyc_status || 'none',
          bvn: user.bvn || '',
          nin: user.nin || '',
          date_of_birth: user.date_of_birth || '',
        });
      } else {
        const cachedUser = await authService.getCurrentUser() as User;
        if (cachedUser) {
          setProfileData({
            first_name: cachedUser.first_name || '',
            last_name: cachedUser.last_name || '',
            email: cachedUser.email || '',
            phone_number: cachedUser.phone_number || '',
            address: cachedUser.address || '',
            city: cachedUser.city || '',
            state: cachedUser.state || '',
            profileImage: cachedUser.profile_picture_url || cachedUser.avatar || 'https://i.pravatar.cc/150?img=12',
            role: cachedUser.role || 'user',
            kyc_status: cachedUser.kyc_status || 'none',
            bvn: cachedUser.bvn || '',
            nin: cachedUser.nin || '',
            date_of_birth: cachedUser.date_of_birth || '',
          });
        }
      }
    } catch (error) {
      console.log('Failed to load profile from server');
      const cachedUser = await authService.getCurrentUser() as any;
      if (cachedUser) {
        setProfileData({
          first_name: cachedUser.first_name || '',
          last_name: cachedUser.last_name || '',
          email: cachedUser.email || '',
          phone_number: cachedUser.phone_number || '',
          address: cachedUser.address || '',
          city: cachedUser.city || '',
          state: cachedUser.state || '',
          profileImage: cachedUser.profile_picture_url || cachedUser.avatar || 'https://i.pravatar.cc/150?img=12',
          role: cachedUser.role || 'user',
          kyc_status: cachedUser.kyc_status || 'none',
          bvn: cachedUser.bvn || '',
          nin: cachedUser.nin || '',
          date_of_birth: cachedUser.date_of_birth || '',
        });
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const updateProfile = (data: ProfileData) => {
    setProfileData(data);
  };

  const getFullName = () => {
    return `${profileData.first_name} ${profileData.last_name}`;
  };

  const refreshProfile = async () => {
    await loadUserProfile();
  };

  return (
    <ProfileContext.Provider value={{ profileData, updateProfile, getFullName, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};