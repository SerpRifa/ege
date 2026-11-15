import bcrypt from "bcryptjs";

const DEFAULT_ROUNDS = 12;

export function hashPassword(password: string, rounds = DEFAULT_ROUNDS): Promise<string> {
  return bcrypt.hash(password, rounds);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
