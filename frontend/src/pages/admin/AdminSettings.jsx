import { useEffect, useState } from 'react';
import { Save, Building, Phone, Mail } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { gymSettingsService } from '@/services/settingsService';

export default function AdminSettings() {
  const [settings, setSettings] = useState({ gym_name: '', contact_phone: '', contact_email: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    gymSettingsService.get().then((data) => { setSettings(data || {}); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  function update(key, value) { setSettings((prev) => ({ ...prev, [key]: value })); }

  async function handleSave() {
    setSaving(true);
    try {
      await gymSettingsService.update(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { alert('Failed to save settings'); }
    setSaving(false);
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-surface-500">Manage gym and business configuration</p>
      </div>

      <Card>
        <div className="mb-5 flex items-center gap-2">
          <Building size={20} className="text-brand-600" />
          <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Gym Information</h3>
        </div>
        <div className="space-y-4">
          <Input label="Gym Name" value={settings.gym_name || ''} onChange={(e) => update('gym_name', e.target.value)} placeholder="IronForge Gym" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Contact Phone" value={settings.contact_phone || ''} onChange={(e) => update('contact_phone', e.target.value)} placeholder="Phone number" />
            <Input label="Contact Email" value={settings.contact_email || ''} onChange={(e) => update('contact_email', e.target.value)} placeholder="email@gym.com" />
          </div>
          <Input label="Address" value={settings.address || ''} onChange={(e) => update('address', e.target.value)} placeholder="Gym address" />
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} loading={saving}><Save size={16} /> Save Settings</Button>
        {saved && <span className="text-sm font-medium text-emerald-500">Settings saved successfully</span>}
      </div>
    </div>
  );
}
