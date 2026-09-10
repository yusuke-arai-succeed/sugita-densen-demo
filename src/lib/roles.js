export const ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
};

export const ROLE_LABELS = {
  admin: '管理者',
  operator: 'オペレーター',
  viewer: '閲覧者',
};

export const ROLE_ORDER = ['admin', 'operator', 'viewer'];

export function getRoleFromUser(user) {
  return user?.user_metadata?.role ?? ROLES.VIEWER;
}
