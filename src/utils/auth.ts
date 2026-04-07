import crypto from "crypto";
import CustomError from "../types/error";
import { HttpStatusCode } from "../types/httpStatusCode";
import { errors } from "./errorMessages";

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

type AccessTokenPayload = {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
};

const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SCRYPT_COST = 16384;
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

const encodeBase64Url = (value: string | Buffer) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  return Buffer.from(padded, "base64");
};

const scryptAsync = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      PASSWORD_KEY_LENGTH,
      { N: PASSWORD_SCRYPT_COST },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey as Buffer);
      },
    );
  });

export const hashPassword = async (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt);

  return `${salt}:${derivedKey.toString("hex")}`;
};

export const verifyPassword = async (
  password: string,
  storedPasswordHash: string,
) => {
  const [salt, savedHash] = storedPasswordHash.split(":");

  if (!salt || !savedHash) {
    return false;
  }

  const derivedKey = await scryptAsync(password, salt);
  const savedHashBuffer = Buffer.from(savedHash, "hex");

  if (savedHashBuffer.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(savedHashBuffer, derivedKey);
};

export const signAccessToken = (payload: JwtPayload) => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new CustomError("JWT_SECRET is not configured.", 500);
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const body = {
    ...payload,
    iat: nowInSeconds,
    exp: nowInSeconds + ACCESS_TOKEN_TTL_SECONDS,
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedBody = encodeBase64Url(JSON.stringify(body));
  const unsignedToken = `${encodedHeader}.${encodedBody}`;
  const signature = crypto
    .createHmac("sha256", jwtSecret)
    .update(unsignedToken)
    .digest();

  return `${unsignedToken}.${encodeBase64Url(signature)}`;
};

export const generateRefreshToken = () => encodeBase64Url(crypto.randomBytes(48));

export const getRefreshTokenExpiryDate = () =>
  new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);

export const hashRefreshToken = (token: string) => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new CustomError("JWT_SECRET is not configured.", 500);
  }

  return crypto
    .createHmac("sha256", jwtSecret)
    .update(token)
    .digest("hex");
};

export const decodeJwtPayload = (token: string) => {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payload).toString("utf8"));
  } catch {
    return null;
  }
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new CustomError("JWT_SECRET is not configured.", 500);
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new CustomError(errors.invalidToken, HttpStatusCode.UNAUTHORIZED);
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new CustomError(errors.invalidToken, HttpStatusCode.UNAUTHORIZED);
  }

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto
    .createHmac("sha256", jwtSecret)
    .update(unsignedToken)
    .digest();

  const receivedSignature = decodeBase64Url(encodedSignature);

  if (receivedSignature.length !== expectedSignature.length) {
    throw new CustomError(errors.invalidToken, HttpStatusCode.UNAUTHORIZED);
  }

  if (!crypto.timingSafeEqual(receivedSignature, expectedSignature)) {
    throw new CustomError(errors.invalidToken, HttpStatusCode.UNAUTHORIZED);
  }

  const payload = JSON.parse(
    decodeBase64Url(encodedPayload).toString("utf8"),
  ) as AccessTokenPayload;

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new CustomError(errors.tokenExpired, HttpStatusCode.UNAUTHORIZED);
  }

  return payload;
};

export type { AccessTokenPayload };
