import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler';
import { config } from '../config/env';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    status: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log('🔐 authenticateToken middleware called');
    console.log('  Path:', req.path);
    console.log('  Method:', req.method);
    
    const authHeader = req.headers['authorization'];
    console.log('  Auth header:', authHeader ? 'Present' : 'Missing');
    
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('  ❌ No token found');
      throw new AppError('Authentication token required', 401);
    }

    console.log('  ✅ Token found, verifying...');
    const decoded = jwt.verify(token, config.jwtSecret || 'your-secret-key') as any;
    console.log('  ✅ Token verified, user ID:', decoded.id);
    
    // Check if user still exists and get latest status
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      console.log('  ❌ User not found in database');
      throw new AppError('User not found or deactivated', 401);
    }

    console.log('  ✅ User found:', user.email);
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    };

    console.log('  ✅ Auth successful, proceeding to next middleware');
    next();
  } catch (error) {
    console.error('  ❌ Auth error:', error);
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

export const requireActiveSubscription = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Auth required', 401));
  }

  if (req.user.status === 'INACTIVE') {
    return next(new AppError('Su cuenta está inactiva. Por favor, contacte a soporte para renovar su suscripción.', 403));
  }

  next();
};

export const requireFullAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Auth required', 401));
  }

  if (req.user.status !== 'ACTIVE') {
    return next(new AppError('Esta función requiere una suscripción activa (Prueba terminada).', 403));
  }

  next();
};
