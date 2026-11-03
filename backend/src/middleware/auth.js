import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { db } from '../services/db.js';

const handleAuth = (portal) => {
  return (req, res, next) => {
    try {
      let token = null;

      // 1. Check Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }

      // 2. Check portal-specific headers if available
      if (!token && portal) {
        const portalHeader = req.headers[`x-${portal.toLowerCase()}-token`];
        if (portalHeader) token = portalHeader;
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          message: `Authentication required${portal ? ` for ${portal} portal` : ''}. Missing token.`
        });
      }

      const decoded = jwt.verify(token, config.jwtSecret);

      const user = db.users.findUnique({ where: { id: decoded.userId } });
      if (!user) {
        return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
      }

      if (user.status === 'SUSPENDED') {
        return res.status(403).json({ success: false, message: 'Your account has been suspended by administration.' });
      }

      // Portal isolation check
      if (portal && decoded.portal && decoded.portal !== portal) {
        const isUserAdmin = ['ADMIN', 'SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(decoded.portal);
        if (!(portal === 'ADMIN' && isUserAdmin)) {
          return res.status(403).json({
            success: false,
            message: `Forbidden: This session belongs to ${decoded.portal} portal and cannot access ${portal} portal.`
          });
        }
      }

      // Session revocation check if sessionId is present
      if (decoded.sessionId) {
        const session = db.sessions.findUnique({ where: { id: decoded.sessionId } });
        if (!session || !session.isActive) {
          return res.status(401).json({ success: false, message: 'Session has expired or was logged out.' });
        }
      }

      req.user = user;
      req.tokenPortal = decoded.portal;
      req.sessionId = decoded.sessionId;
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session token.', error: err.message });
    }
  };
};

export const requireAuth = (portalOrReq = null) => {
  if (portalOrReq && portalOrReq.headers) {
    return handleAuth(null)(portalOrReq, arguments[1], arguments[2]);
  }
  return handleAuth(typeof portalOrReq === 'string' ? portalOrReq : null);
};

export const requireRole = (allowedRoles = [], portal = null) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const normalizedUserRole = req.user.role === 'CUSTOMER' ? 'RIDER' : req.user.role;
    const normalizedAllowed = allowedRoles.map(r => r === 'CUSTOMER' ? 'RIDER' : r);

    const isAdminUser = ['ADMIN', 'SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(req.user.role);
    const allowAnyAdmin = normalizedAllowed.includes('ADMIN') && isAdminUser;

    if (!normalizedAllowed.includes(normalizedUserRole) && !allowAnyAdmin) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Your role is ${req.user.role}.`
      });
    }

    if (portal && req.tokenPortal && req.tokenPortal !== portal) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Cross-portal access denied. Token issued for ${req.tokenPortal}, requested ${portal}.`
      });
    }

    next();
  };
};
