import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/supabase';

/**
 * Hook for managing legajo documents (file attachments)
 * Handles CRUD operations for company document records
 */
export const useLegajoDocuments = (companyId) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch documents for a company
    const fetchDocuments = async () => {
        if (!companyId) {
            setDocuments([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('file_attachments')
                .select('*')
                .eq('entity_type', 'company')
                .eq('entity_id', companyId)
                .eq('status', 'active')
                .in('document_type', [
                    'dni_front', 'dni_back', 'selfie',
                    'cbu_proof', 'iibb_exemption', 'f1276'
                ])
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setDocuments(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching documents:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Create a new document record
    const createDocument = async (documentData) => {
        try {
            const user = await getCurrentUser();

            // Get tenant_id from users table
            const { data: userData } = await supabase
                .from('users')
                .select('tenant_id')
                .eq('id', user.id)
                .single();

            // Generate the public Storage URL (bucket is now public)
            const publicUrl = `https://lifeqgwsyopvaevywtsf.supabase.co/storage/v1/object/public/legajo-documents/${documentData.storage_path}`;

            const { data, error: insertError } = await supabase
                .from('file_attachments')
                .insert({
                    entity_type: 'company',
                    entity_id: companyId,
                    document_type: documentData.document_type,
                    file_name: documentData.file_name,
                    file_size: documentData.file_size,
                    file_type: documentData.file_type,
                    storage_path: documentData.storage_path,
                    public_url: publicUrl,
                    uploaded_by: user.id,
                    tenant_id: userData.tenant_id,
                    status: 'active',
                    expiry_date: documentData.expiry_date || null
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Refresh documents list
            await fetchDocuments();

            return { data, error: null };
        } catch (err) {
            console.error('Error creating document:', err);
            return { data: null, error: err };
        }
    };



    // Mark a document as replaced (when uploading a new version)
    const replaceDocument = async (documentType) => {
        try {
            const { error: updateError } = await supabase
                .from('file_attachments')
                .update({ status: 'replaced', updated_at: new Date().toISOString() })
                .eq('entity_type', 'company')
                .eq('entity_id', companyId)
                .eq('document_type', documentType)
                .eq('status', 'active');

            if (updateError) throw updateError;

            return { error: null };
        } catch (err) {
            console.error('Error replacing document:', err);
            return { error: err };
        }
    };

    // Delete a document (soft delete)
    const deleteDocument = async (documentId) => {
        try {
            const { error: deleteError } = await supabase
                .from('file_attachments')
                .update({ status: 'deleted', updated_at: new Date().toISOString() })
                .eq('id', documentId);

            if (deleteError) throw deleteError;

            // Refresh documents list
            await fetchDocuments();

            return { error: null };
        } catch (err) {
            console.error('Error deleting document:', err);
            return { error: err };
        }
    };

    // Get document by type
    const getDocumentByType = (documentType) => {
        return documents.find(doc => doc.document_type === documentType);
    };

    // Calculate legajo completion percentage
    const getCompletionStats = () => {
        const requiredDocs = ['dni_front', 'dni_back', 'selfie', 'cbu_proof', 'f1276'];
        const uploadedRequired = requiredDocs.filter(type =>
            documents.some(doc => doc.document_type === type)
        ).length;

        const totalDocs = documents.length;
        const percentage = (uploadedRequired / requiredDocs.length) * 100;

        return {
            uploaded: uploadedRequired,
            total: requiredDocs.length,
            percentage: Math.round(percentage),
            allDocuments: totalDocs,
            isComplete: uploadedRequired === requiredDocs.length
        };
    };

    // Auto-fetch on mount and when companyId changes
    useEffect(() => {
        fetchDocuments();
    }, [companyId]);

    return {
        documents,
        loading,
        error,
        createDocument,
        replaceDocument,
        deleteDocument,
        getDocumentByType,
        getCompletionStats,
        refetch: fetchDocuments
    };
};
