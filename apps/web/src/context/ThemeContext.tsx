'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextProps {
    theme: Theme;
    toggleTheme: () => void;
    setPrimaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const setPrimaryColor = (color: string) => {
        document.documentElement.style.setProperty('--primary', color);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setPrimaryColor }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
