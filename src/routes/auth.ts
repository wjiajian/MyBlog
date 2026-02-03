import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { generateToken } from '../middleware/auth.js';

const router = Router();

// 从环境变量读取管理员凭据（按请求读取，避免 dotenv 初始化顺序问题）
const getAdminCredentials = () => ({
  username: process.env.ADMIN_USERNAME || 'admin',
  passwordHash: process.env.ADMIN_PASSWORD_HASH || '',
  devPassword: process.env.ADMIN_PASSWORD || 'admin123',
});

/**
 * POST /api/auth/login
 * 管理员登录
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  const { username: adminUsername, passwordHash, devPassword } = getAdminCredentials();

  // 验证用户名
  if (username !== adminUsername) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  // 验证密码
  // 如果未设置密码哈希，使用明文密码（仅供开发测试）
  let isValidPassword = false;
  
  if (passwordHash) {
    isValidPassword = await bcrypt.compare(password, passwordHash);
  } else {
    // 开发模式：允许使用默认密码 "admin123"
    isValidPassword = password === devPassword;
  }

  if (!isValidPassword) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  // 生成 token
  const token = generateToken(username);
  res.json({ success: true, token });
});

/**
 * POST /api/auth/verify
 * 验证 token 有效性
 */
router.post('/verify', (req: Request, res: Response): void => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ valid: false, error: '未提供令牌' });
    return;
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded !== 'object' || decoded === null || !('username' in decoded)) {
      res.json({ valid: false, error: '令牌无效或已过期' });
      return;
    }
    const username = (decoded as JwtPayload).username;
    if (typeof username !== 'string') {
      res.json({ valid: false, error: '令牌无效或已过期' });
      return;
    }
    res.json({ valid: true, username });
  } catch (error) {
    res.json({ valid: false, error: '令牌无效或已过期' });
  }
});

export default router;
