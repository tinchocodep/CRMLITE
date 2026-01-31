import React from 'react';

const ModulePlaceholder = ({ title }) => {
    return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <h1 className="text-3xl font-bold text-slate-200 tracking-tight mb-2">{title}</h1>
            <p className="text-sm">Module implementation pending</p>
        </div>
    );
};

export default ModulePlaceholder;
