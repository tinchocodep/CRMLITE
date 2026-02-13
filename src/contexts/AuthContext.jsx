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

    // OPTIMIZATION: Start as true to prevent hooks from waiting
    // The actual comercialId will be loaded asynchronously
    const [comercialIdLoaded, setComercialIdLoaded] = useState(true);
    const [isLoading, setIsLoading] = useState(true);


    // Check for existing session on mount
    useEffect(() => {
        let abortController = new AbortController();
        let currentUserId = null;

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user && !abortController.signal.aborted) {
                currentUserId = session.user.id;
                setUser(session.user);
                loadUserProfile(session.user.id, abortController.signal);
            } else {
                // No session - mark as loaded to prevent infinite loading
                setIsLoading(false);
                setComercialIdLoaded(true);
            }
        }).catch((err) => {
            if (!abortController.signal.aborted) {
                console.error('Error getting session:', err);
                setIsLoading(false);
                setComercialIdLoaded(true); // Prevent infinite loading
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // OPTIMIZATION: Only abort if user actually changed
            // This prevents aborting queries for the same user
            if (session?.user && session.user.id === currentUserId) {
                console.log('✅ [AuthContext] Same user - not aborting');
                return;
            }

            // Cancel previous requests only if user changed
            abortController.abort();
            // Create new controller
            abortController = new AbortController();

            if (session?.user) {
                currentUserId = session.user.id;
                setUser(session.user);
                loadUserProfile(session.user.id, abortController.signal);
            } else {
                currentUserId = null;
                setUser(null);
                setUserProfile(null);
                setComercialId(null);
                setComercialIdLoaded(false);
            }
            setIsLoading(false);
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
                setComercialId(profile.comercial_id || null);

                console.log('✅ [AuthContext] User profile loaded:', {
                    role: profile.role,
                    comercial_id: profile.comercial_id
                });
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
        comercialIdLoaded,
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
