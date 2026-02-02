import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useComerciales = () => {
    const [comerciales, setComerciales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchComerciales = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('comerciales')
                .select('*')
                .eq('is_active', true)
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;
            setComerciales(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching comerciales:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComerciales();
    }, []);

    return {
        comerciales,
        loading,
        error,
        refetch: fetchComerciales
    };
};
