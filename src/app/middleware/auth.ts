
// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
// import mongoose from 'mongoose';

// const getUserModel = () => mongoose.models.User || require('../modules/user/user.model').default;
// const isObjectId = (id: any) => {
//   try { return mongoose.Types.ObjectId.isValid(String(id)); } catch { return false; }
// };

// export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
//   const raw = (req.headers.authorization || '').trim();
//   if (!raw) return next();
//   if (!raw.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Authorization header malformed' });

//   const token = raw.replace(/^Bearer\s+/i, '').trim();
//   if (!token) return res.status(401).json({ success: false, message: 'Token missing' });

//   // choose access token secret first, then legacy JWT_SECRET
//   const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'changeme';

//   try {
//     const payload: any = jwt.verify(token, secret);
//     const userId = payload.id || payload.sub || payload.userId || payload._id;
//     if (!userId) return res.status(401).json({ success: false, message: 'Token contains no user id' });

//     const UserModel = getUserModel();
//     let user: any = await UserModel.findOne({ id: userId }).select('-password_hash -__v').lean().exec();
//     if (!user && isObjectId(userId)) user = await UserModel.findById(userId).select('-password_hash -__v').lean().exec();
//     if (!user) return res.status(401).json({ success: false, message: 'User not found for token' });
//     if (user.is_active === false) return res.status(403).json({ success: false, message: 'User is disabled' });

//     req.user = {
//       id: user.id ?? String(user._id),
//       email: user.email,
//       role: user.role,
//       full_name: user.full_name,
//       company_name: user.company_name,
//       phone: user.phone,
//     } as any;

//     return next();
//   } catch (err: any) {
//     console.warn('AUTH verify failed:', err?.message || err);
//     if (err && (err.name === 'TokenExpiredError' || err.message?.includes('jwt expired'))) {
//       return res.status(401).json({ success: false, message: 'Token expired' });
//     }
//     if (err && (err.name === 'JsonWebTokenError' || err.message?.includes('invalid signature'))) {
//       return res.status(401).json({ success: false, message: 'Invalid token signature' });
//     }
//     return res.status(401).json({ success: false, message: 'Invalid token' });
//   }
// };

// export const authorize = (allowed: string | string[]) => {
//   const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];
//   return (req: Request, res: Response, next: NextFunction) => {
//     const user: any = (req as any).user;
//     if (!user || !user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });
//     if (!allowedRoles.includes(user.role)) return res.status(403).json({ success: false, message: 'Not authorized' });
//     return next();
//   };
// };

// export default authenticate;
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const getUserModel = () => mongoose.models.User || require('../modules/user/user.model').default;
const isObjectId = (id: any) => {
  try { return mongoose.Types.ObjectId.isValid(String(id)); } catch { return false; }
};

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const rawHeader = String(req.headers.authorization || '').trim();
  if (!rawHeader) return next(); // allow public routes

  // case-insensitive check for "Bearer "
  if (!rawHeader.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization header malformed' });
  }

  const token = rawHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ success: false, message: 'Token missing' });

  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'changeme';

  try {
    const payload: any = jwt.verify(token, secret);
    const userId = payload.id || payload.sub || payload.userId || payload._id;
    if (!userId) return res.status(401).json({ success: false, message: 'Token contains no user id' });

    const UserModel = getUserModel();
    let user: any = await UserModel.findOne({ id: userId }).select('-password_hash -__v').lean().exec();
    if (!user && isObjectId(userId)) {
      user = await UserModel.findById(userId).select('-password_hash -__v').lean().exec();
    }
    if (!user) return res.status(401).json({ success: false, message: 'User not found for token' });
    if (user.is_active === false) return res.status(403).json({ success: false, message: 'User is disabled' });

    (req as any).user = {
      id: user.id ?? String(user._id),
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      company_name: user.company_name,
      phone: user.phone,
    };

    return next();
  } catch (err: any) {
    console.warn('AUTH verify failed:', err?.message || err);
    if (err && (err.name === 'TokenExpiredError' || err.message?.includes('jwt expired'))) {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    if (err && (err.name === 'JsonWebTokenError' || err.message?.includes('invalid signature'))) {
      return res.status(401).json({ success: false, message: 'Invalid token signature' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const authorize = (allowed: string | string[]) => {
  const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];
  return (req: Request, res: Response, next: NextFunction) => {
    const user: any = (req as any).user;
    if (!user || !user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!allowedRoles.includes(user.role)) return res.status(403).json({ success: false, message: 'Not authorized' });
    return next();
  };
};

export default authenticate;