import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Conversation {
  _id: string;
  patientId: string;
  status: string;
  unreadCount: number;
  lastMessageAt: string;
}

interface InboxItem {
  conversation: Conversation;
  patient: {
    _id: string;
    name: string;
    cancerType: string;
    cancerStage: string;
    patientCode: string;
  } | null;
  lastMessage: {
    body: string;
    senderType: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function previewBody(item: InboxItem): string {
  if (!item.lastMessage) return 'No messages yet';
  const { senderType, body } = item.lastMessage;
  if (senderType === 'navigator') return `You: ${body}`;
  if (senderType === 'bot') return 'Assistant reply';
  if (senderType === 'caregiver') return `via caregiver: ${body}`;
  return body;
}

export function NavMessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    api.get(`/messages/inbox/${user._id}`)
      .then((r) => setInbox(r.data))
      .finally(() => setLoading(false));
  }, [user?._id]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <p className="text-muted-foreground text-sm">Loading messages…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Messages</h1>
        <span className="text-sm text-muted-foreground">{inbox.length} conversations</span>
      </div>

      {inbox.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No conversations yet</p>
        </div>
      )}

      <div className="space-y-1">
        {inbox.map((item) => (
          <div
            key={item.conversation._id}
            className={`bg-card border rounded-lg p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${
              item.conversation.status === 'escalated'
                ? 'border-l-4 border-l-red-500 border-border'
                : 'border-border'
            }`}
            onClick={() => navigate(`/nav/messages/${item.patient?._id}`)}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
              {item.patient?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.patient?.name ?? 'Unknown'}
                </p>
                {item.lastMessage && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {timeAgo(item.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.patient?.cancerType || '—'} · {item.patient?.patientCode}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {previewBody(item)}
              </p>
            </div>
            {item.unreadCount > 0 && (
              <span className="flex-shrink-0 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {item.unreadCount > 9 ? '9+' : item.unreadCount}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
