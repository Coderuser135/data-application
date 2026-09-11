import { useState } from 'react';
import { Bell, Send, Users } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api from '@/services/apiClient';

export default function AdminNotifications() {
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState({ title: '', message: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  async function sendBroadcast() {
    if (!broadcastMsg.title.trim() || !broadcastMsg.message.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await api.post('/notifications/broadcast', broadcastMsg);
      setResult({ success: true, sent: res.data.sent });
      setBroadcastMsg({ title: '', message: '' });
      setShowBroadcast(false);
    } catch {
      setResult({ success: false });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Notifications</h1>
          <p className="mt-1 text-sm text-surface-500">Send broadcast notifications to all users</p>
        </div>
        <Button onClick={() => setShowBroadcast(!showBroadcast)}><Send size={16} /> Broadcast</Button>
      </div>

      {result && (
        <div className={`rounded-xl px-4 py-3 text-sm ${result.success ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
          {result.success ? `Broadcast sent to ${result.sent} users.` : 'Failed to send broadcast. Please try again.'}
        </div>
      )}

      {showBroadcast && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Users size={20} className="text-brand-600" />
            <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Broadcast Notification</h3>
          </div>
          <div className="space-y-4">
            <Input label="Title" value={broadcastMsg.title} onChange={(e) => setBroadcastMsg({ ...broadcastMsg, title: e.target.value })} placeholder="Notification title" />
            <Input label="Message" value={broadcastMsg.message} onChange={(e) => setBroadcastMsg({ ...broadcastMsg, message: e.target.value })} placeholder="Notification message" />
            <p className="text-xs text-surface-500">This will send a notification to all registered users.</p>
            <div className="flex gap-2">
              <Button onClick={sendBroadcast} loading={sending}>Send to All Users</Button>
              <Button variant="ghost" onClick={() => setShowBroadcast(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center gap-3 py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Bell size={24} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Notification Management</h3>
            <p className="text-sm text-surface-500">Use the broadcast feature above to send announcements. Individual notifications are automatically created by the system for membership expiry, payments, and orders.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
