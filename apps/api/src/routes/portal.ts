import { pool } from '../config/database.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireStaff } from '../middleware/authorize.js';
import { createPortalRouter } from './portal-router.js';

export default createPortalRouter(pool,[authenticate,requireStaff('admin','midwife','nurse','receptionist')],requireStaff('admin'));
