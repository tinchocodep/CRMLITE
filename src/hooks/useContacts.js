import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useContacts = (companyId = null) => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('contacts')
                .select(`
          *,
          companies:company_id (
            id,
            trade_name,
            legal_name,
            company_type
          )
        `)
                .order('created_at', { ascending: false });

            if (companyId) {
                query = query.eq('company_id', companyId);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            setContacts(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching contacts:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [companyId]);

    const createContact = async (contactData) => {
        try {
            const { data, error: createError } = await supabase
                .from('contacts')
                .insert([{
                    ...contactData,
                    created_by: (await supabase.auth.getUser()).data.user.id
                }])
                .select()
                .single();

            if (createError) throw createError;
            await fetchContacts();
            return { success: true, data };
        } catch (err) {
            console.error('Error creating contact:', err);
            return { success: false, error: err.message };
        }
    };

    const updateContact = async (id, updates) => {
        try {
            const { data, error: updateError } = await supabase
                .from('contacts')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;
            await fetchContacts();
            return { success: true, data };
        } catch (err) {
            console.error('Error updating contact:', err);
            return { success: false, error: err.message };
        }
    };

    const deleteContact = async (id) => {
        try {
            const { error: deleteError } = await supabase
                .from('contacts')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            await fetchContacts();
            return { success: true };
        } catch (err) {
            console.error('Error deleting contact:', err);
            return { success: false, error: err.message };
        }
    };

    return {
        contacts,
        loading,
        error,
        refetch: fetchContacts,
        createContact,
        updateContact,
        deleteContact
    };
};
