import { app, BrowserWindow, Notification } from 'electron';

import {
  normalizeNotificationSettings,
  type NotificationSettings,
} from '../../shared/notifications/constants';
import { t } from '../i18n';

interface PendingCompletionNotification {
  sessionId: string;
  title: string;
  completedAt: number;
}

interface TaskCompletionNotifierOptions {
  getWindow: () => BrowserWindow | null;
  getNotificationSettings: () => Partial<NotificationSettings> | undefined;
  getSessionTitle: (sessionId: string) => string | null;
  focusMainWindow: (reason: string) => void;
  openSession: (sessionId: string) => void;
  updateTrayReminder: (count: number, onClick?: () => void) => void;
}

export class TaskCompletionNotifier {
  private pendingCompletions = new Map<string, PendingCompletionNotification>();

  constructor(private readonly options: TaskCompletionNotifierOptions) {}

  handleComplete(sessionId: string): void {
    const settings = normalizeNotificationSettings(this.options.getNotificationSettings());
    if (!settings.taskCompletionNotificationsEnabled) {
      console.debug(`[TaskCompletionNotifier] skipped completed session ${sessionId} because notifications are disabled`);
      return;
    }

    if (this.pendingCompletions.has(sessionId)) {
      console.debug(`[TaskCompletionNotifier] ignored duplicate completed session notification for ${sessionId}`);
      return;
    }

    const win = this.options.getWindow();
    if (this.isWindowForeground(win)) {
      console.debug(`[TaskCompletionNotifier] skipped completed session ${sessionId} because the app is foreground`);
      return;
    }

    const title = this.options.getSessionTitle(sessionId) || t('coworkDefaultSessionTitle');
    this.pendingCompletions.set(sessionId, {
      sessionId,
      title,
      completedAt: Date.now(),
    });
    console.log(
      `[TaskCompletionNotifier] recorded completed session notification for ${sessionId}; pending count ${this.pendingCompletions.size}`,
    );

    this.updateAttentionState();
    this.showSystemNotification(sessionId, title);
  }

  markSessionViewed(sessionId: string): void {
    if (!this.pendingCompletions.delete(sessionId)) return;
    console.log(
      `[TaskCompletionNotifier] cleared completed session notification for ${sessionId}; pending count ${this.pendingCompletions.size}`,
    );
    this.updateAttentionState();
  }

  handleSessionDeleted(sessionId: string): void {
    if (!this.pendingCompletions.delete(sessionId)) return;
    console.log(
      `[TaskCompletionNotifier] removed completed session notification for deleted session ${sessionId}; pending count ${this.pendingCompletions.size}`,
    );
    this.updateAttentionState();
  }

  clearAll(reason: string): void {
    if (this.pendingCompletions.size === 0) return;
    const count = this.pendingCompletions.size;
    this.pendingCompletions.clear();
    console.log(`[TaskCompletionNotifier] cleared ${count} completed session notifications after ${reason}`);
    this.updateAttentionState();
  }

  private isWindowForeground(win: BrowserWindow | null): boolean {
    return !!win && !win.isDestroyed() && win.isVisible() && !win.isMinimized() && win.isFocused();
  }

  private showSystemNotification(sessionId: string, title: string): void {
    if (!Notification.isSupported()) {
      console.warn('[TaskCompletionNotifier] system notifications are not supported on this platform');
      return;
    }

    try {
      const notification = new Notification({
        title: t('taskCompletionNotificationTitle'),
        body: t('taskCompletionNotificationBody', { title }),
      });
      notification.on('click', () => {
        console.log(`[TaskCompletionNotifier] system notification clicked for session ${sessionId}`);
        this.openPendingSession(sessionId);
      });
      notification.show();
    } catch (error) {
      console.warn(`[TaskCompletionNotifier] failed to show system notification for session ${sessionId}:`, error);
    }
  }

  private updateAttentionState(): void {
    const count = this.pendingCompletions.size;
    this.updateDockBadge(count);
    this.updateWindowsAttention(count);
    this.options.updateTrayReminder(
      count,
      count > 0 ? () => this.openPendingSession(this.getMostRecentPendingSessionId()) : undefined,
    );
  }

  private updateDockBadge(count: number): void {
    if (process.platform !== 'darwin' || !app.dock) return;
    try {
      app.dock.setBadge(count > 0 ? String(count) : '');
    } catch (error) {
      console.warn('[TaskCompletionNotifier] failed to update dock badge:', error);
    }
  }

  private updateWindowsAttention(count: number): void {
    if (process.platform !== 'win32') return;
    const win = this.options.getWindow();
    if (!win || win.isDestroyed()) return;
    try {
      win.flashFrame(count > 0);
    } catch (error) {
      console.warn('[TaskCompletionNotifier] failed to update Windows taskbar attention state:', error);
    }
  }

  private getMostRecentPendingSessionId(): string {
    let latest: PendingCompletionNotification | null = null;
    for (const notification of this.pendingCompletions.values()) {
      if (!latest || notification.completedAt > latest.completedAt) {
        latest = notification;
      }
    }
    return latest?.sessionId ?? '';
  }

  private openPendingSession(sessionId: string): void {
    if (!sessionId) return;
    this.options.focusMainWindow('task completion notification');
    this.options.openSession(sessionId);
  }
}
