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
            console.log('🔄 Fetching users for tenant:', tenantId);

            // Get all users with their comercial info using JOIN
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select(`
                    id,
                    email,
                    full_name,
                    role,
                    is_active,
                    created_at,
                    tenant_id,
                    comercial_id,
                    comercial:comerciales(id, name, email)
                `)
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;

            // Map data to include comercial_name
            const usersWithComerciales = usersData.map(user => ({
                ...user,
                comercial_name: user.comercial?.name || null
            }));

            console.log('✅ Fetched', usersWithComerciales.length, 'users:', usersWithComerciales.map(u => u.email));
            setUsers(usersWithComerciales);
            setError(null);
        } catch (err) {
            console.error('❌ Error fetching users:', err);
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
            // Get current user data
            const { data: currentUser, error: fetchError } = await supabase
                .from('users')
                .select('role, comercial_id, full_name, email')
                .eq('id', userId)
                .single();

            if (fetchError) throw fetchError;

            const oldRole = currentUser.role;

            // Update role
            const { error: updateError } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('id', userId);

            if (updateError) throw updateError;

            // Handle comercial creation/deletion based on role change
            // If changing TO supervisor or user, create comercial if doesn't exist
            if ((newRole === 'supervisor' || newRole === 'user') && !currentUser.comercial_id) {
                const { data: comercialData, error: comercialError } = await supabase
                    .from('comerciales')
                    .insert([{
                        name: currentUser.full_name,
                        email: currentUser.email,
                        tenant_id: tenantId,
                        is_active: true,
                        created_by: user.id
                    }])
                    .select()
                    .single();

                if (!comercialError && comercialData) {
                    // Link comercial to user
                    await supabase
                        .from('users')
                        .update({ comercial_id: comercialData.id })
                        .eq('id', userId);
                }
            }

            // If changing FROM supervisor/user TO admin, optionally keep or remove comercial
            // For now, we'll keep the comercial but you can add logic to deactivate it

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
            console.log('🔵 Creating user via Edge Function...');

            // Call Edge Function to create user (NO EMAIL SENT)
            const { data, error } = await supabase.functions.invoke('create-user', {
                body: {
                    email: userData.email,
                    password: userData.password,
                    fullName: userData.fullName,
                    role: userData.role,
                    tenantId: tenantId
                }
            });

            if (error) {
                console.error('❌ Edge Function error:', error);
                throw new Error(error.message);
            }

            if (!data || !data.success) {
                console.error('❌ Edge Function returned error:', data?.error);
                throw new Error(data?.error || 'Unknown error');
            }

            console.log('✅ User created successfully via Edge Function:', data.user);

            // Refresh user list
            await fetchUsers();

            return {
                success: true,
                user: data.user
            };
        } catch (err) {
            console.error('❌ Error creating user:', err.message);
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
