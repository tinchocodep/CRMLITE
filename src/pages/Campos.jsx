import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import MapComponent from '../components/territory/MapComponent';
import Sidebar from '../components/territory/Sidebar';
import LotForm from '../components/territory/LotForm';
import EstablishmentModal from '../components/territory/EstablishmentModal';
import { useEstablishments } from '../hooks/useEstablishments';
import { useLots } from '../hooks/useLots';
import { useSystemToast } from '../hooks/useSystemToast';
import { useConfirm } from '../contexts/ConfirmContext';

// ─── Loading overlay (non-destructive — map stays mounted) ───────────────────
const LoadingOverlay = () => (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/10 backdrop-blur-[1px] pointer-events-none">
        <div className="bg-white/90 rounded-2xl px-5 py-3 shadow-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600" />
            <span className="text-sm text-gray-600 font-medium">Actualizando...</span>
        </div>
    </div>
);

// ─── Initial loading screen (only shown on first mount) ───────────────────────
const InitialLoadingScreen = () => (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando campos...</p>
        </div>
    </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
/**
 * Campos — ex-TerritoryPage. Manages establishments (campos/estancias) and
 * their lots (lotes) on an interactive Leaflet map.
 *
 * Renaming note: "territory" stays in component filenames for now; the public
 * URL is /campos and the page title shows "Campos".
 */
const Campos = () => {
    const {
        establishments,
        createEstablishment,
        updateEstablishment,
        deleteEstablishment,
        loading: loadingEstablishments,
        refreshing: refreshingEstablishments,
    } = useEstablishments();

    const {
        lots,
        createLot,
        updateLot,
        deleteLot,
        loading: loadingLots,
        refreshing: refreshingLots,
    } = useLots();

    const { showSuccess, showError } = useSystemToast();
    const { confirm } = useConfirm();

    const [selectedLot, setSelectedLot] = useState(null);
    const [hoveredLotId, setHoveredLotId] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEstablishmentModalOpen, setIsEstablishmentModalOpen] = useState(false);
    const [editingEstablishment, setEditingEstablishment] = useState(null);
    // ID del último establecimiento creado: se pasa a LotForm para pre-seleccionarlo
    const [lastCreatedEstablishmentId, setLastCreatedEstablishmentId] = useState(null);
    const [drawnGeometry, setDrawnGeometry] = useState(null);
    const [drawnHectares, setDrawnHectares] = useState(null);
    const [showDrawingControls, setShowDrawingControls] = useState(false);
    const [flyToLocation, setFlyToLocation] = useState(null);

    // Read ?client=ID query param to auto-expand a specific client in the sidebar
    const [searchParams] = useSearchParams();
    const highlightClientId = searchParams.get('client');

    // ── Derived state ──────────────────────────────────────────────────────────
    // Show the full-screen spinner only on the very first load
    const isInitialLoading = loadingEstablishments || loadingLots;
    // Show the non-destructive overlay on subsequent refreshes
    const isRefreshing = refreshingEstablishments || refreshingLots;

    // ── Scroll lock: prevent page scroll from interfering with the map ─────────
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.removeProperty('overflow'); };
    }, []);

    // ── Auto-fly to client lots when arriving from the Clients page ────────────
    // Waits for lots to finish loading, then fitBounds to all lots of the client.
    useEffect(() => {
        if (!highlightClientId || loadingLots || lots.length === 0) return;

        const clientLots = lots.filter(
            (l) => String(l.establishment?.company?.id) === String(highlightClientId) && l.geometry?.geometry
        );
        if (clientLots.length === 0) return;

        // Collect every [lat, lng] from every polygon of this client
        const allCoords = clientLots.flatMap((l) =>
            l.geometry.geometry.coordinates[0].map((c) => [c[1], c[0]])
        );

        const lats = allCoords.map(([lat]) => lat);
        const lngs = allCoords.map(([, lng]) => lng);

        const bounds = [
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)],
        ];

        setFlyToLocation({ bounds });
    }, [highlightClientId, lots, loadingLots]);

    // ── Handlers (all memoized with useCallback to prevent child re-renders) ──

    const handleDrawComplete = useCallback((data) => {
        setDrawnGeometry(data.geometry);
        setDrawnHectares(data.hectares);
        setShowDrawingControls(true);
    }, []);

    const handleConfirmDrawing = useCallback(() => {
        setShowDrawingControls(false);
        setIsFormOpen(true);
    }, []);

    const handleCancelDrawing = useCallback(() => {
        setDrawnGeometry(null);
        setDrawnHectares(null);
        setShowDrawingControls(false);
    }, []);

    const handleSaveLot = useCallback(async (lotData) => {
        try {
            if (selectedLot) {
                const result = await updateLot(selectedLot.id, lotData);
                if (!result.success) throw new Error(result.error || 'Error desconocido');
                showSuccess('Lote actualizado correctamente');
            } else {
                const result = await createLot(lotData);
                if (!result.success) throw new Error(result.error || 'Error desconocido');
                showSuccess('Lote creado correctamente');
            }
            setIsFormOpen(false);
            setSelectedLot(null);
            setDrawnGeometry(null);
            setDrawnHectares(null);
        } catch (error) {
            console.error('❌ Error saving lot:', error);
            showError(`Error al guardar el lote: ${error.message}`);
        }
    }, [selectedLot, updateLot, createLot, showSuccess, showError]);

    const handleDeleteLot = useCallback(async (lotId) => {
        try {
            const result = await deleteLot(lotId);
            if (!result.success) throw new Error(result.error || 'Error desconocido');
            showSuccess('Lote eliminado correctamente');
            setIsFormOpen(prev => prev && selectedLot?.id === lotId ? false : prev);
            setSelectedLot(prev => prev?.id === lotId ? null : prev);
        } catch (error) {
            console.error('❌ Error deleting lot:', error);
            showError(`Error al eliminar el lote: ${error.message}`);
        }
    }, [deleteLot, selectedLot, showSuccess, showError]);

    // Click desde el sidebar: vuela al lote y lo selecciona (resalta en mapa).
    // NO abre el formulario — el usuario solo quiere navegar al lote.
    const handleLotClick = useCallback((lot) => {
        setSelectedLot(lot);
        if (lot.geometry?.geometry) {
            const coordinates = lot.geometry.geometry.coordinates[0];
            const center = coordinates.reduce(
                (acc, coord) => { acc[0] += coord[1]; acc[1] += coord[0]; return acc; },
                [0, 0]
            );
            center[0] /= coordinates.length;
            center[1] /= coordinates.length;
            setFlyToLocation({ center, zoom: 16 });
        }
    }, []);

    // Click desde el mapa (polígono): abre el formulario de edición.
    const handleLotEdit = useCallback((lot) => {
        setSelectedLot(lot);
        setIsFormOpen(true);
        if (lot.geometry?.geometry) {
            const coordinates = lot.geometry.geometry.coordinates[0];
            const center = coordinates.reduce(
                (acc, coord) => { acc[0] += coord[1]; acc[1] += coord[0]; return acc; },
                [0, 0]
            );
            center[0] /= coordinates.length;
            center[1] /= coordinates.length;
            setFlyToLocation({ center, zoom: 16 });
        }
    }, []);

    const handleCancelForm = useCallback(() => {
        setIsFormOpen(false);
        setSelectedLot(null);
        setDrawnGeometry(null);
        setDrawnHectares(null);
    }, []);

    const handleEditEstablishment = useCallback((establishment) => {
        setEditingEstablishment(establishment);
        setIsEstablishmentModalOpen(true);
    }, []);

    const handleDeleteEstablishment = useCallback(async (establishment) => {
        const confirmed = await confirm({
            title: 'Eliminar Campo',
            message: `¿Estás seguro de eliminar "${establishment.name}"?\n\nEsta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            variant: 'danger',
        });
        if (!confirmed) return;

        try {
            const result = await deleteEstablishment(establishment.id);
            if (!result.success) throw new Error(result.error || 'Error desconocido');
            showSuccess('Campo eliminado correctamente');
        } catch (error) {
            console.error('❌ Error deleting establishment:', error);
            showError(`Error al eliminar el campo: ${error.message}`);
        }
    }, [confirm, deleteEstablishment, showSuccess, showError]);

    const handleCloseEstablishmentModal = useCallback(() => {
        setIsEstablishmentModalOpen(false);
        setEditingEstablishment(null);
        // No limpiamos lastCreatedEstablishmentId aquí —
        // debe persistir hasta que el usuario abra/cierre el LotForm.
    }, []);

    const handleOpenCreateEstablishment = useCallback(() => {
        setEditingEstablishment(null);
        setIsEstablishmentModalOpen(true);
    }, []);

    // Centralized save handler — uses THIS component's hook instance so the
    // sidebar updates immediately without needing a page reload.
    const handleSaveEstablishment = useCallback(async (formData, establishment) => {
        try {
            if (establishment) {
                return await updateEstablishment(establishment.id, formData);
            }
            const result = await createEstablishment(formData);
            // Guardamos el ID del nuevo establecimiento para pre-seleccionarlo en LotForm
            if (result?.success && result?.data?.id) {
                setLastCreatedEstablishmentId(result.data.id);
            }
            return result;
        } catch (err) {
            console.error('Error saving establishment:', err);
            return { success: false, error: err.message };
        }
    }, [createEstablishment, updateEstablishment]);

    const handleSetHoveredLot = useCallback((id) => setHoveredLotId(id), []);
    const handleClearHoveredLot = useCallback(() => setHoveredLotId(null), []);

    // Stable map prop: only hides drawing controls when the lot form is open
    const mapShowDrawingControls = useMemo(
        () => !isFormOpen,
        [isFormOpen]
    );

    // ── Render ─────────────────────────────────────────────────────────────────
    if (isInitialLoading) {
        return <InitialLoadingScreen />;
    }

    return (
        <div className="relative h-full overflow-hidden">
            {/* Non-destructive refresh overlay — map stays mounted */}
            {isRefreshing && <LoadingOverlay />}

            {/* Map */}
            <MapComponent
                lots={lots}
                onDrawComplete={handleDrawComplete}
                onConfirm={handleConfirmDrawing}
                onCancel={handleCancelDrawing}
                onLotEdit={handleLotEdit}
                selectedLotId={selectedLot?.id}
                hoveredLotId={hoveredLotId}
                flyToLocation={flyToLocation}
                showDrawingControls={mapShowDrawingControls}
                drawnHectares={drawnHectares}
                drawnGeometry={drawnGeometry}
            />

            {/* Sidebar */}
            <Sidebar
                establishments={establishments}
                lots={lots}
                onLotClick={handleLotClick}
                onLotHover={handleSetHoveredLot}
                onLotHoverEnd={handleClearHoveredLot}
                onCreateEstablishment={handleOpenCreateEstablishment}
                onEditEstablishment={handleEditEstablishment}
                onDeleteEstablishment={handleDeleteEstablishment}
                onDeleteLot={handleDeleteLot}
                initialClientId={highlightClientId}
            />

            {/* Lot Form */}
            <LotForm
                lot={selectedLot}
                establishments={establishments}
                defaultEstablishmentId={lastCreatedEstablishmentId}
                geometry={drawnGeometry}
                hectares={drawnHectares}
                onSave={handleSaveLot}
                onDelete={handleDeleteLot}
                onCancel={handleCancelForm}
                isOpen={isFormOpen}
            />

            {/* Floating Action Button — only when no establishments exist */}
            {!isFormOpen && establishments.length === 0 && (
                <button
                    onClick={handleOpenCreateEstablishment}
                    className="absolute bottom-6 right-6 z-[1000] p-4 bg-green-600 text-white rounded-full shadow-2xl hover:bg-green-700 transition-all hover:scale-110 animate-pulse"
                    title="Crear Campo"
                >
                    <Building2 className="w-6 h-6" />
                </button>
            )}

            {/* Establishment Modal */}
            <EstablishmentModal
                isOpen={isEstablishmentModalOpen}
                onClose={handleCloseEstablishmentModal}
                establishment={editingEstablishment}
                onSave={handleSaveEstablishment}
            />
        </div>
    );
};

export default Campos;
