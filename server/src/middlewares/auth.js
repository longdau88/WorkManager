import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma, isPrismaConnected, readFallbackData } from '../config/db.js';

/**
 * Authentication Middleware
 * Decodes JWT from Authorization header: "Bearer <token>"
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.',
        errors: null
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch (jwtErr) {
      return res.status(401).json({
        status: 'error',
        message: 'Mã xác thực không hợp lệ hoặc đã hết hạn.',
        errors: null
      });
    }

    let user = null;
    if (isPrismaConnected && prisma) {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          role: true,
          projectPermissions: true
        }
      });
    } else {
      const data = readFallbackData();
      const u = (data.users || []).find(x => x.id === decoded.userId);
      if (u) {
        const r = (data.roles || []).find(x => x.id === u.roleId);
        const pp = (data.projectPermissions || []).filter(x => x.userId === u.id);
        user = { ...u, role: r, projectPermissions: pp };
      }
    }

    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Tài khoản không tồn tại hoặc đã bị khóa.',
        errors: null
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName || user.username,
      roleId: user.roleId,
      roleName: user.role?.name || 'viewer',
      roleDisplayName: user.role?.displayName || 'Người xem',
      permissions: Array.isArray(user.role?.permissions) ? user.role.permissions : [],
      isAdmin: user.role?.name === 'admin' || (user.role?.permissions || []).includes('edit_all_projects'),
      projectPermissions: user.projectPermissions || []
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Require System-level Permission
 * Admin with 'edit_all_projects' or 'manage_roles' automatically bypasses
 */
export function requirePermission(permissionName) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Yêu cầu đăng nhập.',
        errors: null
      });
    }

    if (req.user.isAdmin || req.user.permissions.includes(permissionName)) {
      return next();
    }

    return res.status(403).json({
      status: 'error',
      message: `Bạn không có quyền thực hiện thao tác này (${permissionName}).`,
      errors: null
    });
  };
}

/**
 * Require Project-level Access Level: 'owner' | 'editor' | 'viewer'
 */
export function requireProjectAccess(minLevel = 'viewer') {
  const levels = { viewer: 1, editor: 2, owner: 3 };

  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Yêu cầu đăng nhập.' });
    }

    // Admins always have owner access
    if (req.user.isAdmin) {
      req.projectAccess = 'owner';
      return next();
    }

    const projectId = req.params.projectId || req.params.id || req.body.projectId;
    if (!projectId || projectId === 'all') {
      return next();
    }

    const perm = req.user.projectPermissions.find(p => p.projectId === projectId);
    const userLevel = perm ? levels[perm.access] || 0 : 0;
    const requiredLevel = levels[minLevel] || 1;

    if (userLevel >= requiredLevel) {
      req.projectAccess = perm.access;
      return next();
    }

    return res.status(403).json({
      status: 'error',
      message: `Bạn không có quyền truy cập dự án này (yêu cầu quyền tối thiểu: ${minLevel}).`
    });
  };
}
