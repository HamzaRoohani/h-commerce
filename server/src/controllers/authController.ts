import type { Request, Response } from 'express';
import { User, type UserDoc } from '../models/User.js';
import { ApiError } from '../middleware/errorHandler.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { comparePassword, hashPassword } from '../utils/hashPassword.js';
import { generateToken, hashToken } from '../utils/hashToken.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { clearRefreshCookie, REFRESH_COOKIE_NAME, setRefreshCookie } from '../utils/authCookies.js';
import { durationToMs } from '../utils/duration.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/emailService.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.js';

const VERIFY_TOKEN_TTL_MS = durationToMs('24h');
const RESET_TOKEN_TTL_MS = durationToMs('1h');

function toPublicUser(user: UserDoc) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };
}

async function issueSession(res: Response, user: UserDoc) {
  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ sub: user._id.toString() });

  await User.updateOne({ _id: user._id }, { refreshTokenHash: hashToken(refreshToken) });
  setRefreshCookie(res, refreshToken);

  return accessToken;
}

export async function register(req: Request, res: Response) {
  const body = registerSchema.parse(req.body);

  const existing = await User.findOne({ email: body.email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(body.password);
  const { token: verifyToken, hash: verifyTokenHash } = generateToken();

  const user = await User.create({
    name: body.name,
    email: body.email,
    passwordHash,
    isVerified: false,
    verifyTokenHash,
    verifyTokenExpires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
  });

  await sendVerificationEmail(user.email, verifyToken);

  const accessToken = await issueSession(res, user);
  res.status(201).json({ accessToken, user: toPublicUser(user) });
}

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);

  const user = await User.findOne({ email: body.email }).select('+passwordHash');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const valid = await comparePassword(body.password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const accessToken = await issueSession(res, user);
  res.json({ accessToken, user: toPublicUser(user) });
}

export async function refresh(req: Request, res: Response) {
  const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!cookieToken) {
    throw new ApiError(401, 'Not authenticated');
  }

  let userId: string;
  try {
    userId = verifyRefreshToken(cookieToken).sub;
  } catch {
    clearRefreshCookie(res);
    throw new ApiError(401, 'Invalid or expired session');
  }

  const user = await User.findById(userId).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash || user.refreshTokenHash !== hashToken(cookieToken)) {
    // Presented token doesn't match the current hash: either already
    // rotated out or stolen. Revoke the whole session family either way.
    if (user) await User.updateOne({ _id: user._id }, { refreshTokenHash: null });
    clearRefreshCookie(res);
    throw new ApiError(401, 'Session revoked — please log in again');
  }

  const accessToken = await issueSession(res, user);
  res.json({ accessToken, user: toPublicUser(user) });
}

export async function logout(req: Request, res: Response) {
  const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (cookieToken) {
    try {
      const { sub } = verifyRefreshToken(cookieToken);
      await User.updateOne({ _id: sub }, { refreshTokenHash: null });
    } catch {
      // Token already invalid/expired — nothing to revoke.
    }
  }
  clearRefreshCookie(res);
  res.status(204).send();
}

export async function verifyEmail(req: Request, res: Response) {
  const { token } = verifyEmailSchema.parse(req.body);
  const tokenHash = hashToken(token);

  const user = await User.findOne({
    verifyTokenHash: tokenHash,
    verifyTokenExpires: { $gt: new Date() },
  }).select('+verifyTokenHash +verifyTokenExpires');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired verification link');
  }

  user.isVerified = true;
  user.verifyTokenHash = null;
  user.verifyTokenExpires = null;
  await user.save();

  res.json({ user: toPublicUser(user) });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = forgotPasswordSchema.parse(req.body);

  const user = await User.findOne({ email });
  if (user) {
    const { token: resetToken, hash: resetTokenHash } = generateToken();
    user.resetTokenHash = resetTokenHash;
    user.resetTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();
    await sendPasswordResetEmail(user.email, resetToken);
  }

  // Always 200 — never reveal whether the email is registered.
  res.json({ message: 'If that email is registered, a reset link has been sent.' });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = resetPasswordSchema.parse(req.body);
  const tokenHash = hashToken(token);

  const user = await User.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpires: { $gt: new Date() },
  }).select('+resetTokenHash +resetTokenExpires');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset link');
  }

  user.passwordHash = await hashPassword(password);
  user.resetTokenHash = null;
  user.resetTokenExpires = null;
  // Force re-login everywhere — a password reset should kill existing sessions.
  user.refreshTokenHash = null;
  await user.save();

  res.json({ message: 'Password reset. Please log in with your new password.' });
}

export async function me(req: Request, res: Response) {
  const user = await User.findById((req as AuthedRequest).user.id);
  if (!user) {
    throw new ApiError(401, 'Not authenticated');
  }
  res.json({ user: toPublicUser(user) });
}
