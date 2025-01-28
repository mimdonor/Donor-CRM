"use client"
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

function AuthProvider({ children }) {
    const [session, setSession] = useState();

    useEffect(() => {
        const fetchSession = async () => {
            const { data } = await supabase.auth.getSession();
            console.log('data', data);
            setSession(data.session);
        };

        fetchSession();
    }, []);
    return (
        <AuthContext.Provider value={{ session }}>
            {children}
        </AuthContext.Provider>
    );
}

const useSession = () => useContext(AuthContext);

export { AuthProvider, useSession };
