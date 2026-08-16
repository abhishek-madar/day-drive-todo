import { Worker, Job } from 'bullmq';
import { config } from '../config';
import prisma from '../prisma';
import { sendPushNotification } from '../notifications/push';

const connection = {
  url: config.redisUrl
};

export const taskWorker = new Worker('task-queue', async (job: Job) => {
  if (job.name === 'check-deadlines') {
    const now = new Date();

    const overdueTasks = await prisma.task.findMany({
      where: {
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: { lte: now },
      },
      include: { user: { include: { pushSubscriptions: true } } }
    });

    for (const task of overdueTasks) {
      
      await prisma.task.update({
        where: { id: task.id },
        data: { status: 'OVERDUE', lastNotificationAt: now }
      });

      const notification = await prisma.notification.create({
        data: {
          type: 'TASK_OVERDUE',
          title: 'Task Overdue',
          body: `"${task.title}" is still incomplete.`,
          userId: task.userId,
          taskId: task.id
        }
      });

      if (task.user.enableBrowserNotifications && task.user.enableOverdueNotifications) {
        for (const sub of task.user.pushSubscriptions) {
          const success = await sendPushNotification(sub, {
            title: notification.title,
            body: notification.body,
            url: `/?task=${task.id}`
          });
          if (!success) {
            
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        }
      }
    }

    const reminderTasks = await prisma.task.findMany({
      where: {
        status: { in: ['TODO', 'IN_PROGRESS'] },
        reminderAt: { lte: now },
        lastNotificationAt: null 
      },
      include: { user: { include: { pushSubscriptions: true } } }
    });

    for (const task of reminderTasks) {
      await prisma.task.update({
        where: { id: task.id },
        data: { lastNotificationAt: now }
      });

      const notification = await prisma.notification.create({
        data: {
          type: 'TASK_REMINDER',
          title: 'Task Reminder',
          body: `"${task.title}" is due soon.`,
          userId: task.userId,
          taskId: task.id
        }
      });

      if (task.user.enableBrowserNotifications && task.user.enableDeadlineReminders) {
        for (const sub of task.user.pushSubscriptions) {
          const success = await sendPushNotification(sub, {
            title: notification.title,
            body: notification.body,
            url: `/?task=${task.id}`
          });
          if (!success) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        }
      }
    }

    const repeatedOverdueTasks = await prisma.task.findMany({
      where: {
        status: 'OVERDUE',
        user: { repeatedOverdueIntervalHr: { not: null } }
      },
      include: { user: { include: { pushSubscriptions: true } } }
    });

    for (const task of repeatedOverdueTasks) {
      if (task.lastNotificationAt && task.user.repeatedOverdueIntervalHr) {
        const intervalMs = task.user.repeatedOverdueIntervalHr * 60 * 60 * 1000;
        const timeSinceLast = now.getTime() - task.lastNotificationAt.getTime();
        
        if (timeSinceLast >= intervalMs) {
          await prisma.task.update({
            where: { id: task.id },
            data: { lastNotificationAt: now }
          });

          const notification = await prisma.notification.create({
            data: {
              type: 'TASK_OVERDUE',
              title: 'Task Still Overdue',
              body: `Reminder: "${task.title}" is overdue.`,
              userId: task.userId,
              taskId: task.id
            }
          });

          if (task.user.enableBrowserNotifications && task.user.enableOverdueNotifications) {
            for (const sub of task.user.pushSubscriptions) {
              const success = await sendPushNotification(sub, {
                title: notification.title,
                body: notification.body,
                url: `/?task=${task.id}`
              });
              if (!success) {
                await prisma.pushSubscription.delete({ where: { id: sub.id } });
              }
            }
          }
        }
      }
    }
  }
}, { connection });
