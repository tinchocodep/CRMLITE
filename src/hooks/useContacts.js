import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useContacts = () => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all contacts with their companies
    const fetchContacts = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch contacts with their company relationships
            const { data: contactsData, error: contactsError } = await supabase
                .from('contacts')
                .select(`
                    *,
                    comercial:comerciales!comercial_id(id, name, email)
                `)
                .order('created_at', { ascending: false });

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
                `);

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
            setError(null);

            // Get current user's data
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const { data: userData } = await supabase
                .from('users')
                .select('comercial_id')
                .eq('id', authUser?.id)
                .single();

            // Insert contact
            const { data: newContact, error: insertError } = await supabase
                .from('contacts')
                .insert([{
                    first_name: contactData.firstName,
                    last_name: contactData.lastName,
                    email: contactData.email,
                    phone: contactData.phone,
                    mobile: contactData.mobile,
                    notes: contactData.notes,
                    comercial_id: contactData.comercialId || userData?.comercial_id,
                    created_by: authUser?.id
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            // Create company relationships if provided
            if (contactData.companies && contactData.companies.length > 0) {
                const relationships = contactData.companies.map(company => ({
                    contact_id: newContact.id,
                    company_id: company.companyId,
                    role: company.role,
                    is_primary: company.isPrimary || false
                }));

                const { error: relError } = await supabase
                    .from('contact_companies')
                    .insert(relationships);

                if (relError) throw relError;
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
                .select()
                .single();

            if (updateError) throw updateError;

            // Update company relationships if provided
            if (contactData.companies) {
                // Delete existing relationships
                await supabase
                    .from('contact_companies')
                    .delete()
                    .eq('contact_id', id);

                // Create new relationships
                if (contactData.companies.length > 0) {
                    const relationships = contactData.companies.map(company => ({
                        contact_id: id,
                        company_id: company.companyId,
                        role: company.role,
                        is_primary: company.isPrimary || false
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
            setError(null);

            // Delete company relationships first (cascade should handle this, but being explicit)
            await supabase
                .from('contact_companies')
                .delete()
                .eq('contact_id', id);

            // Delete contact
            const { error: deleteError } = await supabase
                .from('contacts')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchContacts();
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

            const { error: linkError } = await supabase
                .from('contact_companies')
                .insert([{
                    contact_id: contactId,
                    company_id: companyId,
                    role: role,
                    is_primary: isPrimary
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
                .eq('company_id', companyId);

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
        if (user) {
            fetchContacts();
        }
    }, [user]);

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
