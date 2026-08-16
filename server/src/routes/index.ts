import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/task.controller';
import { subscribe, unsubscribe, getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { getProjects, getProjectById, createProject, updateProject, deleteProject } from '../controllers/project.controller';
import { saveFocusSession, getFocusAnalytics } from '../controllers/focus.controller';
import { getActivities } from '../controllers/activity.controller';
import { globalSearch } from '../controllers/search.controller';
import { getProfile, updateProfile, updatePassword, updateAvatar, deleteAccount } from '../controllers/user.controller';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);

router.get('/tasks', authenticate, getTasks);
router.post('/tasks', authenticate, createTask);
router.patch('/tasks/:id', authenticate, updateTask);
router.delete('/tasks/:id', authenticate, deleteTask);

router.post('/notifications/subscribe', authenticate, subscribe);
router.delete('/notifications/subscribe', authenticate, unsubscribe);
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:id/read', authenticate, markAsRead);
router.patch('/notifications/read-all', authenticate, markAllAsRead);

router.get('/notification-settings', authenticate, getSettings);
router.patch('/notification-settings', authenticate, updateSettings);

router.get('/projects', authenticate, getProjects);
router.get('/projects/:id', authenticate, getProjectById);
router.post('/projects', authenticate, createProject);
router.patch('/projects/:id', authenticate, updateProject);
router.delete('/projects/:id', authenticate, deleteProject);

router.post('/focus-sessions', authenticate, saveFocusSession);
router.get('/focus-sessions/stats', authenticate, getFocusAnalytics);
router.get('/activity', authenticate, getActivities);

router.get('/search', authenticate, globalSearch);

router.get('/user/profile', authenticate, getProfile);
router.patch('/user/profile', authenticate, updateProfile);
router.patch('/user/password', authenticate, updatePassword);
router.patch('/user/avatar', authenticate, updateAvatar);
router.delete('/user/account', authenticate, deleteAccount);

export default router;
