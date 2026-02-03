import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getCurrentUser, getCurrentComercialId, getCurrentUserRole } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [comercialId, setComercialId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                loadUserProfile(session.user.id);
            }
            setIsLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
                loadUserProfile(session.user.id);
            } else {
                setUser(null);
                setUserProfile(null);
                setComercialId(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadUserProfile = async (userId) => {
        try {
            // Get user profile
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;
            setUserProfile(profile);

            // Get comercial ID if exists (optional - user may not be a comercial)
            const { data: comercial, error: comercialError } = await supabase
                .from('comerciales')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle(); // Use maybeSingle() instead of single() to handle no results

            // Only set comercialId if a record exists and no error
            if (!comercialError && comercial) {
                setComercialId(comercial.id);
            } else {
                setComercialId(null); // Explicitly set to null if no comercial record
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    };

    const login = async (email, password, rememberMe = false) => {
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            setUser(data.user);
            await loadUserProfile(data.user.id);
            setIsLoading(false);
            return { success: true, user: data.user };
        } catch (error) {
            setIsLoading(false);
            return { success: false, error: error.message };
        }
    };

    const signup = async (email, password, fullName, role = 'user') => {
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role
                    }
                }
            });

            if (error) throw error;

            setIsLoading(false);
            return { success: true, user: data.user };
        } catch (error) {
            setIsLoading(false);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            setUserProfile(null);
            setComercialId(null);
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const value = {
        user,
        userProfile,
        comercialId,
        isLoading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        role: userProfile?.role || null,
        isAdmin: userProfile?.role === 'admin',
        isSupervisor: userProfile?.role === 'supervisor',
        isUser: userProfile?.role === 'user'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
