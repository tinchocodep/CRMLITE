/**
 * SuperAdminBanner — Sticky banner shown when super_admin is viewing a tenant.
 *
 * Renders at the very top of the page with the tenant name and an "Exit" button
 * that returns to /admin/tenants.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';
import { useSuperAdmin } from '../../contexts/SuperAdminContext';
import { useAuth } from '../../contexts/AuthContext';

const SuperAdminBanner = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { viewingTenant, exitTenant } = useSuperAdmin();

    // Only show for super_admin when impersonating a tenant
    if (user?.role !== 'super_admin' || !viewingTenant) return null;

    const handleExit = () => {
        exitTenant();
        navigate('/admin/tenants');
    };

    return (
        <div className="sticky top-0 z-[999] flex items-center justify-between px-4 py-2 bg-blue-600 text-white text-sm font-medium shadow-md">
            <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="flex-shrink-0" />
                <span>
                    Viendo como <strong className="font-bold">{viewingTenant.name}</strong>
                    {' '}— Modo Super Admin
                </span>
            </div>
            <button
                onClick={handleExit}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-xs font-semibold"
            >
                <X size={14} />
                Salir de empresa
            </button>
        </div>
    );
};

export default SuperAdminBanner;
