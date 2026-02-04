import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for managing file uploads to Supabase Storage
 * Handles upload, progress tracking, and error management
 */
export const useFileUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    /**
     * Upload a file to Supabase Storage
     * @param {File} file - The file to upload
     * @param {Object} options - Upload options
     * @param {string} options.bucket - Storage bucket name
     * @param {string} options.path - File path in bucket
     * @param {Function} options.onProgress - Progress callback
     * @returns {Promise<{data, error}>}
     */
    const uploadFile = async (file, { bucket = 'legajo-documents', path, onProgress }) => {
        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            // Validate file
            if (!file) {
                throw new Error('No file provided');
            }

            // Validate file size (5MB max)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                throw new Error('File size exceeds 5MB limit');
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed');
            }

            // Upload to Storage
            const { data, error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            setProgress(100);
            setUploading(false);

            return { data, error: null };
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message);
            setUploading(false);
            return { data: null, error: err };
        }
    };

    /**
     * Get a signed URL for secure access to a private file
     * @param {string} bucket - Storage bucket name
     * @param {string} path - File path in bucket
     * @param {number} expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
     * @returns {Object} { data: { signedUrl }, error }
     */
    const getSignedUrl = async (bucket, path, expiresIn = 3600) => {
        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .createSignedUrl(path, expiresIn);

            if (error) throw error;

            return { data, error: null };
        } catch (err) {
            console.error('Error getting signed URL:', err);
            return { data: null, error: err };
        }
    };

    /**
     * Get public URL for a file
     * @param {string} bucket - Storage bucket name
     * @param {string} path - File path in bucket
     * @returns {string} Public URL
     */
    const getPublicUrl = (bucket, path) => {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return data.publicUrl;
    };

    /**
     * Delete a file from Storage
     * @param {string} bucket - Storage bucket name
     * @param {string} path - File path in bucket
     * @returns {Promise<{data, error}>}
     */
    const deleteFile = async (bucket, path) => {
        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .remove([path]);

            if (error) throw error;
            return { data, error: null };
        } catch (err) {
            console.error('Delete error:', err);
            return { data: null, error: err };
        }
    };

    return {
        uploadFile,
        getSignedUrl,
        getPublicUrl,
        deleteFile,
        uploading,
        progress,
        error
    };
};
