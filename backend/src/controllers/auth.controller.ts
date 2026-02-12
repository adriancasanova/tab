import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AppError } from '../middleware/error-handler';
import { config } from '../config/env';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('📝 register called');
      console.log('  Request body:', req.body);
      
      const { email, password, firstName, lastName, businessName, phone } = req.body;

      console.log('  Checking if email exists:', email);
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        console.log('  ❌ Email already registered');
        throw new AppError('Email already registered', 400);
      }

      console.log('  ✅ Email available, hashing password...');
      const passwordHash = await bcrypt.hash(password, 12);
      
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + (parseInt(process.env.TRIAL_PERIOD_DAYS || '15')));

      console.log('  Creating user...');
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          businessName,
          phone,
          status: 'TRIAL',
          trialEndsAt
        }
      });

      console.log('  ✅ User created:', user.id);
      console.log('  Generating JWT token...');
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtSecret || 'your-secret-key',
        { expiresIn: '7d' }
      );

      console.log('  🎉 Registration successful!');
      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            businessName: user.businessName,
            status: user.status,
            restaurantSlug: null
          }
        }
      });
    } catch (error) {
      console.error('  ❌ Registration error:', error);
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ 
        where: { email },
        include: { restaurants: { take: 1 } }
      });

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        throw new AppError('Invalid credentials', 401);
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtSecret || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            businessName: user.businessName,
            status: user.status,
            restaurantSlug: user.restaurants[0]?.slug
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: any, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { restaurants: { take: 1 } }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          businessName: user.businessName,
          status: user.status,
          role: user.role,
          trialEndsAt: user.trialEndsAt,
          restaurantSlug: user.restaurants[0]?.slug
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async createRestaurant(req: any, res: Response, next: NextFunction) {
    try {
      console.log('🔍 createRestaurant called');
      console.log('  Request body:', req.body);
      console.log('  User from token:', req.user);
      
      const { name, slug } = req.body;
      const userId = req.user.id;

      console.log('  Checking if slug exists:', slug);
      const existing = await prisma.restaurant.findUnique({ where: { slug } });
      if (existing) {
        console.log('  ❌ Slug already taken');
        throw new AppError('Slug is already taken', 400);
      }

      console.log('  Creating restaurant...');
      const restaurant = await prisma.restaurant.create({
        data: {
          name,
          slug,
          ownerId: userId
        }
      });

      console.log('  ✅ Restaurant created:', restaurant.id);
      console.log('  Creating categories...');
      
      // Create default categories for the new restaurant
      const defaultCategories = [
        { name: 'Entradas', displayOrder: 1, imageUrl: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=800&q=80' },
        { name: 'Comida', displayOrder: 2, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80' },
        { name: 'Bebidas', displayOrder: 3, imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80' },
        { name: 'Postres', displayOrder: 4, imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80' },
      ];

      await Promise.all(
        defaultCategories.map(cat =>
          prisma.category.create({
            data: {
              restaurantId: restaurant.id,
              name: cat.name,
              displayOrder: cat.displayOrder,
              imageUrl: cat.imageUrl,
            },
          })
        )
      );

      console.log('  ✅ Categories created');
      console.log('  Creating tables...');

      // Create default tables (1-10)
      await Promise.all(
        Array.from({ length: 10 }, (_, i) => i + 1).map(num =>
          prisma.table.create({
            data: {
              restaurantId: restaurant.id,
              number: String(num),
              isEnabled: true,
            },
          })
        )
      );

      console.log('  ✅ Tables created');
      console.log('  🎉 Restaurant setup complete!');

      res.status(201).json({ success: true, data: restaurant });
    } catch (error) {
      console.error('  ❌ Error in createRestaurant:', error);
      next(error);
    }
  }
}
