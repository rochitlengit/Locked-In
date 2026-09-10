// Allowed values for the string-typed status columns in the Prisma schema.
// Kept in code (rather than as DB enums) so the same schema runs on SQLite and
// PostgreSQL; validated at the API boundary with class-validator.

export const ROLES = ['SUPER_ADMIN', 'HR', 'TEAM_LEAD', 'EMPLOYEE'] as const;
export type Role = (typeof ROLES)[number];

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'REJECTED'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const APPROVAL_STATUSES = ['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const GRIEVANCE_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
export type GrievanceStatus = (typeof GRIEVANCE_STATUSES)[number];

/** Roles allowed to manage org structure and people. */
export const ADMIN_ROLES: Role[] = ['SUPER_ADMIN', 'HR'];
/** Roles allowed to approve work and time off. */
export const APPROVER_ROLES: Role[] = ['SUPER_ADMIN', 'HR', 'TEAM_LEAD'];
