import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentTenant } from './useCurrentTenant';
import { useRoleBasedFilter } from './useRoleBasedFilter';

export const useContacts = () => {
    const { user, isLoading: authLoading, comercialIdLoaded, isAdmin } = useAuth();
    const { tenantId, loading: tenantLoading } = useCurrentTenant();
    const { applyRoleFilter, selectedComercialId } = useRoleBasedFilter();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all contacts with their companies
    const fetchContacts = async () => {
        try {
            // Don't fetch if tenant_id is not available yet
            if (!tenantId) {
                setContacts([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            // Fetch contacts with their company relationships
            let query = supabase
                .from('contacts')
                .select(`
                    *,
                    comercial:comerciales!comercial_id(id, name, email)
                `)
                .eq('tenant_id', tenantId);

            // Apply role-based filter (admin sees all, comercial sees only theirs)
            query = applyRoleFilter(query);

            // Execute query
            query = query.order('created_at', { ascending: false });

            const { data: contactsData, error: contactsError } = await query;

            if (contactsError) throw contactsError;

            // Fetch contact-company relationships
            const { data: relationshipsData, error: relationshipsError } = await supabase
                .from('contact_companies')
                .select(`
                    *,
                    company:companies!company_id(
                        id,
                        trade_name,
                        legal_name,
                        company_type,
                        status,
                        is_active
                    )
                `)
                .eq('tenant_id', tenantId);

            if (relationshipsError) throw relationshipsError;

            // Transform data to match expected structure
            const transformedData = (contactsData || []).map(contact => {
                // Find all companies for this contact
                const contactCompanies = (relationshipsData || [])
                    .filter(rel => rel.contact_id === contact.id)
                    .map(rel => ({
                        companyId: rel.company?.id,
                        companyName: rel.company?.trade_name || rel.company?.legal_name,
                        companyType: rel.company?.company_type,
                        companyStatus: rel.company?.status,
                        isCompanyActive: rel.company?.is_active,
                        role: rel.role,
                        isPrimary: rel.is_primary,
                        addedDate: rel.created_at
                    }));

                return {
                    id: contact.id,
                    firstName: contact.first_name,
                    lastName: contact.last_name,
                    email: contact.email,
                    phone: contact.phone,
                    mobile: contact.mobile,
                    notes: contact.notes,
                    comercialId: contact.comercial_id,
                    comercial: contact.comercial,
                    companies: contactCompanies,
                    createdAt: contact.created_at,
                    updatedAt: contact.updated_at
                };
            });

            setContacts(transformedData);
        } catch (err) {
            console.error('Error fetching contacts:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Create new contact with company relationships
    const createContact = async (contactData) => {
        try {

            // Don't create if tenant_id is not available
            if (!tenantId) {
                throw new Error('Tenant ID not available');
            }

            setError(null);

            // Get current user's data
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const { data: userData } = await supabase
                .from('users')
                .select('comercial_id')
                .eq('id', authUser?.id)
                .single();

            const dataToInsert = {
                first_name: contactData.firstName,
                last_name: contactData.lastName,
                email: contactData.email,
                phone: contactData.phone,
                mobile: contactData.mobile,
                notes: contactData.notes,
                comercial_id: contactData.comercialId || userData?.comercial_id,
                tenant_id: tenantId,
                created_by: authUser?.id
            };

            // Insert contact
            const { data: newContact, error: insertError } = await supabase
                .from('contacts')
                .insert([dataToInsert])
                .select()
                .single();

            if (insertError) {
                console.error('❌ [createContact] Insert error:', insertError);

                // Provide user-friendly error messages
                if (insertError.code === '23502') {
                    if (insertError.message.includes('first_name')) {
                        throw new Error('El nombre es obligatorio');
                    }
                    if (insertError.message.includes('last_name')) {
                        throw new Error('El apellido es obligatorio');
                    }
                    if (insertError.message.includes('comercial_id')) {
                        throw new Error('Debe asignar un comercial');
                    }
                }

                throw insertError;
            }

            // Create company relationships if provided and have valid IDs
            if (contactData.companies && contactData.companies.length > 0) {
                // Filter out companies without valid IDs (pending prospects)
                const validCompanies = contactData.companies.filter(c => c.companyId);

                if (validCompanies.length > 0) {
                    const relationships = validCompanies.map(company => ({
                        contact_id: newContact.id,
                        company_id: company.companyId,
                        role: company.role,
                        is_primary: company.isPrimary || false,
                        tenant_id: tenantId
                    }));

                    const { error: relError } = await supabase
                        .from('contact_companies')
                        .insert(relationships);

                    if (relError) throw relError;
                }
            }

            await fetchContacts();
            return { success: true, data: newContact };
        } catch (err) {
            console.error('Error creating contact:', err);
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    // Update existing contact
    const updateContact = async (id, contactData) => {
        try {
            setError(null);

            // Update contact
            const { data: updatedContact, error: updateError } = await supabase
                .from('contacts')
                .update({
                    first_name: contactData.firstName,
                    last_name: contactData.lastName,
                    email: contactData.email,
                    phone: contactData.phone,
                    mobile: contactData.mobile,
                    notes: contactData.notes,
                    comercial_id: contactData.comercialId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('tenant_id', tenantId)
                .select()
                .single();

            if (updateError) throw updateError;

            // Update company relationships if provided
            if (contactData.companies) {
                // Delete existing relationships
                await supabase
                    .from('contact_companies')
                    .delete()
                    .eq('contact_id', id)
                    .eq('tenant_id', tenantId);

                // Create new relationships
                if (contactData.companies.length > 0) {
                    const relationships = contactData.companies.map(company => ({
                        contact_id: id,
                        company_id: company.companyId,
                        role: company.role,
                        is_primary: company.isPrimary || false,
                        tenant_id: tenantId
                    }));

                    const { error: relError } = await supabase
                        .from('contact_companies')
                        .insert(relationships);

                    if (relError) throw relError;
                }
            }

            await fetchContacts();
            return { success: true, data: updatedContact };
        } catch (err) {
            console.error('Error updating contact:', err);
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    // Delete contact
    const deleteContact = async (id) => {
        try {
            console.log('🗑️ [useContacts] deleteContact called with ID:', id, 'tenantId:', tenantId);
            setError(null);

            // First, verify the contact exists and we can see it
            const { data: existingContact, error: fetchError } = await supabase
                .from('contacts')
                .select('*')
                .eq('id', id)
                .single();

            // Get current user ID for comparison
            const { data: { user } } = await supabase.auth.getUser();

            console.log('🔍 [useContacts] Contact exists check:', {
                exists: !!existingContact,
                contactComercialId: existingContact?.comercial_id,
                currentUserId: user?.id,
                idsMatch: existingContact?.comercial_id === user?.id,
                contactTenantId: existingContact?.tenant_id,
                currentTenantId: tenantId,
                fetchError
            });

            if (fetchError || !existingContact) {
                throw new Error('El contacto no existe o no tienes permisos para verlo');
            }

            // Delete company relationships first (cascade should handle this, but being explicit)
            // This is OK even if contact has no companies - it will just delete 0 rows
            const { data: relData, error: relError } = await supabase
                .from('contact_companies')
                .delete()
                .eq('contact_id', id)
                .select();

            console.log('📊 [useContacts] contact_companies delete result:', {
                deletedRelations: relData?.length || 0,
                relError
            });

            // Don't fail if no relationships - contact might not have companies
            if (relError) {
                console.error('❌ Error deleting contact_companies:', relError);
                throw relError;
            }

            // Delete contact - use .select() to verify it was actually deleted
            const { data: contactData, error: deleteError } = await supabase
                .from('contacts')
                .delete()
                .eq('id', id)
                .select();

            console.log('📊 [useContacts] contacts delete result:', {
                deletedContact: contactData?.[0],
                deleteError
            });

            if (deleteError) {
                console.error('❌ Error deleting contact:', deleteError);
                throw deleteError;
            }

            // Verify deletion actually happened
            if (!contactData || contactData.length === 0) {
                console.warn('⚠️ No contact was deleted - RLS policy blocking DELETE');
                throw new Error('No tienes permisos para eliminar este contacto. Verifica las políticas RLS en Supabase.');
            }

            console.log('✅ Contact deleted successfully, refreshing list...');
            await fetchContacts();
            return { success: true };
        } catch (err) {
            console.error('❌ Error deleting contact:', err);
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    // Link contact to company
    const linkToCompany = async (contactId, companyId, role, isPrimary = false) => {
        try {
            setError(null);

            const { error: linkError } = await supabase
                .from('contact_companies')
                .insert([{
                    contact_id: contactId,
                    company_id: companyId,
                    role: role,
                    is_primary: isPrimary,
                    tenant_id: tenantId
                }]);

            if (linkError) throw linkError;

            await fetchContacts();
        } catch (err) {
            console.error('Error linking to company:', err);
            setError(err.message);
            throw err;
        }
    };

    // Unlink contact from company
    const unlinkFromCompany = async (contactId, companyId) => {
        try {
            setError(null);

            const { error: unlinkError } = await supabase
                .from('contact_companies')
                .delete()
                .eq('contact_id', contactId)
                .eq('company_id', companyId)
                .eq('tenant_id', tenantId);

            if (unlinkError) throw unlinkError;

            await fetchContacts();
        } catch (err) {
            console.error('Error unlinking from company:', err);
            setError(err.message);
            throw err;
        }
    };

    // Load contacts on mount
    useEffect(() => {
        // Wait for auth to finish loading before fetching
        if (authLoading) {
            setLoading(true);
            return;
        }

        // For non-admin users, wait for comercialId to be loaded
        if (!isAdmin && !comercialIdLoaded) {
            setLoading(true);
            return;
        }

        if (user && tenantId) {
            fetchContacts();
        } else if (!tenantLoading) {
            setLoading(false);
        }
    }, [user, tenantId, tenantLoading, selectedComercialId, authLoading, comercialIdLoaded, isAdmin]);

    return {
        contacts,
        loading: loading || tenantLoading,
        error,
        refetch: fetchContacts,
        createContact,
        updateContact,
        deleteContact,
        linkToCompany,
        unlinkFromCompany
    };
};
