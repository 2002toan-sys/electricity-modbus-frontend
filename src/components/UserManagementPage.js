import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const EMPTY_USER = { username: '', full_name: '', role: 'user', password: '' };

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [form, setForm] = useState(EMPTY_USER);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getUsers();
      if (!Array.isArray(result)) throw new Error('Dữ liệu người dùng không hợp lệ');
      setUsers(result);
    } catch (loadError) {
      setError(loadError.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreateForm = () => {
    setEditingUserId(null);
    setForm({ ...EMPTY_USER });
    setFormOpen(true);
  };

  const openEditForm = (user) => {
    setEditingUserId(user.id);
    setForm({
      username: user.username,
      full_name: user.full_name || '',
      role: user.role,
      password: '',
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingUserId(null);
    setForm({ ...EMPTY_USER });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      username: form.username.trim(),
      full_name: form.full_name.trim(),
      role: form.role,
    };
    if (!editingUserId || form.password) payload.password = form.password;

    try {
      if (editingUserId) {
        await api.updateUser(editingUserId, payload);
        toast.success('Đã cập nhật người dùng');
      } else {
        await api.createUser(payload);
        toast.success('Đã tạo người dùng');
      }
      closeForm();
      await loadUsers();
    } catch (saveError) {
      toast.error(saveError.message || 'Không thể lưu người dùng');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Xóa người dùng "${user.username}"?`)) return;
    try {
      await api.deleteUser(user.id);
      toast.success(`Đã xóa người dùng ${user.username}`);
      await loadUsers();
    } catch (deleteError) {
      toast.error(deleteError.message || 'Không thể xóa người dùng');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800">Tài khoản người dùng</h3>
          <p className="mt-1 text-sm text-slate-500">Mật khẩu được mã hóa ở backend trước khi lưu.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={openCreateForm}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Thêm người dùng
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải danh sách người dùng...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tên đăng nhập</th>
                  <th className="px-4 py-3">Họ tên</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-800">{user.username}</td>
                    <td className="px-4 py-3 text-slate-600">{user.full_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Chỉnh sửa"
                          onClick={() => openEditForm(user)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Xóa người dùng"
                          onClick={() => handleDelete(user)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-12 text-center text-slate-500">
                      Chưa có người dùng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="font-bold text-slate-800">
                {editingUserId ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}
              </h3>
              <button type="button" onClick={closeForm} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 p-5">
              <label className="block text-sm font-medium text-slate-700">
                Tên đăng nhập
                <input
                  type="text"
                  required
                  minLength="3"
                  maxLength="32"
                  pattern="[A-Za-z0-9._-]+"
                  autoComplete="username"
                  value={form.username}
                  onChange={(event) => setForm({ ...form, username: event.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Họ tên
                <input
                  type="text"
                  maxLength="100"
                  value={form.full_name}
                  onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Vai trò
                <select
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Mật khẩu {editingUserId && <span className="font-normal text-slate-500">(để trống để giữ nguyên)</span>}
                <input
                  type="password"
                  required={!editingUserId}
                  minLength="8"
                  maxLength="128"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={closeForm} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Lưu người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
