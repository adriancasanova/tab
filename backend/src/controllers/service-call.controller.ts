import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/error-handler';

export class ServiceCallController {
    async resolve(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const serviceCall = await prisma.serviceCall.update({
                where: { id: id as string },
                data: {
                    status: 'RESOLVED',
                    resolvedAt: new Date(),
                },
            });

            res.json({ success: true, data: serviceCall });
        } catch (error) {
            next(error);
        }
    }
}
