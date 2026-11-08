import { createSlice } from '@reduxjs/toolkit';

const THEME_STORAGE_KEY = 'heaven_gym_theme';
const LEGACY_THEME_STORAGE_KEY = ['iron', 'forge', '_theme'].join('');
const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) ?? localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
const savedTheme = storedTheme || 'light';

if (storedTheme && !localStorage.getItem(THEME_STORAGE_KEY)) {
  localStorage.setItem(THEME_STORAGE_KEY, storedTheme);
  localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
}

document.documentElement.classList.toggle('dark', savedTheme === 'dark');

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: savedTheme },
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', state.mode === 'dark');
      localStorage.setItem(THEME_STORAGE_KEY, state.mode);
    },
  },
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
