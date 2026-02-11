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
                    // Usar el comercial_id del usuario actual (ya disponible en el contexto)
                    if (comercialId) {
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
                            .eq('supervisor_id', comercialId);

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
        console.log('🔍 [applyRoleFilter] Applying filter:', {
            isAdmin,
            isSupervisor,
            comercialId,
            selectedComercialId
        });

        if (isAdmin) {
            // Admin: Si seleccionó un comercial específico, filtrar por él
            if (selectedComercialId !== 'all' && selectedComercialId !== null && selectedComercialId !== '') {
                console.log('✅ [applyRoleFilter] Admin filtering by selected comercial:', selectedComercialId);
                return query.eq('comercial_id', selectedComercialId);
            }
            // Si es 'all', no aplicar filtro (ve todo)
            console.log('✅ [applyRoleFilter] Admin seeing all');
            return query;
        } else if (isSupervisor) {
            // Supervisor: Ve lo suyo + lo de sus comerciales
            if (selectedComercialId !== 'all' && selectedComercialId !== null && selectedComercialId !== '') {
                // Si seleccionó un comercial específico
                console.log('✅ [applyRoleFilter] Supervisor filtering by selected comercial:', selectedComercialId);
                return query.eq('comercial_id', selectedComercialId);
            } else {
                // Ve lo suyo + todos sus comerciales
                const comercialIds = comerciales.map(c => c.id);
                if (comercialId) {
                    comercialIds.push(comercialId);
                }
                console.log('✅ [applyRoleFilter] Supervisor seeing own + team:', comercialIds);
                return query.in('comercial_id', comercialIds);
            }
        } else {
            // Comercial/User: Solo ve lo suyo
            if (comercialId) {
                console.log('✅ [applyRoleFilter] User/Comercial filtering by own ID:', comercialId);
                return query.eq('comercial_id', comercialId);
            }
            // Si no tiene comercial_id, usar .is() para NULL
            console.log('⚠️ [applyRoleFilter] User has no comercial_id, showing NULL records');
            return query.is('comercial_id', null);
        }
    };

    /**
     * Filtra un array de datos basándose en el rol del usuario
     * @param {Array} data - Array de datos a filtrar
     * @returns {Array} Datos filtrados
     */
    const filterDataByRole = (data) => {
        if (!data || !Array.isArray(data)) return [];

        // Helper function to get comercial_id from item (handles both direct and nested _original)
        const getComercialId = (item) => item.comercial_id || item._original?.comercial_id;

        if (isAdmin) {
            // Admin: Si seleccionó un comercial específico, filtrar por él
            if (selectedComercialId !== 'all') {
                return data.filter(item => getComercialId(item) === parseInt(selectedComercialId));
            }
            // Si es 'all', devolver todo
            return data;
        } else if (isSupervisor) {
            // Supervisor: Ve lo suyo + lo de sus comerciales
            if (selectedComercialId !== 'all') {
                return data.filter(item => getComercialId(item) === parseInt(selectedComercialId));
            } else {
                const comercialIds = comerciales.map(c => c.id);
                if (comercialId) {
                    comercialIds.push(comercialId);
                }
                return data.filter(item => comercialIds.includes(getComercialId(item)));
            }
        } else {
            // Comercial/User: Solo ve lo suyo
            return data.filter(item => getComercialId(item) === comercialId);
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
