'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import {
  ArrowLeft, Users, Shield, UserCheck, UserX, Search, Loader2,
  ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { getAdminUsers, enableUser, disableUser, AdminUsersParams } from '../../../lib/api';
import { AdminUser, AdminUsersResponse, UserRole } from '../../../lib/types';

const SORT_OPTIONS = {
  fr: [
    ['created_desc', 'Plus récents'],
    ['created_asc', 'Plus anciens'],
    ['name_asc', 'Nom (A-Z)'],
    ['name_desc', 'Nom (Z-A)'],
    ['email_asc', 'Email (A-Z)'],
  ],
  en: [
    ['created_desc', 'Most recent'],
    ['created_asc', 'Oldest first'],
    ['name_asc', 'Name (A-Z)'],
    ['name_desc', 'Name (Z-A)'],
    ['email_asc', 'Email (A-Z)'],
  ],
};

export default function AdminUsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fr') as 'fr' | 'en';
  const { user, isAuthenticated, isLoading } = useAuth();

  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & pagination
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [enabledFilter, setEnabledFilter] = useState<boolean | ''>('');
  const [sort, setSort] = useState('created_desc');
  const [page, setPage] = useState(1);

  // Action state: { id, action: 'enable' | 'disable' }
  const [confirming, setConfirming] = useState<{ id: string; action: 'enable' | 'disable' } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const t = {
    fr: {
      title: 'Gestion des utilisateurs',
      back: 'Tableau de bord',
      search: 'Rechercher (nom, email…)',
      allRoles: 'Tous les rôles',
      allStatuses: 'Tous les statuts',
      active: 'Actif',
      inactive: 'Inactif',
      sortBy: 'Trier',
      table: { name: 'Nom', email: 'Email', role: 'Rôle', status: 'Statut', joined: 'Inscription', businesses: 'Commerces', actions: 'Actions' },
      roles: { Merchant: 'Commerçant', Admin: 'Admin', Anonymous: 'Anonyme' },
      enable: 'Activer',
      disable: 'Désactiver',
      confirmEnable: 'Confirmer l\'activation ?',
      confirmDisable: 'Désactiver cet utilisateur ?',
      confirm: 'Confirmer',
      cancel: 'Annuler',
      noUsers: 'Aucun utilisateur trouvé.',
      page: 'Page',
      of: 'sur',
      total: 'utilisateurs',
      loadError: 'Impossible de charger les utilisateurs.',
      actionError: 'Une erreur s\'est produite.',
    },
    en: {
      title: 'User Management',
      back: 'Dashboard',
      search: 'Search (name, email…)',
      allRoles: 'All roles',
      allStatuses: 'All statuses',
      active: 'Active',
      inactive: 'Inactive',
      sortBy: 'Sort',
      table: { name: 'Name', email: 'Email', role: 'Role', status: 'Status', joined: 'Joined', businesses: 'Businesses', actions: 'Actions' },
      roles: { Merchant: 'Merchant', Admin: 'Admin', Anonymous: 'Anonymous' },
      enable: 'Enable',
      disable: 'Disable',
      confirmEnable: 'Confirm enable?',
      confirmDisable: 'Disable this user?',
      confirm: 'Confirm',
      cancel: 'Cancel',
      noUsers: 'No users found.',
      page: 'Page',
      of: 'of',
      total: 'users',
      loadError: 'Failed to load users.',
      actionError: 'An error occurred.',
    },
  }[locale];

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(id);
  }, [search]);

  // Auth guard
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.roles.includes('admin'))) {
      router.push(`/${locale}`);
    }
  }, [isLoading, isAuthenticated, user, locale, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: AdminUsersParams = {
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        isEnabled: enabledFilter !== '' ? enabledFilter : undefined,
        sort,
        page,
        pageSize: 20,
      };
      const result = await getAdminUsers(params);
      setData(result);
    } catch {
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, enabledFilter, sort, page]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchUsers();
    }
  }, [fetchUsers, isLoading, isAuthenticated]);

  const handleAction = async (id: string, action: 'enable' | 'disable') => {
    setActionLoading(id);
    setActionError(null);
    try {
      const updated = action === 'enable' ? await enableUser(id) : await disableUser(id);
      setData(prev =>
        prev
          ? { ...prev, items: prev.items.map(u => u.id === updated.id ? updated : u) }
          : prev
      );
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : t.actionError);
    } finally {
      setActionLoading(null);
      setConfirming(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/${locale}/admin/dashboard`}
            className="text-muted-foreground hover:text-primary transition-colors"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{t.title}</h1>
              {data && (
                <p className="text-sm text-muted-foreground">
                  {data.totalCount} {t.total}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action error banner */}
        {actionError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {actionError}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              className="input-default pl-10 w-full"
              data-testid="search-input"
            />
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value as UserRole | ''); setPage(1); }}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="role-filter"
          >
            <option value="">{t.allRoles}</option>
            <option value="Merchant">{t.roles.Merchant}</option>
            <option value="Admin">{t.roles.Admin}</option>
          </select>

          {/* Status filter */}
          <select
            value={enabledFilter === '' ? '' : String(enabledFilter)}
            onChange={(e) => {
              setEnabledFilter(e.target.value === '' ? '' : e.target.value === 'true');
              setPage(1);
            }}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="status-filter"
          >
            <option value="">{t.allStatuses}</option>
            <option value="true">{t.active}</option>
            <option value="false">{t.inactive}</option>
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="sort-select"
          >
            {(SORT_OPTIONS[locale] ?? SORT_OPTIONS['fr']).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="card-dashboard py-16 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="card-dashboard text-center py-12">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="card-dashboard text-center py-12">
            <p className="text-muted-foreground">{t.noUsers}</p>
          </div>
        ) : (
          <div className="card-dashboard overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="users-table">
                <thead>
                  <tr className="bg-stone-50 border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.table.name}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">{t.table.email}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.table.role}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.table.status}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">{t.table.businesses}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">{t.table.joined}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.table.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((u) => {
                    const fullName = `${u.firstName} ${u.lastName}`.trim() || u.preferredUsername || u.email;
                    const initial = fullName.charAt(0).toUpperCase();
                    const isConfirming = confirming?.id === u.id;
                    const isActing = actionLoading === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-stone-50 transition-colors" data-testid={`user-row-${u.id}`}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-primary font-semibold text-sm">{initial}</span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">{fullName}</p>
                              <p className="text-xs text-muted-foreground md:hidden">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground hidden md:table-cell">{u.email}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            u.role === 'Admin'
                              ? 'bg-secondary/20 text-secondary-foreground'
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {u.role === 'Admin' && <Shield className="w-3 h-3" />}
                            {t.roles[u.role] ?? u.role}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            u.isEnabled
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-stone-100 text-stone-600'
                          }`}>
                            {u.isEnabled ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                            {u.isEnabled ? t.active : t.inactive}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground hidden lg:table-cell">
                          {u.businessCount}
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground hidden lg:table-cell">
                          {new Date(u.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA')}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {isConfirming ? (
                              /* Inline confirm panel */
                              <div className="flex items-center gap-2 bg-stone-50 border border-border rounded-xl px-3 py-1.5">
                                <span className="text-xs text-foreground whitespace-nowrap">
                                  {confirming.action === 'disable' ? t.confirmDisable : t.confirmEnable}
                                </span>
                                <button
                                  onClick={() => handleAction(u.id, confirming.action)}
                                  disabled={isActing}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                                    confirming.action === 'disable'
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  }`}
                                  data-testid={`confirm-action-btn-${u.id}`}
                                >
                                  {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : t.confirm}
                                </button>
                                <button
                                  onClick={() => setConfirming(null)}
                                  disabled={isActing}
                                  className="px-2 py-1 rounded-lg text-xs border border-border hover:bg-stone-100 transition-colors"
                                >
                                  {t.cancel}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirming({ id: u.id, action: u.isEnabled ? 'disable' : 'enable' })}
                                disabled={isActing}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                                  u.isEnabled
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                }`}
                                data-testid={`toggle-status-btn-${u.id}`}
                              >
                                {u.isEnabled
                                  ? <><UserX className="w-4 h-4" />{t.disable}</>
                                  : <><UserCheck className="w-4 h-4" />{t.enable}</>
                                }
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  {t.page} {page} {t.of} {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 border border-border rounded-lg disabled:opacity-40 hover:bg-stone-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 border border-border rounded-lg disabled:opacity-40 hover:bg-stone-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
