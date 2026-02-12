import { Request, Response, NextFunction } from 'express';
export declare class RestaurantController {
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    getBySlug(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMenu(req: Request, res: Response, next: NextFunction): Promise<void>;
    getActiveSessions(req: Request, res: Response, next: NextFunction): Promise<void>;
    getNotifications(req: Request, res: Response, next: NextFunction): Promise<void>;
    createProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    createTable(req: Request, res: Response, next: NextFunction): Promise<void>;
    createMultipleTables(req: Request, res: Response, next: NextFunction): Promise<void>;
    createCategory(req: Request, res: Response, next: NextFunction): Promise<void>;
    createServiceCall(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=restaurant.controller.d.ts.map