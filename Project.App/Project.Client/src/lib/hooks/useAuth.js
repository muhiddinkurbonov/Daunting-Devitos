import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userService } from '../api';

/**
 * Custom hook for authentication
 * @returns {Object} User data and loading state
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await userService.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setError(err);
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  return { user, loading, error, setUser };
};
