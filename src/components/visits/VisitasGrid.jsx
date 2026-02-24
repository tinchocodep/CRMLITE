import React from 'react';
import VisitCard from './VisitCard';

/**
 * VisitasGrid — Renders the responsive card grid for the Visitas module.
 * Receives pre-filtered visits and territory helpers from the parent page.
 * Single responsibility: layout only. No data fetching here.
 */
const VisitasGrid = ({ visits, getEstablishmentForCompany, getLotsForEstablishment, onComplete, onDelete }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visits.map(visit => {
                const establishment = getEstablishmentForCompany(visit.company_id);
                const lots = establishment
                    ? getLotsForEstablishment(establishment.id)
                    : [];

                return (
                    <VisitCard
                        key={visit.id}
                        visit={visit}
                        establishment={establishment}
                        lots={lots}
                        onComplete={onComplete}
                        onDelete={onDelete}
                    />
                );
            })}
        </div>
    );
};

export default VisitasGrid;
