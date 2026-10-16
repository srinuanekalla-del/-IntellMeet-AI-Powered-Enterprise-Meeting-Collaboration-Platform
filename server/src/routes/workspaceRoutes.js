import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as w from '../controllers/workspaceController.js';

const router = Router();
router.use(protect);

router.route('/projects').get(w.listProjects).post(w.createProject);
router.get('/projects/:projectId', w.getProject);
router.post('/projects/:projectId/members', w.addMember);
router.route('/projects/:projectId/tasks').get(w.listTasks).post(w.createTask);

router.post('/tasks/from-action-item', w.createTaskFromActionItem);
router.route('/tasks/:id').patch(w.updateTask).delete(w.deleteTask);


export default router;
