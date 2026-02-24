import React, { useRef, useEffect, useState, useMemo, useCallback, memo } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { calculateAreaInHectares } from '../../utils/geoUtils';
import AddressSearch from './AddressSearch';
import DrawingControls from './DrawingControls';
import DrawingInstructions from './DrawingInstructions';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Crop type colors
const CROP_COLORS = {
    soy: '#22c55e',
    corn: '#eab308',
    wheat: '#f97316',
    sunflower: '#fbbf24',
    other: '#6b7280'
};

// ─── MapReadyHandler ─────────────────────────────────────────────────────────
// Fires map.invalidateSize() once the container has its real pixel dimensions.
// This is the fix for fragmented/missing tiles on first render.
const MapReadyHandler = ({ onReady }) => {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        // Small defer so the CSS has been applied before we measure
        const timer = setTimeout(() => {
            map.invalidateSize();
            onReady?.(map);
        }, 100);
        return () => clearTimeout(timer);
    }, [map, onReady]);
    return null;
};

// ─── GeomanControls ───────────────────────────────────────────────────────────
// Memoized to avoid re-registering event listeners on every parent render
const GeomanControls = memo(({ onDrawComplete, showDrawingControls }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !map.pm) return;

        if (showDrawingControls) {
            map.pm.addControls({
                position: 'topright',
                drawCircle: true,
                drawMarker: false,
                drawCircleMarker: false,
                drawPolyline: false,
                drawRectangle: true,
                drawPolygon: true,
                drawText: false,
                editMode: false,
                dragMode: false,
                cutPolygon: false,
                removalMode: false,
            });

            map.pm.setGlobalOptions({
                finishOn: 'dblclick',
                allowSelfIntersection: false,
            });

            // Position controls below the search bar
            const style = document.createElement('style');
            style.id = 'geoman-custom-position';
            style.textContent = `
                .leaflet-pm-toolbar.leaflet-pm-topleft,
                .leaflet-pm-toolbar.leaflet-pm-topright {
                    margin-top: 80px !important;
                }
            `;
            document.head.appendChild(style);

            const handleCreate = (e) => {
                const layer = e.layer;
                let geoJSON = layer.toGeoJSON();

                // Convert circles to polygon approximation for area calculation
                if (e.shape === 'Circle' && layer.getLatLng && layer.getRadius) {
                    const center = layer.getLatLng();
                    const radius = layer.getRadius();
                    const points = 64;
                    const coordinates = [];

                    for (let i = 0; i <= points; i++) {
                        const angle = (i * 360) / points;
                        const rad = (angle * Math.PI) / 180;
                        const lat = center.lat + (radius / 111320) * Math.cos(rad);
                        const lng = center.lng + (radius / (111320 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(rad);
                        coordinates.push([lng, lat]);
                    }

                    geoJSON = {
                        type: 'Feature',
                        properties: {},
                        geometry: { type: 'Polygon', coordinates: [coordinates] }
                    };
                }

                const hectares = calculateAreaInHectares(geoJSON);
                if (onDrawComplete) {
                    onDrawComplete({ geometry: geoJSON, hectares });
                }
                map.removeLayer(layer);
            };

            map.on('pm:create', handleCreate);

            return () => {
                map.off('pm:create', handleCreate);
                if (map.pm) map.pm.removeControls();
                const customStyle = document.getElementById('geoman-custom-position');
                if (customStyle) customStyle.remove();
            };
        } else {
            if (map.pm) map.pm.removeControls();
        }
    }, [map, onDrawComplete, showDrawingControls]);

    return null;
});
GeomanControls.displayName = 'GeomanControls';

// ─── FlyToLocation ────────────────────────────────────────────────────────────
// Supports two modes:
//   1. bounds → fitBounds with padding (used when focusing a client's lots)
//   2. center + zoom → flyTo a specific coordinate (used when clicking a lot)
const FlyToLocation = memo(({ center, zoom, bounds }) => {
    const map = useMap();

    useEffect(() => {
        if (bounds) {
            // Leaflet L.latLngBounds([[minLat, minLng], [maxLat, maxLng]])
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true });
            return;
        }
        if (!center) return;
        const [lat, lng] = center;
        // Guard: skip if coordinates are not finite numbers
        if (!isFinite(lat) || !isFinite(lng)) return;
        map.flyTo([lat, lng], zoom || 15, { duration: 1.5 });
    }, [center, zoom, bounds, map]);

    return null;
});
FlyToLocation.displayName = 'FlyToLocation';

// ─── LotPolygons ─────────────────────────────────────────────────────────────
// Separated component so it can be memoized independently from the map shell
const LotPolygons = memo(({ lots, selectedLotId, hoveredLotId, onLotEdit }) => {
    return lots.map((lot) => {
        if (!lot.geometry?.geometry) return null;

        const coordinates = lot.geometry.geometry.coordinates[0];
        const positions = coordinates.map(coord => [coord[1], coord[0]]);

        const isSelected = lot.id === selectedLotId;
        const isHovered = lot.id === hoveredLotId;
        const color = lot.color || CROP_COLORS[lot.crop_type] || CROP_COLORS.other;

        return (
            <Polygon
                key={lot.id}
                positions={positions}
                pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.6 : isHovered ? 0.5 : 0.3,
                    weight: isSelected ? 3 : isHovered ? 2 : 1
                }}
                eventHandlers={{
                    click: () => onLotEdit?.(lot)
                }}
            >
                <Tooltip permanent={isSelected || isHovered} direction="center">
                    <div className="text-xs font-medium">
                        <div>{lot.name}</div>
                        <div className="text-gray-600">{lot.hectares} ha</div>
                    </div>
                </Tooltip>
            </Polygon>
        );
    });
});
LotPolygons.displayName = 'LotPolygons';

// ─── MapComponent ─────────────────────────────────────────────────────────────
/**
 * Wrapped with React.memo so it only re-renders when its own props change.
 * This prevents the map from re-rendering when TerritoryPage state changes
 * that don't affect the map (e.g. opening the EstablishmentModal).
 */
const MapComponent = memo(({
    lots = [],
    onDrawComplete,
    onConfirm,
    onCancel,
    onLotEdit,
    selectedLotId,
    hoveredLotId,
    flyToLocation,
    showDrawingControls = false,
    drawnHectares = null,
    drawnGeometry = null
}) => {
    const mapRef = useRef(null);
    const [mapReady, setMapReady] = useState(false);
    const [searchLocation, setSearchLocation] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const handleMapReady = useCallback((mapInstance) => {
        mapRef.current = mapInstance;
        setMapReady(true);
    }, []);

    useEffect(() => {
        const mapInstance = mapRef.current;
        if (!mapInstance || !mapReady) return;

        const handleDrawStart = () => setIsDrawing(true);
        const handleDrawStop = () => setIsDrawing(false);

        mapInstance.on('pm:drawstart', handleDrawStart);
        mapInstance.on('pm:drawend', handleDrawStop);
        mapInstance.on('pm:create', handleDrawStop);

        return () => {
            mapInstance.off('pm:drawstart', handleDrawStart);
            mapInstance.off('pm:drawend', handleDrawStop);
            mapInstance.off('pm:create', handleDrawStop);
        };
    }, [mapReady]);

    const handleLocationSelect = useCallback((location) => {
        setSearchLocation({
            center: [location.lat, location.lon],
            zoom: 16
        });
    }, []);

    const activeLocation = searchLocation || flyToLocation;

    return (
        <div className="h-full w-full relative">
            {/* Address Search */}
            <div className="absolute top-4 right-4 z-[1000] w-96">
                <AddressSearch onLocationSelect={handleLocationSelect} />
            </div>

            {/* Drawing Instructions */}
            {isDrawing && <DrawingInstructions />}

            {/* Drawing Controls */}
            {showDrawingControls && (
                <DrawingControls
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                    hectares={drawnHectares}
                    hasGeometry={!!drawnGeometry}
                />
            )}

            <MapContainer
                center={[-34.6037, -58.3816]}
                zoom={13}
                className="h-full w-full"
                style={{ height: '100%', width: '100%' }}
            >
                {/* Map ready handler: calls invalidateSize() after mount */}
                <MapReadyHandler onReady={handleMapReady} />
                {/* Satellite Base Layer */}
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                    maxZoom={19}
                />

                {/* Geoman Drawing Controls */}
                <GeomanControls
                    onDrawComplete={onDrawComplete}
                    showDrawingControls={showDrawingControls}
                />

                {/* Lot Polygons — memoized separately */}
                <LotPolygons
                    lots={lots}
                    selectedLotId={selectedLotId}
                    hoveredLotId={hoveredLotId}
                    onLotEdit={onLotEdit}
                />

                {/* Temporary drawn polygon preview */}
                {showDrawingControls && drawnGeometry?.geometry && (
                    <Polygon
                        positions={drawnGeometry.geometry.coordinates[0].map(coord => [coord[1], coord[0]])}
                        pathOptions={{
                            color: '#22c55e',
                            fillColor: '#22c55e',
                            fillOpacity: 0.3,
                            weight: 2,
                            dashArray: '5, 5'
                        }}
                    >
                        <Tooltip permanent direction="center">
                            <div className="text-xs font-medium">
                                <div>Nuevo Lote</div>
                                <div className="text-gray-600">{drawnHectares?.toFixed(2)} ha</div>
                            </div>
                        </Tooltip>
                    </Polygon>
                )}

                {/* Fly to location */}
                {activeLocation && (
                    <FlyToLocation
                        center={activeLocation.center}
                        zoom={activeLocation.zoom}
                        bounds={activeLocation.bounds}
                    />
                )}
            </MapContainer>
        </div>
    );
});
MapComponent.displayName = 'MapComponent';

export default MapComponent;
