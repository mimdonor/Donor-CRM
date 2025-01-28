'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from "next-auth/react";

const PermissionsContext = createContext();

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const { data: session, status } = useSession();

  
  useEffect(() => {
    if(session){
      fetchPermissions();
    }
  }, [session]);
  
  const fetchPermissions = async () => {
    const { email } = session.user;
    try {
    
      const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', email)
      .single();
      
      setUser(userData);

      if (userError) {
        throw userError;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('permissions')
        .eq('role_name', userData.role)
        .single();

      if (roleError) {
        throw roleError;
      }

      setPermissions(roleData.permissions);
      console.log('Permissions', roleData.permissions);
      // console.log('User', userData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setError('Failed to fetch permissions');
      setLoading(false);
    }
  };

  return (
    <PermissionsContext.Provider value={{ permissions, loading, error, user }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  return useContext(PermissionsContext);
};