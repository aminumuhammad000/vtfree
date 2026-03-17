import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// KYC has been removed from this app.
// This file exists solely to redirect any lingering deep-links back to the profile.
export default function KYCRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/profile' as any);
  }, []);
  return null;
}
