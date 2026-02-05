import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para manejar filtros basados en roles de usuario
 * - Admin: Ve TODO y puede filtrar por cualquier comercial
 * - Supervisor: Ve lo suyo + lo de sus comerciales asignados
 * - Comercial/User: Ve solo lo suyo
 */
export const useRoleBasedFilter = () => {
    const { userProfile, comercialId, isAdmin, isSupervisor } = useAuth();
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
                    // Admin ve todos los comerciales
                    const { data, error } = await supabase
                        .from('comerciales')
                        .select('id, name, email')
                        .eq('is_active', true)
                        .order('name');

                    if (error) throw error;
                    setComerciales(data || []);
                } else if (isSupervisor) {
                    // Supervisor ve solo sus comerciales asignados desde la tabla supervisor_comerciales
                    // Primero, obtener el comercial_id del supervisor actual
                    const { data: supervisorData, error: supervisorError } = await supabase
                        .from('comerciales')
                        .select('id')
                        .eq('user_id', userProfile.id)
                        .single();

                    if (supervisorError) throw supervisorError;

                    if (supervisorData) {
                        // Obtener los comerciales asignados a este supervisor
                        const { data: assignedComerciales, error: assignedError } = await supabase
                            .from('supervisor_comerciales')
                            .select(`
                                comercial_id,
                                comercial:comerciales!supervisor_comerciales_comercial_id_fkey(
                                    id,
                                    name,
                                    email
                                )
                            `)
                            .eq('supervisor_id', supervisorData.id);

                        if (assignedError) throw assignedError;

                        // Extraer los datos del comercial de la relación
                        const comercialesList = (assignedComerciales || [])
                            .map(rel => rel.comercial)
                            .filter(Boolean);

                        setComerciales(comercialesList);
                    } else {
                        setComerciales([]);
                    }
                } else {
                    // Comercial/User solo ve sus propios datos
                    setComerciales([]);
                }
            } catch (error) {
                console.error('Error fetching comerciales:', error);
                setComerciales([]);
            } finally {
                setLoading(false);
            }
        };

        fetchComerciales();
    }, [userProfile, isAdmin, isSupervisor]);

    /**
     * Aplica el filtro basado en rol a una consulta de Supabase
     * @param {Object} query - Query builder de Supabase
     * @returns {Object} Query modificada con los filtros aplicados
     */
    const applyRoleFilter = (query) => {
        if (isAdmin) {
            // Admin: Si seleccionó un comercial específico, filtrar por él
            if (selectedComercialId !== 'all') {
                return query.eq('comercial_id', selectedComercialId);
            }
            // Si es 'all', no aplicar filtro (ve todo)
            return query;
        } else if (isSupervisor) {
            // Supervisor: Ve lo suyo + lo de sus comerciales
            if (selectedComercialId !== 'all') {
                // Si seleccionó un comercial específico
                return query.eq('comercial_id', selectedComercialId);
            } else {
                // Ve lo suyo + todos sus comerciales
                const comercialIds = comerciales.map(c => c.id);
                if (comercialId) {
                    comercialIds.push(comercialId);
                }
                return query.in('comercial_id', comercialIds);
            }
        } else {
            // Comercial/User: Solo ve lo suyo
            if (comercialId) {
                return query.eq('comercial_id', comercialId);
            }
            // Si no tiene comercial_id, no mostrar nada
            return query.eq('comercial_id', null);
        }
    };

    /**
     * Filtra un array de datos basándose en el rol del usuario
     * @param {Array} data - Array de datos a filtrar
     * @returns {Array} Datos filtrados
     */
    const filterDataByRole = (data) => {
        if (!data || !Array.isArray(data)) return [];

        if (isAdmin) {
            // Admin: Si seleccionó un comercial específico, filtrar por él
            if (selectedComercialId !== 'all') {
                return data.filter(item => item.comercial_id === selectedComercialId);
            }
            // Si es 'all', devolver todo
            return data;
        } else if (isSupervisor) {
            // Supervisor: Ve lo suyo + lo de sus comerciales
            if (selectedComercialId !== 'all') {
                return data.filter(item => item.comercial_id === selectedComercialId);
            } else {
                const comercialIds = comerciales.map(c => c.id);
                if (comercialId) {
                    comercialIds.push(comercialId);
                }
                return data.filter(item => comercialIds.includes(item.comercial_id));
            }
        } else {
            // Comercial/User: Solo ve lo suyo
            return data.filter(item => item.comercial_id === comercialId);
        }
    };

    return {
        // Estado
        comerciales,
        selectedComercialId,
        setSelectedComercialId,
        loading,

        // Helpers
        canFilter: isAdmin || isSupervisor,
        showAllOption: isAdmin,

        // Funciones de filtrado
        applyRoleFilter,
        filterDataByRole
    };
};
