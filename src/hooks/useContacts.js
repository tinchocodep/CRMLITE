import { useState, useEffect } from 'react';
import { mockContacts } from '../data/mockContacts';
import { mockClients } from '../data/mockClients';

export const useContacts = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all contacts with their companies
    const fetchContacts = async () => {
        try {
            setLoading(true);
            setError(null);

            // Simulate async delay
            await new Promise(resolve => setTimeout(resolve, 300));

            // Transform mock data to match expected structure
            const transformedData = mockContacts.map(contact => {
                const company = mockClients.find(c => c.id === contact.company_id);

                return {
                    id: contact.id,
                    firstName: contact.name.split(' ')[0],
                    lastName: contact.name.split(' ').slice(1).join(' '),
                    email: contact.email,
                    phone: contact.phone,
                    position: contact.position,
                    notes: '',
                    companies: company ? [{
                        companyId: company.id,
                        companyName: company.business_name,
                        companyType: company.company_type,
                        companyStatus: company.status,
                        isCompanyActive: true,
                        role: contact.position,
                        isPrimary: true,
                        addedDate: contact.created_at
                    }] : [],
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

            const newContact = {
                id: mockContacts.length + 1,
                name: `${contactData.firstName} ${contactData.lastName}`,
                email: contactData.email,
                phone: contactData.phone,
                position: contactData.companies?.[0]?.role || 'Contacto',
                company_id: contactData.companies?.[0]?.companyId || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            mockContacts.push(newContact);
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

            const index = mockContacts.findIndex(c => c.id === id);
            if (index !== -1) {
                mockContacts[index] = {
                    ...mockContacts[index],
                    name: `${contactData.firstName} ${contactData.lastName}`,
                    email: contactData.email,
                    phone: contactData.phone,
                    position: contactData.companies?.[0]?.role || mockContacts[index].position,
                    company_id: contactData.companies?.[0]?.companyId || mockContacts[index].company_id,
                    updated_at: new Date().toISOString()
                };
            }

            await fetchContacts();
            return { success: true, data: mockContacts[index] };
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

            const index = mockContacts.findIndex(c => c.id === id);
            if (index !== -1) {
                mockContacts.splice(index, 1);
            }

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

            const index = mockContacts.findIndex(c => c.id === contactId);
            if (index !== -1) {
                mockContacts[index].company_id = companyId;
                mockContacts[index].position = role;
            }

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

            const index = mockContacts.findIndex(c => c.id === contactId);
            if (index !== -1 && mockContacts[index].company_id === companyId) {
                mockContacts[index].company_id = null;
            }

            await fetchContacts();
        } catch (err) {
            console.error('Error unlinking from company:', err);
            setError(err.message);
            throw err;
        }
    };

    // Load contacts on mount
    useEffect(() => {
        fetchContacts();
    }, []);

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
