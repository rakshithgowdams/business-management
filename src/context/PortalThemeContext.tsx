import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface PortalThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const PortalThemeContext = createContext<PortalThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  isDark: true,
});

export function PortalThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('portal_theme') as Theme) || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    localStorage.setItem('portal_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <PortalThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </PortalThemeContext.Provider>
  );
}

export function usePortalTheme() {
  return useContext(PortalThemeContext);
}
