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
        let abortController = new AbortController();

        const initializeAuth = async () => {
            try {
                // Get initial session
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user && !abortController.signal.aborted) {
                    setUser(session.user);
                    // Wait for profile to load before setting isLoading to false
                    await loadUserProfile(session.user.id, abortController.signal);
                }
            } catch (err) {
                if (!abortController.signal.aborted) {
                    console.error('Error getting session:', err);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            // Cancel previous requests
            abortController.abort();
            // Create new controller
            abortController = new AbortController();

            setIsLoading(true);

            if (session?.user) {
                setUser(session.user);
                await loadUserProfile(session.user.id, abortController.signal);
            } else {
                setUser(null);
                setUserProfile(null);
                setComercialId(null);
            }

            if (!abortController.signal.aborted) {
                setIsLoading(false);
            }
        });

        return () => {
            abortController.abort();
            subscription.unsubscribe();
        };
    }, []);

    const loadUserProfile = async (userId, signal = null) => {
        try {
            // Get user profile (includes comercial_id)
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;

            // Only update state if not aborted
            if (!signal || !signal.aborted) {
                setUserProfile(profile);
                // Set comercial_id directly from user profile
                setComercialId(profile.comercial_id || null);
            }
        } catch (error) {
            // Only log if not aborted
            if (!signal || !signal.aborted) {
                console.error('Error loading user profile:', error);
            }
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
