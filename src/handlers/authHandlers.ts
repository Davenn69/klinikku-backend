import { and, eq, gt } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";
import { db } from "../db";
import { refreshTokens, users } from "../db/schema";
import CustomError from "../types/error";
import {
  generateRefreshToken,
  getRefreshTokenExpiryDate,
  hashPassword,
  hashRefreshToken,
  signAccessToken,
  verifyPassword,
} from "../utils/auth";
import { errors } from "../utils/errorMessages";
import { HttpStatusCode } from "../types/httpStatusCode";
import { success } from "../utils/successMessages";

const getSafeUser = (user: typeof users.$inferSelect) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const issueSessionTokens = async (user: typeof users.$inferSelect) => {
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken();

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: getRefreshTokenExpiryDate(),
  });

  return { accessToken, refreshToken };
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, password, role } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      throw new CustomError(
        errors.missingRegisterParameters,
        HttpStatusCode.BAD_REQUEST,
      );
    }

    if (password.length < 8) {
      throw new CustomError(errors.passwordLength, HttpStatusCode.BAD_REQUEST);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (existingUser) {
      throw new CustomError(errors.emailAlreadyExists, HttpStatusCode.CONFLICT);
    }

    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: await hashPassword(password),
        role: role ?? "patient",
      })
      .returning();

    if (!newUser) {
      throw new CustomError(
        errors.failedRegisterUser,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }

    const { accessToken, refreshToken } = await issueSessionTokens(newUser);

    res.status(HttpStatusCode.OK).json({
      message: success.successRegister,
      user: getSafeUser(newUser),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email?.trim() || !password?.trim()) {
      throw new CustomError(
        errors.missingLoginParameters,
        HttpStatusCode.BAD_REQUEST,
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new CustomError(
        errors.invalidLoginCredentials,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    if (!user.isActive) {
      throw new CustomError(errors.accountInactive, HttpStatusCode.FORBIDDEN);
    }

    const { accessToken, refreshToken } = await issueSessionTokens(user);

    res.status(HttpStatusCode.OK).json({
      message: success.successLogin,
      user: getSafeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken } = req.body as {
      refreshToken?: string;
    };

    if (!refreshToken?.trim()) {
      throw new CustomError(
        errors.refreshTokenMissing,
        HttpStatusCode.BAD_REQUEST,
      );
    }

    const hashedRefreshToken = hashRefreshToken(refreshToken.trim());
    const now = new Date();
    const storedRefreshToken = await db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.tokenHash, hashedRefreshToken),
        eq(refreshTokens.revoked, false),
        gt(refreshTokens.expiresAt, now),
      ),
    });

    if (!storedRefreshToken) {
      throw new CustomError(errors.invalidToken, HttpStatusCode.UNAUTHORIZED);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, storedRefreshToken.userId),
    });

    if (!user || !user.isActive) {
      throw new CustomError(errors.invalidToken, HttpStatusCode.UNAUTHORIZED);
    }

    const nextRefreshToken = generateRefreshToken();
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await db.transaction(async (tx) => {
      await tx
        .update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.id, storedRefreshToken.id));

      await tx.insert(refreshTokens).values({
        userId: user.id,
        tokenHash: hashRefreshToken(nextRefreshToken),
        expiresAt: getRefreshTokenExpiryDate(),
      });
    });

    res.status(HttpStatusCode.OK).json({
      message: success.successRefreshSession,
      user: getSafeUser(user),
      accessToken,
      refreshToken: nextRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};
