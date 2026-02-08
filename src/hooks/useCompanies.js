import { useState, useEffect, useMemo, useCallback } from 'react';
import { mockClients } from '../data/mockClients';

export const useCompanies = (type = null) => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper: Map qualification score to status (memoized)
    const mapQualificationToStatus = useCallback((score) => {
        if (!score) return 'contacted';
        if (score <= 1) return 'contacted';
        if (score === 2) return 'quoted';
        return 'near_closing';
    }, []);

    // Helper: Map status to qualification score (memoized)
    const mapStatusToQualification = useCallback((status) => {
        const mapping = {
            'contacted': 1,
            'quoted': 2,
            'near_closing': 3
        };
        return mapping[status] || 1;
    }, []);

    const fetchCompanies = async () => {
        try {
            setLoading(true);

            // Simulate async delay
            await new Promise(resolve => setTimeout(resolve, 300));

            // Filter by type if specified
            let filteredCompanies = [...mockClients];
            if (type) {
                filteredCompanies = filteredCompanies.filter(c => c.company_type === type);
            }

            setCompanies(filteredCompanies);
            setError(null);
        } catch (err) {
            console.error('Error fetching companies:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, [type]);


    const createCompany = async (companyData) => {
        try {
            const newCompany = {
                id: mockClients.length + 1,
                ...companyData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            mockClients.push(newCompany);
            await fetchCompanies();
            return { success: true, data: newCompany };
        } catch (err) {
            console.error('Error creating company:', err);
            return { success: false, error: err.message };
        }
    };

    const updateCompany = async (id, updates) => {
        try {
            const index = mockClients.findIndex(c => c.id === id);
            if (index !== -1) {
                mockClients[index] = {
                    ...mockClients[index],
                    ...updates,
                    updated_at: new Date().toISOString()
                };
            }
            await fetchCompanies();
            return { success: true, data: mockClients[index] };
        } catch (err) {
            console.error('Error updating company:', err);
            return { success: false, error: err.message };
        }
    };

    const deleteCompany = async (id) => {
        try {
            const index = mockClients.findIndex(c => c.id === id);
            if (index !== -1) {
                mockClients[index].status = 'inactive';
            }
            await fetchCompanies();
            return { success: true };
        } catch (err) {
            console.error('Error deleting company:', err);
            return { success: false, error: err.message };
        }
    };

    const convertToClient = async (companyId, clientData) => {
        try {
            const index = mockClients.findIndex(c => c.id === companyId);
            if (index !== -1) {
                mockClients[index] = {
                    ...mockClients[index],
                    company_type: 'client',
                    ...clientData,
                    updated_at: new Date().toISOString()
                };
            }
            await fetchCompanies();
            return { success: true, data: mockClients[index] };
        } catch (err) {
            console.error('Error converting to client:', err);
            return { success: false, error: err.message };
        }
    };

    return {
        companies,
        loading,
        error,
        refetch: fetchCompanies,
        createCompany,
        updateCompany,
        deleteCompany,
        convertToClient
    };
};
