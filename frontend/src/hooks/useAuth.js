import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser, clearAuth } from '@/redux/slices/authSlice';

export function useAuth() {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getCurrentUser()).catch(() => dispatch(clearAuth()));
  }, [dispatch]);

  return auth;
}
