import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Message {
  _id: string;
  senderType: string;
  body: string;
  visibleTo?: string[];
  isSystem?: boolean;
  isPlaceholder?: boolean;
  createdAt: string;
  senderId?: { _id: string; name: string } | null;
}

interface Patient {
  _id: string;
  name: string;
  cancerType: string;
  cancerStage: string;
  hospitalName?: string;
  chemoSessionsCompleted?: number;
  chemoSessionsTotal?: number;
  caregiverName?: string;
  caregiverRelationship?: string;
}

type Scope = 'patient' | 'caregiver' | 'both';

const QUICK_CHIPS: Record<Scope, string[]> = {
  patient: ['Hi, I\'ll check on you', 'Rest and stay hydrated', 'Call 108 if worsening'],
  caregiver: ['Noted, thank you', 'Monitor every 2 hrs', 'Visit clinic if above 39°C'],
  both: ['Please stay calm', 'I have received your update', 'Follow up in 30 min'],
};

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function NavChatPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [scope, setScope] = useState<Scope>('patient');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!patientId) return;
    fetchThread();
    markRead();
  }, [patientId]);

  const fetchThread = async () => {
    const r = await api.get(`/messages/thread/${patientId}?callerRole=navigator`);
    setMessages(r.data.messages ?? []);
    setPatient(r.data.patient ?? null);
    setConversationId(r.data.conversation?._id ?? null);
  };

  const markRead = async () => {
    if (!conversationId) return;
    await api.post(`/messages/read/${conversationId}`).catch(() => {});
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (conversationId) markRead();
  }, [conversationId]);

  const send = async () => {
    if (!body.trim() || !patientId || !user?._id || sending) return;
    setSending(true);
    try {
      const r = await api.post('/messages/send', {
        patientId,
        senderId: user._id,
        senderType: 'navigator',
        body: body.trim(),
        scope,
      });
      const { message, scopeMessage } = r.data;
      setMessages((prev) => [
        ...prev,
        message,
        ...(scopeMessage ? [scopeMessage] : []),
      ]);
      setBody('');
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const bubbleStyle = (msg: Message): string => {
    if (msg.isSystem || msg.senderType === 'system') {
      return 'mx-auto text-center text-xs text-muted-foreground py-1';
    }
    if (msg.senderType === 'navigator') {
      return 'ml-auto bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 max-w-xs text-sm';
    }
    if (msg.senderType === 'bot') {
      return 'mr-auto bg-blue-50 text-blue-800 border border-blue-200 rounded-2xl rounded-tl-sm px-3 py-2 max-w-xs text-sm';
    }
    return 'mr-auto bg-muted text-foreground rounded-2xl rounded-tl-sm px-3 py-2 max-w-xs text-sm';
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="h-14 px-4 flex items-center gap-3 border-b border-border bg-card flex-shrink-0">
        <button
          onClick={() => navigate('/nav/messages')}
          className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{patient?.name ?? '…'}</p>
          <p className="text-xs text-muted-foreground truncate">
            {patient?.cancerType} · Stage {patient?.cancerStage}
            {patient?.caregiverName && ` · Caregiver: ${patient.caregiverName}`}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg._id} className="flex">
            <div className={bubbleStyle(msg)}>
              {!msg.isSystem && msg.senderType !== 'system' && (
                <p className="text-xs opacity-60 mb-0.5">
                  {msg.senderType === 'navigator'
                    ? 'You'
                    : msg.senderType === 'bot'
                    ? 'Bot'
                    : msg.senderType === 'caregiver'
                    ? `Caregiver`
                    : msg.senderId?.name ?? 'Patient'}
                  {' · '}{formatTime(msg.createdAt)}
                </p>
              )}
              <p className={msg.isSystem ? '' : 'leading-snug'}>{msg.body}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Scope toggle */}
      <div className="px-4 pt-3 flex gap-1 flex-shrink-0">
        {(['patient', 'caregiver', 'both'] as Scope[]).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
              scope === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Quick chips */}
      <div className="px-4 pt-2 flex gap-1.5 flex-wrap flex-shrink-0">
        {QUICK_CHIPS[scope].map((chip) => (
          <button
            key={chip}
            onClick={() => setBody(chip)}
            className="px-2.5 py-1 text-xs border border-border rounded-full text-muted-foreground hover:bg-muted transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card flex items-end gap-2 flex-shrink-0">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={send}
          disabled={!body.trim() || sending}
          className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 transition-opacity"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
