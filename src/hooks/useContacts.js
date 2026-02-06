import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentTenant } from './useCurrentTenant';

export const useContacts = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const { tenantId, loading: tenantLoading } = useCurrentTenant();

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

            // Fetch contacts with explicit tenant filter
            const { data: contactsData, error: contactsError } = await supabase
                .from('contacts')
                .select('*')
                .eq('tenant_id', tenantId) // ← EXPLICIT TENANT FILTER
                .order('created_at', { ascending: false });

            if (contactsError) throw contactsError;

            // Fetch contact-company relationships with explicit tenant filter
            const { data: relationsData, error: relationsError } = await supabase
                .from('contact_companies')
                .select(`
                    *,
                    company:companies(id, trade_name, legal_name, company_type)
                `)
                .eq('tenant_id', tenantId); // ← EXPLICIT TENANT FILTER

            if (relationsError) throw relationsError;


            // Transform to match mock data structure
            const transformedData = contactsData.map(contact => {
                const contactCompanies = relationsData
                    .filter(rel => rel.contact_id === contact.id)
                    .map(rel => ({
                        companyId: rel.company_id,
                        companyName: rel.company?.trade_name || rel.company?.legal_name || 'Empresa Desconocida',
                        companyType: rel.company?.company_type || 'unknown',
                        companyStatus: 'active',
                        isCompanyActive: true,
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
                    notes: contact.notes,
                    companies: contactCompanies,
                    createdAt: contact.created_at,
                    updatedAt: contact.updated_at,
                    // Keep original for updates
                    _original: contact
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
            setError(null);

            // Get current user's tenant_id and comercial_id
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('tenant_id, comercial_id')
                .eq('id', user?.id)
                .single();

            if (userError) throw userError;

            // Insert contact
            const { data: newContact, error: contactError } = await supabase
                .from('contacts')
                .insert([{
                    first_name: contactData.firstName,
                    last_name: contactData.lastName,
                    email: contactData.email,
                    phone: contactData.phone,
                    notes: contactData.notes,
                    tenant_id: userData.tenant_id,
                    comercial_id: userData.comercial_id,
                    created_by: user?.id
                }])
                .select()
                .single();

            if (contactError) throw contactError;

            // Insert company relationships
            if (contactData.companies && contactData.companies.length > 0) {
                const companyRelations = contactData.companies.map(company => ({
                    contact_id: newContact.id,
                    company_id: company.companyId,
                    role: company.role,
                    is_primary: company.isPrimary,
                    tenant_id: userData.tenant_id
                }));

                const { error: relationsError } = await supabase
                    .from('contact_companies')
                    .insert(companyRelations);

                if (relationsError) throw relationsError;
            }

            await fetchContacts(); // Refresh list
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

            // Get current user's tenant_id
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('tenant_id')
                .eq('id', user?.id)
                .single();

            if (userError) throw userError;

            // Update contact
            const { data: updatedContact, error: contactError } = await supabase
                .from('contacts')
                .update({
                    first_name: contactData.firstName,
                    last_name: contactData.lastName,
                    email: contactData.email,
                    phone: contactData.phone,
                    notes: contactData.notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (contactError) throw contactError;

            // Delete existing company relationships
            const { error: deleteError } = await supabase
                .from('contact_companies')
                .delete()
                .eq('contact_id', id);

            if (deleteError) throw deleteError;

            // Insert new company relationships
            if (contactData.companies && contactData.companies.length > 0) {
                const companyRelations = contactData.companies.map(company => ({
                    contact_id: id,
                    company_id: company.companyId,
                    role: company.role,
                    is_primary: company.isPrimary,
                    tenant_id: userData.tenant_id
                }));

                const { error: relationsError } = await supabase
                    .from('contact_companies')
                    .insert(companyRelations);

                if (relationsError) throw relationsError;
            }

            await fetchContacts(); // Refresh list
            return { success: true, data: updatedContact };
        } catch (err) {
            console.error('Error updating contact:', err);
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    // Delete contact (cascade will delete relationships)
    const deleteContact = async (id) => {
        try {
            setError(null);

            const { error: deleteError } = await supabase
                .from('contacts')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchContacts(); // Refresh list
            return { success: true };
        } catch (err) {
            console.error('Error deleting contact:', err);
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    // Link contact to company
    const linkToCompany = async (contactId, companyId, role, isPrimary = false) => {
        try {
            setError(null);

            // Get current user's tenant_id
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('tenant_id')
                .eq('id', user?.id)
                .single();

            if (userError) throw userError;

            // If setting as primary, unset other primaries for this contact
            if (isPrimary) {
                await supabase
                    .from('contact_companies')
                    .update({ is_primary: false })
                    .eq('contact_id', contactId);
            }

            const { error: insertError } = await supabase
                .from('contact_companies')
                .insert([{
                    contact_id: contactId,
                    company_id: companyId,
                    role,
                    is_primary: isPrimary,
                    tenant_id: userData.tenant_id
                }]);

            if (insertError) throw insertError;

            await fetchContacts(); // Refresh list
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

            const { error: deleteError } = await supabase
                .from('contact_companies')
                .delete()
                .eq('contact_id', contactId)
                .eq('company_id', companyId);

            if (deleteError) throw deleteError;

            await fetchContacts(); // Refresh list
        } catch (err) {
            console.error('Error unlinking from company:', err);
            setError(err.message);
            throw err;
        }
    };

    // Load contacts on mount
    useEffect(() => {
        if (tenantId) {
            fetchContacts();
        } else if (!tenantLoading) {
            setLoading(false);
        }
    }, [tenantId, tenantLoading]);


    return {
        contacts,
        loading,
        error,
        refetch: fetchContacts,
        createContact,
        updateContact,
        deleteContact,
        linkToCompany,
        unlinkFromCompany
    };
};
