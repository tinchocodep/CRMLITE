import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentTenant } from './useCurrentTenant';

export const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const { user } = useAuth();
    const { tenantId, loading: tenantLoading } = useCurrentTenant();

    // Detect current user role
    useEffect(() => {
        const fetchCurrentUserRole = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (!error && data) {
                    setCurrentUserRole(data.role);
                }
            } catch (err) {
                console.error('Error fetching user role:', err);
            }
        };

        fetchCurrentUserRole();
    }, [user]);

    const isAdmin = currentUserRole === 'admin';
    const isSupervisor = currentUserRole === 'supervisor';
    const isUser = currentUserRole === 'user';

    const fetchUsers = async () => {
        // Allow all authenticated users to view users
        if (!user) {
            setError('Unauthorized: Authentication required');
            setLoading(false);
            return;
        }

        // Don't fetch if tenant_id is not available yet
        if (!tenantId) {
            setUsers([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Get all users with their comercial info - FILTERED BY TENANT
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select(`
          id,
          email,
          full_name,
          role,
          is_active,
          created_at,
          tenant_id
        `)
                .eq('tenant_id', tenantId)  // ← EXPLICIT TENANT FILTER
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;

            // Get comerciales separately - FILTERED BY TENANT
            const { data: comercialesData, error: comercialesError } = await supabase
                .from('comerciales')
                .select('id, user_id, name, email')
                .eq('tenant_id', tenantId);  // ← EXPLICIT TENANT FILTER

            if (comercialesError) throw comercialesError;

            // Merge data
            const usersWithComerciales = usersData.map(user => {
                const comercial = comercialesData.find(c => c.user_id === user.id);
                return {
                    ...user,
                    comercial_id: comercial?.id || null,
                    comercial_name: comercial?.name || null
                };
            });

            setUsers(usersWithComerciales);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch users once we know the current user's role and tenant
        if (currentUserRole !== null && user && tenantId) {
            fetchUsers();
        } else if (!tenantLoading && currentUserRole !== null) {
            setLoading(false);
        }
    }, [currentUserRole, user, tenantId, tenantLoading]);

    const updateUserRole = async (userId, newRole) => {
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

        try {
            const { error: updateError } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('id', userId);

            if (updateError) throw updateError;

            await fetchUsers(); // Refresh list
            return { success: true };
        } catch (err) {
            console.error('Error updating user role:', err);
            return { success: false, error: err.message };
        }
    };

    const assignComercial = async (userId, userData) => {
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

        try {
            // Check if comercial already exists
            const { data: existing, error: checkError } = await supabase
                .from('comerciales')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existing) {
                // Update existing comercial
                const { error: updateError } = await supabase
                    .from('comerciales')
                    .update({
                        name: userData.name,
                        email: userData.email
                    })
                    .eq('user_id', userId);

                if (updateError) throw updateError;
            } else {
                // Create new comercial
                const { error: insertError } = await supabase
                    .from('comerciales')
                    .insert({
                        user_id: userId,
                        name: userData.name,
                        email: userData.email,
                        is_active: true
                    });

                if (insertError) throw insertError;
            }

            await fetchUsers(); // Refresh list
            return { success: true };
        } catch (err) {
            console.error('Error assigning comercial:', err);
            return { success: false, error: err.message };
        }
    };

    const toggleUserActive = async (userId, isActive) => {
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

        try {
            const { error: updateError } = await supabase
                .from('users')
                .update({ is_active: isActive })
                .eq('id', userId);

            if (updateError) throw updateError;

            await fetchUsers(); // Refresh list
            return { success: true };
        } catch (err) {
            console.error('Error toggling user active:', err);
            return { success: false, error: err.message };
        }
    };

    const createUser = async (userData) => {
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

        try {
            // Create user using Supabase Auth signUp
            // The database trigger will automatically create the user in public.users
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        full_name: userData.fullName,
                        role: userData.role,
                        tenant_id: tenantId  // ← PASS TENANT_ID IN METADATA
                    },
                    emailRedirectTo: window.location.origin
                }
            });

            if (signUpError) {
                console.error('SignUp error:', signUpError);
                throw new Error(signUpError.message);
            }

            if (!signUpData.user) {
                throw new Error('User creation failed - no user returned');
            }

            // Wait a bit for the trigger to create the user in public.users
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Verify the user was created with correct tenant_id
            const { data: verifyData, error: verifyError } = await supabase
                .from('users')
                .select('id, email, full_name, role, tenant_id')
                .eq('id', signUpData.user.id)
                .single();

            if (verifyError) {
                console.error('Verification error:', verifyError);
                throw new Error('User created but verification failed');
            }

            // If tenant_id is still wrong, update it (fallback)
            if (verifyData.tenant_id !== tenantId) {
                console.warn('Tenant ID mismatch, updating...');
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        role: userData.role,
                        full_name: userData.fullName,
                        tenant_id: tenantId
                    })
                    .eq('id', signUpData.user.id);

                if (updateError) {
                    console.error('Role update error:', updateError);
                }
            }

            await fetchUsers(); // Refresh list
            return {
                success: true,
                user: {
                    id: signUpData.user.id,
                    email: signUpData.user.email,
                    full_name: userData.fullName,
                    role: userData.role
                }
            };
        } catch (err) {
            console.error('Error creating user:', err);
            return { success: false, error: err.message };
        }
    };

    return {
        users,
        loading,
        error,
        isAdmin,
        isSupervisor,
        isUser,
        currentUserRole,
        refetch: fetchUsers,
        createUser,
        updateUserRole,
        assignComercial,
        toggleUserActive
    };
};
