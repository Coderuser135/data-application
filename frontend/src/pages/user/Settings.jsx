import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Moon, Sun, Bell, Shield, Save } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { toggleTheme } from '@/redux/slices/themeSlice';
import { settingsService } from '@/services/settingsService';

export default function Settings() {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.user?.id);
  const themeMode = useSelector((state) => state.theme.mode);
  const [prefs, setPrefs] = useState({ notify_membership: true, notify_orders: true, notify_payments: true, language: 'en', font_size: 'medium' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!userId) return;
    settingsService.get().then((data) => {
      if (data) setPrefs(data);
    });
  }, [userId]);

  async function handleSave() {
    setSaving(true);
    try {
      await settingsService.update(prefs);
      setMessage('Settings saved');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function toggle(key) { setPrefs((p) => ({ ...p, [key]: !p[key] })); }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Settings</h1>

      <Card>
        <div className="mb-4 flex items-center gap-2"><Moon size={20} className="text-brand-600" /><h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Appearance</h3></div>
        <div className="flex items-center justify-between">
          <div><p className="text-sm font-medium text-ink-900 dark:text-white">Theme</p><p className="text-xs text-surface-500">Switch between light and dark mode</p></div>
          <button onClick={() => dispatch(toggleTheme())} className="flex items-center gap-2 rounded-xl bg-surface-100 px-4 py-2.5 text-sm font-medium dark:bg-surface-800">
            {themeMode === 'light' ? <><Sun size={16} /> Light</> : <><Moon size={16} /> Dark</>}
          </button>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2"><Bell size={20} className="text-brand-600" /><h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Notifications</h3></div>
        <div className="space-y-4">
          {[['notify_membership', 'Membership updates', 'Get notified about membership status changes'], ['notify_orders', 'Order updates', 'Get notified about your supplement orders'], ['notify_payments', 'Payment updates', 'Get notified about payment transactions']].map(([key, title, desc]) => (
            <div key={key} className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-ink-900 dark:text-white">{title}</p><p className="text-xs text-surface-500">{desc}</p></div>
              <button onClick={() => toggle(key)} className={`relative h-6 w-11 rounded-full transition ${prefs[key] ? 'bg-brand-500' : 'bg-surface-300 dark:bg-surface-700'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${prefs[key] ? 'left-[22px]' : 'left-0.5'}`} /></button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2"><Shield size={20} className="text-brand-600" /><h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Preferences</h3></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2"><span className="text-sm font-medium text-ink-700 dark:text-surface-200">Language</span><select value={prefs.language} onChange={(e) => setPrefs({ ...prefs, language: e.target.value })} className="w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white"><option value="en">English</option><option value="hi">Hindi</option></select></label>
          <label className="block space-y-2"><span className="text-sm font-medium text-ink-700 dark:text-surface-200">Font size</span><select value={prefs.font_size} onChange={(e) => setPrefs({ ...prefs, font_size: e.target.value })} className="w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm dark:border-surface-700 dark:bg-surface-950 dark:text-white"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label>
        </div>
      </Card>

      {message && <p className={`text-sm ${message.includes('saved') ? 'text-brand-600' : 'text-red-500'}`}>{message}</p>}
      <Button onClick={handleSave} loading={saving}><Save size={16} /> Save settings</Button>
    </div>
  );
}
