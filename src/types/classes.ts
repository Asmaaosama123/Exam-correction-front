/**
 * Classes Types
 * Single source of truth for all class-related types
 */

// ==================== Class Types ====================

export interface Class {
  id: string;
  name: string;
  numberOfStudents: number;
  createdAt: string;
}

// ==================== Request Types ====================

export interface AddClassRequest {
  name: string;
}

export interface UpdateClassRequest {
  name: string;
}

// ==================== Response Types ====================

export type GetClassesResponse = Class[];

export type GetClassResponse = Class;

export type AddClassResponse = Class;

export type UpdateClassResponse = Class;

export interface DeleteClassResponse {
  success: boolean;
  message?: string;
}

// ==================== Error Types ====================

// Class-specific error codes
export const ClassErrorCode = {
  InvalidClassId: "Class.InvalidClassId",
} as const;

export type ClassErrorCode =
  (typeof ClassErrorCode)[keyof typeof ClassErrorCode];
