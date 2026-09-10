import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ROLE_LABELS, ROLE_ORDER } from '../lib/roles';
import { toEmail } from '../context/AuthContext';

const ADMIN_USERS_URL = `${import.meta.env.VITE_SUPABASE_URL.replace('/rest/v1', '')}/functions/v1/admin-users`;

async function callAdminApi(method, body, params) {
  const { data: { session } } = await supabase.auth.getSession();
  const url = params ? `${ADMIN_USERS_URL}?${new URLSearchParams(params)}` : ADMIN_USERS_URL;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'エラーが発生しました');
  return json;
}

export default function Settings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await callAdminApi('GET', null, null);
      setUsers(data.users || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleDelete = async (userId, email) => {
    if (!confirm(`${email} を削除しますか？この操作は元に戻せません。`)) return;
    try {
      await callAdminApi('DELETE', { user_id: userId });
      await loadUsers();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">システム設定</h2>
        <p className="text-sm text-slate-500 mt-1">管理者のみ閲覧・操作できます</p>
      </div>

      {/* ユーザー管理 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">ユーザー管理</h3>
            <p className="text-xs text-slate-500 mt-0.5">ログインユーザーの追加・権限変更・削除</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary text-sm"
          >
            + ユーザー追加
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-6 py-8 text-center text-sm text-slate-400">読み込み中...</div>
          ) : users.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-400">ユーザーが見つかりません</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">社員番号</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">氏名</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">権限</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">最終ログイン</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-mono text-slate-700">{u.employee_id || <span className="text-slate-400 text-xs">—</span>}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-800">{u.display_name || <span className="text-slate-400 text-xs">未設定</span>}</div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {u.last_sign_in_at ? formatDate(u.last_sign_in_at) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >編集</button>
                        <button
                          onClick={() => handleDelete(u.id, u.email)}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline"
                        >削除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); loadUsers(); }}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={() => { setEditingUser(null); loadUsers(); }}
        />
      )}
    </div>
  );
}

function RoleBadge({ role }) {
  const colors = {
    admin: 'bg-purple-100 text-purple-700',
    operator: 'bg-blue-100 text-blue-700',
    viewer: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] || colors.viewer}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function CreateUserModal({ onClose, onCreated }) {
  const [employeeId, setEmployeeId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId.trim()) { setError('社員番号を入力してください'); return; }
    if (password.length < 6) { setError('パスワードは6文字以上で入力してください'); return; }
    setLoading(true);
    setError('');
    try {
      const email = toEmail(employeeId.trim());
      await callAdminApi('POST', { email, password, role, display_name: displayName, employee_id: employeeId.trim() });
      onCreated();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <Modal title="ユーザー追加" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">社員番号 <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={employeeId}
            onChange={e => setEmployeeId(e.target.value)}
            required
            autoFocus
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例：1001"
          />
          {employeeId && (
            <p className="text-xs text-slate-400 mt-1">ログインID：{toEmail(employeeId)}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">氏名（表示名）</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            maxLength={50}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例：細野 一郎"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">パスワード <span className="text-red-500">*</span></label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="6文字以上"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">権限</label>
          <div className="flex gap-2">
            {ROLE_ORDER.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  role === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            {role === 'admin' ? '全機能の閲覧・操作・ユーザー管理が可能' :
             role === 'operator' ? '全機能の閲覧・操作が可能（ユーザー管理を除く）' :
             '全機能の閲覧のみ可能（データ編集不可）'}
          </p>
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm">キャンセル</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 text-sm">
            {loading ? '作成中...' : '作成する'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditUserModal({ user, onClose, onSaved }) {
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [role, setRole] = useState(user.role || 'viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await callAdminApi('PATCH', { user_id: user.id, role, display_name: displayName });
      onSaved();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <Modal title="ユーザー編集" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 rounded-lg px-3 py-2 flex items-center gap-3">
          <span className="text-xs font-mono text-slate-700 font-semibold">No.{user.employee_id || '—'}</span>
          <span className="text-xs text-slate-400">{user.email}</span>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">氏名（表示名）</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            autoFocus
            maxLength={50}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例：細野 一郎"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">権限</label>
          <div className="flex gap-2">
            {ROLE_ORDER.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  role === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            {role === 'admin' ? '全機能の閲覧・操作・ユーザー管理が可能' :
             role === 'operator' ? '全機能の閲覧・操作が可能（ユーザー管理を除く）' :
             '全機能の閲覧のみ可能（データ編集不可）'}
          </p>
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm">キャンセル</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 text-sm">
            {loading ? '保存中...' : '保存する'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}
