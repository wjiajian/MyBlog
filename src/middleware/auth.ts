import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 扩展 Express Request 类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: { username: string };
    }
  }
}

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'fallback-secret-change-in-production';
};

/**
 * JWT 认证中间件
 * 验证请求头中的 Bearer token
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { username: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: '无效或过期的令牌' });
  }
};

/**
 * 生成 JWT token
 */
export const generateToken = (username: string): string => {
  return jwt.sign({ username }, getJwtSecret(), { expiresIn: '7d' });
};
