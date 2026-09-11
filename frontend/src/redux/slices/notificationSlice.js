import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { notificationService } from '@/services/notificationService';

const errorMessage = (error, fallback) => error.response?.data?.error || fallback;

export const fetchNotifications = createAsyncThunk('notifications/fetchNotifications', async (_, { rejectWithValue }) => {
  try { return await notificationService.getMine(); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to fetch notifications')); }
});

export const fetchUnreadCount = createAsyncThunk('notifications/fetchUnreadCount', async (_, { rejectWithValue }) => {
  try { return await notificationService.getUnreadCount(); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to fetch unread count')); }
});

export const markNotificationRead = createAsyncThunk('notifications/markRead', async (id, { rejectWithValue }) => {
  try { return await notificationService.markRead(id); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to mark notification')); }
});

export const markAllNotificationsRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try { return await notificationService.markAllRead(); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to mark all notifications')); }
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchNotifications.fulfilled, (state, action) => { state.items = action.payload; state.loading = false; })
      .addCase(fetchNotifications.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => { state.unreadCount = action.payload.count; })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const idx = state.items.findIndex((n) => n.id === action.payload.id);
        if (idx !== -1) state.items[idx].is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => { n.is_read = true; });
        state.unreadCount = 0;
      });
  },
});

export default notificationSlice.reducer;
