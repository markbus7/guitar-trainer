import { create } from 'zustand';
import { Icon, type IconName } from './components/Icon';

export interface Toast {
  id: number;
  title: string;
  body?: string;
  icon?: IconName;
  tone?: 'achievement' | 'info' | 'warn';
}

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToasts = create<ToastStore>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = nextId++;
    set({ toasts: [...get().toasts, { ...t, id }].slice(-4) });
    setTimeout(() => get().dismiss(id), t.tone === 'achievement' ? 5200 : 3800);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((x) => x.id !== id) }),
}));

export function toast(t: Omit<Toast, 'id'>) {
  useToasts.getState().push(t);
}

export function Toasts() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <button key={t.id} className={`toast toast-${t.tone ?? 'info'}`} onClick={() => dismiss(t.id)}>
          <span className="toast-icon">
            <Icon name={t.icon ?? (t.tone === 'achievement' ? 'trophy' : 'info')} />
          </span>
          <span>
            <strong>{t.title}</strong>
            {t.body && <span className="toast-body">{t.body}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
