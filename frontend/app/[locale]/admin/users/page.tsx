'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { ArrowLeft, Users, UserPlus, Shield, UserCheck, UserX, Search, Loader2, AlertTriangle } from 'lucide-react';

// Mock user data - Replace with actual API calls when available
interface AdminUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  status: 'active' | 'inactive';
  createdAt: string;
}

const MOCK_USERS: AdminUser[] = [
  { id: '1', email: 'admin@afromarket.ca', name: 'Admin Principal', roles: ['admin', 'merchant'], status: 'active', createdAt: '2024-01-15' },
  { id: '2', email: 'merchant1@example.com', name: 'Jean Dupont', roles: ['merchant'], status: 'active', createdAt: '2024-02-20' },
  { id: '3', email: 'merchant2@example.com', name: 'Marie Claire', roles: ['merchant'], status: 'active', createdAt: '2024-03-10' },
  { id: '4', email: 'user@example.com', name: 'Paul Martin', roles: ['merchant'], status: 'inactive', createdAt: '2024-03-25' },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fr') as 'fr' | 'en';
  const { user, isAuthenticated, isLoading } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const t = {
    fr: {
      title: 'Gestion des utilisateurs',
      backToDashboard: 'Tableau de bord',
      search: 'Rechercher un utilisateur...',
      createAdmin: 'Créer un administrateur',
      table: { name: 'Nom', email: 'Email', roles: 'Rôles', status: 'Statut', created: 'Créé le', actions: 'Actions' },
      status: { active: 'Actif', inactive: 'Inactif' },
      roles: { admin: 'Admin', merchant: 'Commerçant' },
      activate: 'Activer',
      deactivate: 'Désactiver',
      noUsers: 'Aucun utilisateur trouvé.',
      createModal: { title: 'Créer un administrateur', name: 'Nom complet', email: 'Email', cancel: 'Annuler', create: 'Créer' },
      mockNotice: 'Cette page utilise des données de démonstration. Connectez l\'API utilisateurs pour une fonctionnalité complète.',
    },
    en: {
      title: 'User Management',
      backToDashboard: 'Dashboard',
      search: 'Search for a user...',
      createAdmin: 'Create an admin',
      table: { name: 'Name', email: 'Email', roles: 'Roles', status: 'Status', created: 'Created', actions: 'Actions' },
      status: { active: 'Active', inactive: 'Inactive' },
      roles: { admin: 'Admin', merchant: 'Merchant' },
      activate: 'Activate',
      deactivate: 'Deactivate',
      noUsers: 'No users found.',
      createModal: { title: 'Create an admin', name: 'Full name', email: 'Email', cancel: 'Cancel', create: 'Create' },
      mockNotice: 'This page uses demo data. Connect the users API for full functionality.',
    }
  }[locale];

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.roles.includes('admin'))) {
      router.push(`/${locale}`);
    }
  }, [isLoading, isAuthenticated, user, locale, router]);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUsers(MOCK_USERS);
      setLoading(false);
    }, 500);
  }, []);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserStatus = (userId: string) => {
    setActionLoading(userId);
    setTimeout(() => {
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
      ));
      setActionLoading(null);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
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
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{t.title}</h1>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
            data-testid="create-admin-btn"
          >
            <UserPlus className="w-5 h-5" />
            <span className="hidden sm:inline">{t.createAdmin}</span>
          </button>
        </div>

        {/* Mock Notice */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3" data-testid="mock-notice">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">{t.mockNotice}</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search}
              className="input-default pl-12"
              data-testid="search-input"
            />
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="card-dashboard text-center py-12">
            <div className="animate-pulse text-muted-foreground">Chargement...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.table.roles}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.table.status}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">{t.table.created}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.table.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-stone-50 transition-colors" data-testid={`user-row-${u.id}`}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-semibold">{u.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{u.name}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground hidden md:table-cell">{u.email}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map(role => (
                            <span
                              key={role}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                role === 'admin' ? 'bg-secondary/20 text-secondary-foreground' : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {role === 'admin' && <Shield className="w-3 h-3" />}
                              {t.roles[role as keyof typeof t.roles] || role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'
                        }`}>
                          {u.status === 'active' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {t.status[u.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground hidden lg:table-cell">
                        {new Date(u.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA')}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => toggleUserStatus(u.id)}
                            disabled={actionLoading === u.id}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                              u.status === 'active'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            }`}
                            data-testid={`toggle-status-btn-${u.id}`}
                          >
                            {actionLoading === u.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : u.status === 'active' ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                            {u.status === 'active' ? t.deactivate : t.activate}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" data-testid="create-modal">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <h3 className="font-heading text-xl font-semibold text-foreground mb-4">{t.createModal.title}</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t.createModal.name}</label>
                <input type="text" className="input-default" data-testid="create-name-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t.createModal.email}</label>
                <input type="email" className="input-default" data-testid="create-email-input" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="btn-outline" data-testid="create-cancel-btn">
                {t.createModal.cancel}
              </button>
              <button className="btn-primary" data-testid="create-submit-btn">
                {t.createModal.create}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
