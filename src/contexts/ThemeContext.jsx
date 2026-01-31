import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    // Theme mode: 'light', 'dark', 'auto'
    const [themeMode, setThemeMode] = useState(() => {
        const saved = localStorage.getItem('theme-mode');
        return saved || 'light'; // Default to light mode
    });

    // Current active theme: 'light' or 'dark'
    const [theme, setTheme] = useState('light');

    // Auto mode: determine theme based on time
    const getAutoTheme = () => {
        const hour = new Date().getHours();
        // Dark mode from 20:00 (8 PM) to 06:00 (6 AM)
        return (hour >= 20 || hour < 6) ? 'dark' : 'light';
    };

    // Update theme when mode changes or time changes (for auto mode)
    useEffect(() => {
        const updateTheme = () => {
            let newTheme;

            if (themeMode === 'auto') {
                newTheme = getAutoTheme();
            } else {
                newTheme = themeMode;
            }

            setTheme(newTheme);

            // Apply theme to document
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        updateTheme();

        // If auto mode, check every minute for time changes
        let interval;
        if (themeMode === 'auto') {
            interval = setInterval(updateTheme, 60000); // Check every minute
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [themeMode]);

    // Save theme mode to localStorage
    useEffect(() => {
        localStorage.setItem('theme-mode', themeMode);
    }, [themeMode]);

    const value = {
        theme,
        themeMode,
        setThemeMode,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
