import { Router } from 'express';
import { RestaurantController } from '../controllers/restaurant.controller';
import { authenticateToken, requireActiveSubscription } from '../middleware/auth.middleware';

const router = Router();
const controller = new RestaurantController();

// PUBLIC routes (for customers)
router.get('/:slug', controller.getBySlug);
router.get('/:id/menu', controller.getMenu);
router.post('/:id/service-calls', controller.createServiceCall);

// PROTECTED Admin routes
router.use(authenticateToken);
router.use(requireActiveSubscription);

// GET /api/v1/restaurants/:id/active-sessions - Get active sessions (admin)
router.get('/:id/active-sessions', controller.getActiveSessions);

// GET /api/v1/restaurants/:id/sessions?from=&to= - Get sessions by date range (admin)
router.get('/:id/sessions', controller.getSessionsByDate);

// GET /api/v1/restaurants/:id/notifications - Get pending notifications (admin)
router.get('/:id/notifications', controller.getNotifications);

// POST /api/v1/restaurants/:id/products - Create product
router.post('/:id/products', controller.createProduct);

// POST /api/v1/restaurants/:id/tables - Create single table
router.post('/:id/tables', controller.createTable);

// POST /api/v1/restaurants/:id/tables/batch - Create multiple tables
router.post('/:id/tables/batch', controller.createMultipleTables);

// POST /api/v1/restaurants/:id/categories - Create category
router.post('/:id/categories', controller.createCategory);

// POST /api/v1/restaurants - Create restaurant (though usually done via auth/register)
router.post('/', controller.create);

export default router;
