import { Request, Response, NextFunction } from 'express';
export declare class SessionController {
    getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    addConsumer(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    getTotals(req: Request, res: Response, next: NextFunction): Promise<void>;
    addOrderItems(req: Request, res: Response, next: NextFunction): Promise<void>;
    createServiceCall(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=session.controller.d.ts.map