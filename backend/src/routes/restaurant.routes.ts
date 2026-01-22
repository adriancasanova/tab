import { Router } from 'express';
import { RestaurantController } from '../controllers/restaurant.controller';

const router = Router();
const controller = new RestaurantController();

// GET /api/v1/restaurants/:slug - Get restaurant by slug
router.get('/:slug', controller.getBySlug);

// POST /api/v1/restaurants - Create restaurant
router.post('/', controller.create);

// GET /api/v1/restaurants/:id/menu - Get full menu
router.get('/:id/menu', controller.getMenu);

// GET /api/v1/restaurants/:id/active-sessions - Get active sessions (admin)
router.get('/:id/active-sessions', controller.getActiveSessions);

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

export default router;
