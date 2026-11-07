import { useEffect, useRef, useState } from 'react';
import { Camera, Mail, Save, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import UserLoadingSkeleton from '@/components/ui/UserLoadingSkeleton';
import { userService } from '@/services/userService';
import { setProfile } from '@/redux/slices/authSlice';

export default function ProfileEditor({ title = 'My Profile', subtitle = 'Manage your personal information and profile photo.' }) {
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.auth.profile);
  const fileRef = useRef(null);
  const [form, setForm] = useState({ full_name: '', phone: '', address: '' });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    userService.getProfile()
      .then((data) => {
        if (!active || !data) return;
        setForm({ full_name: data.full_name || '', phone: data.phone || '', address: data.address || '' });
        setAvatarUrl(data.avatar_url || '');
        dispatch(setProfile(data));
      })
      .catch(() => { if (active) setError('Profile could not be loaded. Please refresh and try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [dispatch]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG or WEBP image.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile photo must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }
    setError('');
    setMessage('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function removeSelectedImage() {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = new FormData();
      payload.append('full_name', form.full_name);
      payload.append('phone', form.phone);
      payload.append('address', form.address);
      if (selectedFile) payload.append('avatar', selectedFile);
      const updated = await userService.updateProfile(payload);
      dispatch(setProfile(updated));
      setAvatarUrl(updated.avatar_url || '');
      setSelectedFile(null);
      setPreviewUrl('');
      if (fileRef.current) fileRef.current.value = '';
      setMessage('Your profile has been updated successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'We could not update your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <UserLoadingSkeleton variant="profile" />;

  const image = previewUrl || avatarUrl;
  const initials = (form.full_name || profile?.email || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">{title}</h1>
        <p className="mt-1 text-sm text-surface-500">{subtitle}</p>
      </div>

      <Card>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-surface-50 p-6 dark:bg-surface-800/50 sm:flex-row">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-brand-100 text-3xl font-bold text-brand-700 shadow-md dark:border-surface-700 dark:bg-brand-500/20 dark:text-brand-300">
                {image ? <img src={image} alt="Profile" className="h-full w-full object-cover" /> : initials}
              </div>
              <button type="button" onClick={() => fileRef.current?.click()} aria-label="Choose profile photo" className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:bg-brand-700"><Camera size={17} /></button>
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="font-semibold text-ink-900 dark:text-white">Profile photo</h2>
              <p className="mt-1 text-sm text-surface-500">JPG, PNG or WEBP. Maximum file size: 5 MB.</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Camera size={15} /> {avatarUrl || selectedFile ? 'Change photo' : 'Upload photo'}</Button>
                {selectedFile && <Button type="button" variant="ghost" size="sm" onClick={removeSelectedImage}><X size={15} /> Undo selection</Button>}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Full name" value={form.full_name} onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
          </div>
          <Input label="Address" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
          <div className="flex items-start gap-3 rounded-xl bg-surface-50 p-4 dark:bg-surface-800/50">
            <Mail size={17} className="mt-0.5 shrink-0 text-surface-500" />
            <div className="min-w-0"><p className="text-xs font-medium text-surface-500">Email address</p><p className="break-all text-sm font-semibold text-ink-900 dark:text-white">{profile?.email || '—'}</p><p className="mt-1 text-xs text-surface-500">Email address cannot be changed here.</p></div>
          </div>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</p>}
          {message && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">{message}</p>}
          <div className="flex justify-end"><Button type="submit" loading={saving}><Save size={16} /> Save profile</Button></div>
        </form>
      </Card>
    </div>
  );
}
