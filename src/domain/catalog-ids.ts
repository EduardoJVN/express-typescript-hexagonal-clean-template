/**
 * Catalog IDs — lookup table values seeded in prisma/seed.ts.
 *
 * These constants map human-readable domain names to their integer PKs
 * in the database. Use these instead of magic numbers throughout the codebase.
 *
 * Source of truth: prisma/seed.ts
 */

export const UserStatusId = {
  PENDING: 1,
  ACTIVE: 2,
  SUSPENDED: 3,
} as const;

export type UserStatusId = (typeof UserStatusId)[keyof typeof UserStatusId];

export const UserRoleId = {
  USER: 1,
  ADMIN: 2,
  SUPPORT: 3,
} as const;

export type UserRoleId = (typeof UserRoleId)[keyof typeof UserRoleId];

export const RegisterTypeId = {
  EMAIL: 1,
  GOOGLE: 2,
  FACEBOOK: 3,
} as const;

export type RegisterTypeId = (typeof RegisterTypeId)[keyof typeof RegisterTypeId];

export const CompanyMemberRoleId = {
  OWNER: 1,
  ADMIN: 3,
  EDITOR: 3,
  VIEWER: 4,
} as const;

export type CompanyMemberRoleId = (typeof CompanyMemberRoleId)[keyof typeof CompanyMemberRoleId];
