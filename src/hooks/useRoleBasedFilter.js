import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para manejar filtros basados en roles de usuario.
 * Jerarquía: Admin > Gerente de Zona > Supervisor > Comercial
 *
 * - Admin:         Ve TODO, puede filtrar por cualquier comercial
 * - Gerente Zona:  Ve sus supervisores + todos los comerciales de esos supervisores
 * - Supervisor:    Ve solo los comerciales asignados a él
 * - Comercial/User: Ve solo lo suyo
 */
export const useRoleBasedFilter = () => {
    const { userProfile, comercialId, isAdmin, isGerenteZona, isSupervisor } = useAuth();
    const [comerciales, setComerciales] = useState([]);
    const [selectedComercialId, setSelectedComercialId] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComerciales = async () => {
            if (!userProfile) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                if (isAdmin) {
                    // Admin: ve todos los comerciales activos del tenant
                    const { data, error } = await supabase
                        .from('comerciales')
                        .select('id, name, email')
                        .eq('is_active', true)
                        .order('name');

                    if (error) throw error;
                    setComerciales(data || []);

                } else if (isGerenteZona) {
                    // Gerente de Zona: ve sus supervisores (users con supervisor_id = su user_id)
                    // y los comerciales de esos supervisores, más su propio perfil
                    if (comercialId && userProfile?.id) {
                        // Obtener los supervisores bajo este GZ (por users.supervisor_id)
                        const { data: supUsers } = await supabase
                            .from('users')
                            .select('id, comercial_id')
                            .eq('supervisor_id', userProfile.id)
                            .eq('role', 'supervisor')
                            .eq('is_active', true);

                        const supComercialIds = (supUsers || [])
                            .map(u => u.comercial_id)
                            .filter(Boolean);

                        // Comerciales de esos supervisores
                        let teamComerciales = [];
                        if (supComercialIds.length > 0) {
                            const { data: teamData } = await supabase
                                .from('comerciales')
                                .select('id, name, email, supervisor_id')
                                .in('supervisor_id', supComercialIds)
                                .eq('is_active', true)
                                .order('name');
                            // Incluir también los comerciales de los supervisores mismos
                            const { data: supComs } = await supabase
                                .from('comerciales')
                                .select('id, name, email')
                                .in('id', supComercialIds)
                                .eq('is_active', true);
                            teamComerciales = [...(supComs || []), ...(teamData || [])];
                        }

                        // Incluir el propio comercial del GZ
                        const { data: selfData } = await supabase
                            .from('comerciales')
                            .select('id, name, email')
                            .eq('id', comercialId)
                            .single();

                        const allVisible = selfData
                            ? [selfData, ...teamComerciales.filter(c => c.id !== selfData.id)]
                            : teamComerciales;

                        setComerciales(allVisible);
                    } else {
                        setComerciales([]);
                    }

                } else if (isSupervisor) {
                    // Supervisor: ve sus comerciales asignados + su propio perfil comercial
                    if (comercialId) {
                        const { data, error } = await supabase
                            .from('comerciales')
                            .select('id, name, email')
                            .eq('supervisor_id', comercialId)
                            .eq('is_active', true)
                            .order('name');

                        if (error) throw error;

                        // Incluir el propio comercial del supervisor si existe
                        const teamComerciales = data || [];
                        const { data: selfData } = await supabase
                            .from('comerciales')
                            .select('id, name, email')
                            .eq('id', comercialId)
                            .single();

                        const allVisible = selfData
                            ? [selfData, ...teamComerciales.filter(c => c.id !== selfData.id)]
                            : teamComerciales;

                        setComerciales(allVisible);
                    } else {
                        setComerciales([]);
                    }

                } else {
                    // Comercial/User: no tiene comerciales subordinados
                    setComerciales([]);
                }
            } catch (error) {
                console.error('Error fetching comerciales for role filter:', error);
                setComerciales([]);
            } finally {
                setLoading(false);
            }
        };

        fetchComerciales();
    }, [userProfile, isAdmin, isGerenteZona, isSupervisor, comercialId]);

    /**
     * applyRoleFilter
     * Aplica el filtro de scope a una query de Supabase (tabla con columna comercial_id).
     */
    const applyRoleFilter = (query) => {
        if (isAdmin) {
            if (selectedComercialId !== 'all' && selectedComercialId != null && selectedComercialId !== '') {
                return query.eq('comercial_id', selectedComercialId);
            }
            return query;

        } else if (isGerenteZona || isSupervisor) {
            if (selectedComercialId !== 'all' && selectedComercialId != null && selectedComercialId !== '') {
                return query.eq('comercial_id', selectedComercialId);
            }
            const comercialIds = comerciales.map(c => c.id);
            if (comercialId) comercialIds.push(comercialId);
            return comercialIds.length > 0
                ? query.in('comercial_id', comercialIds)
                : query.is('comercial_id', null); // no scope → no data
        } else {
            // Comercial propio
            return comercialId
                ? query.eq('comercial_id', comercialId)
                : query.is('comercial_id', null);
        }
    };

    /**
     * filterDataByRole
     * Filtra un array de datos ya obtenido según el scope del rol.
     */
    const filterDataByRole = (data) => {
        if (!data || !Array.isArray(data)) return [];

        const getComercialId = (item) => {
            const raw = item.comercialId ?? item.comercial_id ?? item._original?.comercial_id;
            return raw != null ? String(raw) : null;
        };

        if (isAdmin) {
            if (selectedComercialId !== 'all') {
                return data.filter(item => getComercialId(item) === String(selectedComercialId));
            }
            return data;

        } else if (isGerenteZona || isSupervisor) {
            if (selectedComercialId !== 'all') {
                return data.filter(item => getComercialId(item) === String(selectedComercialId));
            }
            const ids = comerciales.map(c => String(c.id));
            if (comercialId) ids.push(String(comercialId));
            return data.filter(item => ids.includes(getComercialId(item)));

        } else {
            return data.filter(item => getComercialId(item) === String(comercialId));
        }
    };

    return {
        comerciales,
        selectedComercialId,
        setSelectedComercialId,
        loading,
        canFilter: isAdmin || isGerenteZona || isSupervisor,
        showAllOption: isAdmin,
        applyRoleFilter,
        filterDataByRole,
    };
};
