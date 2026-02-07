import React from 'react';
import { Sun, Moon, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
    const { themeMode, setThemeMode } = useTheme();

    const modes = [
        { value: 'light', icon: Sun, label: 'Claro' },
        { value: 'dark', icon: Moon, label: 'Oscuro' },
        { value: 'auto', icon: Clock, label: 'Auto' },
    ];

    return (
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
            {modes.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    onClick={() => setThemeMode(value)}
                    className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                        ${themeMode === value
                            ? 'bg-white dark:bg-slate-700 text-advanta-green shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }
                    `}
                    title={label}
                >
                    <Icon size={14} />
                    <span className="hidden sm:inline">{label}</span>
                </button>
            ))}
        </div>
    );
};

export default ThemeToggle;
