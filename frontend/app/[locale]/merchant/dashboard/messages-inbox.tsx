'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSummary, MessageDetail, PaginatedResult } from '../../../lib/types';
import { getMessages, getMessageThread, markMessageRead, replyMessage } from '../../../lib/api';

interface Props {
  businessId: string;
}

export default function MessagesInbox({ businessId }: Props) {
  const [inbox, setInbox] = useState<PaginatedResult<MessageSummary> | null>(null);
  const [thread, setThread] = useState<MessageDetail[] | null>(null);
  const [selected, setSelected] = useState<MessageSummary | null>(null);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [inboxError, setInboxError] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadInbox = useCallback(async () => {
    setLoadingInbox(true);
    setInboxError(null);
    try {
      const data = await getMessages(businessId, page);
      setInbox(data);
    } catch {
      setInboxError('Erreur lors du chargement des messages');
    } finally {
      setLoadingInbox(false);
    }
  }, [businessId, page]);

  useEffect(() => { loadInbox(); }, [loadInbox]);

  const openThread = async (msg: MessageSummary) => {
    setSelected(msg);
    setThread(null);
    setReplyContent('');
    setReplyError(null);
    setLoadingThread(true);

    try {
      const [threadData] = await Promise.all([
        getMessageThread(msg.id),
        !msg.isRead ? markMessageRead(msg.id).catch(() => {}) : Promise.resolve(),
      ]);
      setThread(threadData);

      // Mark as read in local state
      if (!msg.isRead) {
        setInbox(prev => prev ? {
          ...prev,
          items: prev.items.map(m => m.id === msg.id ? { ...m, isRead: true } : m)
        } : prev);
      }
    } catch {
      setThread([]);
    } finally {
      setLoadingThread(false);
    }
  };

  const handleReply = async () => {
    if (!selected || !replyContent.trim()) return;
    setReplying(true);
    setReplyError(null);
    try {
      await replyMessage(selected.id, replyContent.trim());
      // Reload thread to show the new reply
      const updated = await getMessageThread(selected.id);
      setThread(updated);
      setReplyContent('');
      // Update reply count in inbox
      setInbox(prev => prev ? {
        ...prev,
        items: prev.items.map(m => m.id === selected.id
          ? { ...m, replyCount: m.replyCount + 1, lastActivityAt: new Date().toISOString() }
          : m)
      } : prev);
    } catch (e: unknown) {
      setReplyError(e instanceof Error ? e.message : 'Erreur lors de l\'envoi de la réponse');
    } finally {
      setReplying(false);
    }
  };

  const totalPages = inbox ? Math.ceil(inbox.totalCount / 20) : 1;
  const unreadCount = inbox?.items.filter(m => !m.isRead).length ?? 0;

  return (
    <div className="flex h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Left panel: inbox */}
      <div className="w-full sm:w-80 flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Boîte de réception
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
        </div>

        {loadingInbox ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Chargement...</div>
        ) : inboxError ? (
          <div className="p-4 text-sm text-red-600">{inboxError}</div>
        ) : (inbox?.items.length ?? 0) === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Aucun message</div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
              {inbox!.items.map(msg => (
                <li key={msg.id}>
                  <button
                    onClick={() => openThread(msg)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selected?.id === msg.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {!msg.isRead && (
                          <span className="w-2 h-2 flex-shrink-0 rounded-full bg-blue-600 mt-1.5" aria-label="Non lu" />
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm truncate ${!msg.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                            {msg.senderName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{msg.contentPreview}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatDate(msg.lastActivityAt)}
                      </span>
                    </div>
                    {msg.replyCount > 0 && (
                      <p className="text-xs text-gray-400 mt-1 ml-4">{msg.replyCount} réponse{msg.replyCount > 1 ? 's' : ''}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-xs text-gray-500 disabled:opacity-40 hover:text-gray-700"
                >
                  ← Précédent
                </button>
                <span className="text-xs text-gray-400">{page}/{totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-xs text-gray-500 disabled:opacity-40 hover:text-gray-700"
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right panel: thread */}
      <div className="hidden sm:flex flex-1 flex-col bg-gray-50 dark:bg-gray-900">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Sélectionnez un message pour le lire
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <p className="font-semibold text-gray-900 dark:text-white">{selected.senderName}</p>
              <p className="text-xs text-gray-500">{selected.senderEmail}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingThread ? (
                <div className="text-center text-gray-500 text-sm py-8">Chargement...</div>
              ) : (thread ?? []).map(msg => (
                <div key={msg.id} className={`flex ${msg.isFromMerchant ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-lg px-4 py-2 ${
                    msg.isFromMerchant
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.isFromMerchant ? 'text-blue-200' : 'text-gray-400'}`}>
                      {msg.senderName} · {formatDateTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {replyError && (
                <p className="text-xs text-red-600 mb-2">{replyError}</p>
              )}
              <div className="flex gap-2">
                <textarea
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  placeholder="Votre réponse..."
                  rows={2}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.ctrlKey) handleReply();
                  }}
                />
                <button
                  onClick={handleReply}
                  disabled={replying || !replyContent.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors self-end"
                >
                  {replying ? '...' : 'Envoyer'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Ctrl+Entrée pour envoyer</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return d.toLocaleDateString('fr-CA', { weekday: 'short' });
  return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
