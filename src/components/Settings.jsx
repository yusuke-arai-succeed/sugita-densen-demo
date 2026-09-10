import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ROLE_LABELS, ROLE_ORDER } from '../lib/roles';
import { toEmail } from '../context/AuthContext';
import { DEPARTMENTS, POSITIONS } from '../lib/constants';

const ADMIN_USERS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`;

async function callAdminApi(method, body) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(ADMIN_USERS_URL, {
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

// role_defaults は anon key で直接 Supabase から読み書き（admin 検証はフロント側）
async function fetchRoleDefaults() {
  const { data, error } = await supabase.from('role_defaults').select('*');
  if (error) throw new Error(error.message);
  return data;
}

async function saveRoleDefault(department, position, role) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(ADMIN_USERS_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ resource: 'role-defaults', department, position, role }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'エラーが発生しました');
  return json;
}

const TABS = ['ユーザー管理', 'ロール設定'];

export default function Settings() {
  const [tab, setTab] = useState(0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">システム設定</h2>
        <p className="text-sm text-slate-500 mt-1">管理者のみ閲覧・操作できます</p>
      </div>

      {/* タブ */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === i ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <UserManagement />}
      {tab === 1 && <RoleDefaultSettings />}
    </div>
  );
}

/* ─────────────────────────────────────────────
   タブ①：ユーザー管理
───────────────────────────────────────────── */
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roleDefaults, setRoleDefaults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, defaultsData] = await Promise.all([
        callAdminApi('GET'),
        fetchRoleDefaults(),
      ]);
      setUsers(usersData.users || []);
      const map = {};
      (defaultsData || []).forEach(r => { map[`${r.department}__${r.position}`] = r.role; });
      setRoleDefaults(map);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (userId, label) => {
    if (!confirm(`${label} を削除しますか？この操作は元に戻せません。`)) return;
    try {
      await callAdminApi('DELETE', { user_id: userId });
      await loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800">ユーザー管理</h3>
          <p className="text-xs text-slate-500 mt-0.5">ログインユーザーの追加・権限変更・削除</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm">
          + ユーザー追加
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
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
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">部署／職位</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">権限</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">最終ログイン</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => {
                const defaultRole = roleDefaults[`${u.department}__${u.position}`];
                const isOverridden = u.department && u.position && defaultRole && defaultRole !== u.role;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-mono text-slate-700">{u.employee_id || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">
                      {u.display_name || <span className="text-slate-400 text-xs">未設定</span>}
                    </td>
                    <td className="px-4 py-3">
                      {u.department ? (
                        <div className="text-xs text-slate-600">
                          <span className="font-medium">{u.department}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span>{u.position}</span>
                        </div>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <RoleBadge role={u.role} />
                        {isOverridden && (
                          <span className="text-xs text-amber-500" title={`デフォルト: ${ROLE_LABELS[defaultRole]}`}>★</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {u.last_sign_in_at ? formatDate(u.last_sign_in_at) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setEditingUser({ ...u, roleDefaults })}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline">編集</button>
                        <button onClick={() => handleDelete(u.id, u.display_name || u.employee_id || u.email)}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline">削除</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div className="px-6 py-2 text-xs text-slate-400">★ デフォルトロールから個別変更済み</div>

      {showCreateModal && (
        <CreateUserModal
          roleDefaults={roleDefaults}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); loadData(); }}
        />
      )}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={() => { setEditingUser(null); loadData(); }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   タブ②：ロール設定マトリクス
───────────────────────────────────────────── */
function RoleDefaultSettings() {
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchRoleDefaults().then(data => {
      const m = {};
      (data || []).forEach(r => { m[`${r.department}__${r.position}`] = r.role; });
      setMatrix(m);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const handleChange = (dept, pos, role) => {
    setMatrix(prev => ({ ...prev, [`${dept}__${pos}`]: role }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await Promise.all(
        DEPARTMENTS.flatMap(dept =>
          POSITIONS.map(pos => saveRoleDefault(dept, pos, matrix[`${dept}__${pos}`] || 'viewer'))
        )
      );
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const roleColor = (role) => ({
    admin:    'bg-purple-100 text-purple-700 border-purple-200',
    operator: 'bg-blue-100 text-blue-700 border-blue-200',
    viewer:   'bg-slate-100 text-slate-600 border-slate-200',
  })[role] || 'bg-slate-100 text-slate-600 border-slate-200';

  if (loading) return <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-8 text-center text-sm text-slate-400">読み込み中...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800">部署×職位 デフォルトロール設定</h3>
          <p className="text-xs text-slate-500 mt-0.5">ユーザー作成時にこの設定からロールが自動入力されます。個人単位での上書きも可能です。</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-green-600">保存しました</span>}
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="overflow-x-auto p-6">
        {/* 凡例 */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <span className="text-slate-500 font-medium">凡例：</span>
          {ROLE_ORDER.map(r => (
            <span key={r} className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${roleColor(r)}`}>
              {ROLE_LABELS[r]}
            </span>
          ))}
        </div>

        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-slate-500 pr-4 pb-3 w-24">職位 \ 部署</th>
              {DEPARTMENTS.map(d => (
                <th key={d} className="text-center text-xs font-medium text-slate-700 px-3 pb-3 min-w-[110px]">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {POSITIONS.map(pos => (
              <tr key={pos} className="border-t border-slate-100">
                <td className="text-xs font-medium text-slate-600 pr-4 py-2 whitespace-nowrap">{pos}</td>
                {DEPARTMENTS.map(dept => {
                  const key = `${dept}__${pos}`;
                  const current = matrix[key] || 'viewer';
                  return (
                    <td key={dept} className="px-3 py-2">
                      <div className="flex gap-1">
                        {ROLE_ORDER.map(r => (
                          <button
                            key={r}
                            onClick={() => handleChange(dept, pos, r)}
                            title={ROLE_LABELS[r]}
                            className={`flex-1 py-1 rounded text-xs font-medium border transition-colors ${
                              current === r ? roleColor(r) : 'bg-white text-slate-300 border-slate-200 hover:border-slate-300 hover:text-slate-500'
                            }`}
                          >
                            {r === 'admin' ? '管' : r === 'operator' ? '操' : '閲'}
                          </button>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 text-xs text-slate-400 space-y-0.5">
          <div>閲 = 閲覧者（viewer）　操 = オペレーター（operator）　管 = 管理者（admin）</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ユーザー追加モーダル
───────────────────────────────────────────── */
function CreateUserModal({ roleDefaults, onClose, onCreated }) {
  const [employeeId, setEmployeeId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');
  const [roleOverridden, setRoleOverridden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 部署・職位が揃ったらデフォルトロールを自動入力
  useEffect(() => {
    if (department && position && !roleOverridden) {
      const defaultRole = roleDefaults[`${department}__${position}`];
      if (defaultRole) setRole(defaultRole);
    }
  }, [department, position, roleDefaults, roleOverridden]);

  const handleRoleChange = (r) => {
    setRole(r);
    setRoleOverridden(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId.trim()) { setError('社員番号を入力してください'); return; }
    if (password.length < 6) { setError('パスワードは6文字以上で入力してください'); return; }
    setLoading(true);
    setError('');
    try {
      const email = toEmail(employeeId.trim());
      await callAdminApi('POST', {
        email, password, role,
        display_name: displayName,
        employee_id: employeeId.trim(),
        department,
        position,
      });
      onCreated();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const defaultRole = department && position ? roleDefaults[`${department}__${position}`] : null;

  return (
    <Modal title="ユーザー追加" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">社員番号 <span className="text-red-500">*</span></label>
            <input type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)}
              required autoFocus
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例：1001" />
            {employeeId && <p className="text-xs text-slate-400 mt-0.5 truncate">{toEmail(employeeId)}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">氏名</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              maxLength={50}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例：細野 一郎" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">所属部署</label>
            <select value={department} onChange={e => { setDepartment(e.target.value); setRoleOverridden(false); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">選択してください</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">職位</label>
            <select value={position} onChange={e => { setPosition(e.target.value); setRoleOverridden(false); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">選択してください</option>
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-600">権限</label>
            {defaultRole && !roleOverridden && (
              <span className="text-xs text-blue-500">部署×職位から自動設定</span>
            )}
            {roleOverridden && defaultRole && (
              <button type="button" onClick={() => { setRole(defaultRole); setRoleOverridden(false); }}
                className="text-xs text-slate-400 hover:text-blue-500 underline">デフォルトに戻す</button>
            )}
          </div>
          <div className="flex gap-2">
            {ROLE_ORDER.map(r => (
              <button key={r} type="button" onClick={() => handleRoleChange(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  role === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}>
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">パスワード <span className="text-red-500">*</span></label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="6文字以上" />
        </div>

        {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

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

/* ─────────────────────────────────────────────
   ユーザー編集モーダル
───────────────────────────────────────────── */
function EditUserModal({ user, onClose, onSaved }) {
  const roleDefaults = user.roleDefaults || {};
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [department, setDepartment] = useState(user.department || '');
  const [position, setPosition] = useState(user.position || '');
  const [role, setRole] = useState(user.role || 'viewer');
  const [roleOverridden, setRoleOverridden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (department && position && !roleOverridden) {
      const defaultRole = roleDefaults[`${department}__${position}`];
      if (defaultRole) setRole(defaultRole);
    }
  }, [department, position, roleDefaults, roleOverridden]);

  const handleRoleChange = (r) => { setRole(r); setRoleOverridden(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await callAdminApi('PATCH', {
        user_id: user.id, role, display_name: displayName, department, position,
      });
      onSaved();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const defaultRole = department && position ? roleDefaults[`${department}__${position}`] : null;

  return (
    <Modal title="ユーザー編集" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 rounded-lg px-3 py-2 flex items-center gap-3">
          <span className="text-xs font-mono text-slate-700 font-semibold">No.{user.employee_id || '—'}</span>
          <span className="text-xs text-slate-400">{user.email}</span>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">氏名（表示名）</label>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
            autoFocus maxLength={50}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例：細野 一郎" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">所属部署</label>
            <select value={department} onChange={e => { setDepartment(e.target.value); setRoleOverridden(false); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">選択してください</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">職位</label>
            <select value={position} onChange={e => { setPosition(e.target.value); setRoleOverridden(false); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">選択してください</option>
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-600">権限</label>
            {defaultRole && !roleOverridden && (
              <span className="text-xs text-blue-500">部署×職位から自動設定</span>
            )}
            {roleOverridden && defaultRole && (
              <button type="button" onClick={() => { setRole(defaultRole); setRoleOverridden(false); }}
                className="text-xs text-slate-400 hover:text-blue-500 underline">デフォルトに戻す</button>
            )}
          </div>
          <div className="flex gap-2">
            {ROLE_ORDER.map(r => (
              <button key={r} type="button" onClick={() => handleRoleChange(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  role === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}>
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

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

function RoleBadge({ role }) {
  const colors = {
    admin:    'bg-purple-100 text-purple-700',
    operator: 'bg-blue-100 text-blue-700',
    viewer:   'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] || colors.viewer}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
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
