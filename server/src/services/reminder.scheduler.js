import cron from 'node-cron';
import { env } from '../config/env.js';
import { notificationService } from './notification.service.js';
import { realtimeService } from './realtime.service.js';
import { backupService } from './backup.service.js';

let job;
export function startReminderScheduler() {
    if (!env.schedulerEnabled || job) return;
    job = cron.schedule(env.schedulerCron, () => notificationService.run().catch(error => console.error('[Reminder]', error)), { timezone: env.timezone });
    cron.schedule(env.backupCron, () => backupService.create({ email: 'scheduler@workmanager.local' }).catch(error => console.error('[Backup]', error)), { timezone: env.timezone });
    notificationService.run().catch(error => console.error('[Reminder]', error));
    setInterval(() => realtimeService.heartbeat(), 30000);
}