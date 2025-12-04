import { api } from "./api";
import type {
  GetClassesResponse,
  GetClassResponse,
  AddClassRequest,
  AddClassResponse,
  UpdateClassRequest,
  UpdateClassResponse,
  DeleteClassResponse,
} from "@/types/classes";

// Classes API endpoints
export const classesApi = {
  /**
   * Get all classes
   */
  getClasses: async (): Promise<GetClassesResponse> => {
    const response = await api.get<GetClassesResponse>("/api/classes");
    return response.data;
  },

  /**
   * Get a single class by ID
   */
  getClass: async (classId: string): Promise<GetClassResponse> => {
    const response = await api.get<GetClassResponse>(`/api/classes/${classId}`);
    return response.data;
  },

  /**
   * Add a new class
   */
  addClass: async (data: AddClassRequest): Promise<AddClassResponse> => {
    const response = await api.post<AddClassResponse>("/api/classes", data);
    return response.data;
  },

  /**
   * Update an existing class
   */
  updateClass: async (
    classId: string,
    data: UpdateClassRequest
  ): Promise<UpdateClassResponse> => {
    const response = await api.put<UpdateClassResponse>(
      `/api/classes/${classId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a class
   */
  deleteClass: async (classId: string): Promise<DeleteClassResponse> => {
    const response = await api.delete<DeleteClassResponse>(
      `/api/classes/${classId}`
    );
    // Handle 204 No Content or empty response
    return response.data || { success: true };
  },
};

