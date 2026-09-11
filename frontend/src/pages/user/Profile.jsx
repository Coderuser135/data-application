import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { userService } from '@/services/userService';

export default function UserProfile() {
  const [form, setForm] = useState({ full_name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    userService.getProfile().then((data) => {
      if (data) setForm({ full_name: data.full_name || '', phone: data.phone || '', address: data.address || '' });
    }).finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await userService.updateProfile(form);
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">My Profile</h1>
      <Card>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          {message && <p className={`text-sm ${message.includes('success') ? 'text-brand-600' : 'text-red-500'}`}>{message}</p>}
          <Button type="submit" loading={saving}><Save size={16} /> Save changes</Button>
        </form>
      </Card>
    </div>
  );
}
