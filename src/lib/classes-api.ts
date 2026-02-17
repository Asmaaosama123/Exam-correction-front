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
    const response = await api.get<GetClassesResponse>("/Classes");
    return response.data;
  },

  /**
   * Get a single class by ID
   */
  getClass: async (classId: string): Promise<GetClassResponse> => {
    const response = await api.get<GetClassResponse>(`/Classes/${classId}`);
    return response.data;
  },

  /**
   * Add a new class
   */
  addClass: async (data: AddClassRequest): Promise<AddClassResponse> => {
    const response = await api.post<AddClassResponse>("/Classes", data);
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
      `/Classes/${classId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a class
   */
  deleteClass: async (classId: string): Promise<DeleteClassResponse> => {
    const response = await api.delete<DeleteClassResponse>(
      `/Classes/${classId}`
    );
    // Handle 204 No Content or empty response
    return response.data || { success: true };
  },

  /**
   * Export classes to PDF
   * No parameters required - exports all classes
   */
  exportClassesToPdf: async (): Promise<{ blob: Blob; filename: string }> => {
    const response = await api.get<Blob>("/Reports/report-classes-pdf", {
      responseType: "blob",
    });

    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers["content-disposition"];
    let filename = `classes_export_${new Date().toISOString().split("T")[0]
      }.pdf`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    }

    return { blob: response.data, filename };
  },

  /**
   * Export classes to Excel
   * No parameters required - exports all classes
   */
  exportClassesToExcel: async (): Promise<{ blob: Blob; filename: string }> => {
    const response = await api.get<Blob>("/Reports/report-classes-excel", {
      responseType: "blob",
    });

    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers["content-disposition"];
    let filename = `classes_export_${new Date().toISOString().split("T")[0]
      }.xlsx`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    }

    return { blob: response.data, filename };
  },
};
