import { createSlice } from '@reduxjs/toolkit';

const savedTheme = localStorage.getItem('ironforge_theme') || 'light';

document.documentElement.classList.toggle('dark', savedTheme === 'dark');

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: savedTheme },
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', state.mode === 'dark');
      localStorage.setItem('ironforge_theme', state.mode);
    },
  },
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
