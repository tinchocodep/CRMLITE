import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const { user } = useAuth();

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

        try {
            setLoading(true);

            // Get all users with their comercial info
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select(`
          id,
          email,
          full_name,
          role,
          is_active,
          created_at
        `)
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;

            // Get comerciales separately
            const { data: comercialesData, error: comercialesError } = await supabase
                .from('comerciales')
                .select('id, user_id, name, email');

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
        // Fetch users once we know the current user's role
        if (currentUserRole !== null && user) {
            fetchUsers();
        }
    }, [currentUserRole, user]);

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
            // Get current session token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('No active session');
            }

            // Call Edge Function to create user
            const { data, error } = await supabase.functions.invoke('create-user', {
                body: {
                    email: userData.email,
                    password: userData.password,
                    fullName: userData.fullName,
                    role: userData.role
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            await fetchUsers(); // Refresh list
            return { success: true, user: data.user };
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
