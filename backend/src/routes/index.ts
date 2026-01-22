import { Router } from 'express';
import restaurantRoutes from './restaurant.routes';
import productRoutes from './product.routes';
import tableRoutes from './table.routes';
import sessionRoutes from './session.routes';
import orderRoutes from './order.routes';
import serviceCallRoutes from './service-call.routes';

const router = Router();

router.use('/restaurants', restaurantRoutes);
router.use('/products', productRoutes);
router.use('/tables', tableRoutes);
router.use('/sessions', sessionRoutes);
router.use('/orders', orderRoutes);
router.use('/service-calls', serviceCallRoutes);

export default router;
