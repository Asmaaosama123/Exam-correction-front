import { api } from "./api";
import type {
  GetStudentsRequest,
  GetStudentsResponse,
  GetStudentRequest,
  GetStudentResponse,
  AddStudentRequest,
  AddStudentResponse,
  UpdateStudentRequest,
  UpdateStudentResponse,
  DeleteStudentResponse,
  ImportStudentsResponse,
  ExportStudentsRequest,
} from "@/types/students";

// Students API endpoints
export const studentsApi = {
  /**
   * Get all students with pagination and filtering
   */
  getStudents: async (params: GetStudentsRequest): Promise<GetStudentsResponse> => {
    const queryParams = new URLSearchParams({
      pageNumber: String(params.pageNumber || 1),
      pageSize: String(params.pageSize || 10),
    });

    if (params.classId) {
      queryParams.append("classId", params.classId);
    }

    if (params.SearchValue) {
      queryParams.append("SearchValue", params.SearchValue);
    }

    const response = await api.get<GetStudentsResponse>(
      `/api/students?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get a single student by ID
   */
  getStudent: async (params: GetStudentRequest): Promise<GetStudentResponse> => {
    const queryParams = new URLSearchParams({
      classId: params.classId,
    });

    const response = await api.get<GetStudentResponse>(
      `/api/students/${params.studentId}?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Add a new student
   */
  addStudent: async (
    classId: string,
    data: AddStudentRequest
  ): Promise<AddStudentResponse> => {
    const queryParams = new URLSearchParams({
      classId,
    });

    const response = await api.post<AddStudentResponse>(
      `/api/students?${queryParams.toString()}`,
      data
    );
    return response.data;
  },

  /**
   * Update an existing student
   * Note: classId and isDisabled are now included in the request body
   */
  updateStudent: async (
    studentId: string,
    data: UpdateStudentRequest
  ): Promise<UpdateStudentResponse> => {
    const response = await api.put<UpdateStudentResponse>(
      `/api/students/${studentId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a student
   */
  deleteStudent: async (studentId: string): Promise<DeleteStudentResponse> => {
    const response = await api.delete<DeleteStudentResponse>(
      `/api/students/${studentId}`
    );
    // Handle 204 No Content or empty response
    return response.data || { success: true };
  },

  /**
   * Import students from Excel file
   */
  importStudents: async (file: File): Promise<ImportStudentsResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<ImportStudentsResponse>(
      "/api/students/import",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Export students to PDF
   * Uses GET request with query parameters: /api/Reports/report-students-pdf?classIds={id1}&classIds={id2}
   * If classIds array is empty, calls endpoint without query params (exports all students)
   */
  exportStudentsToPdf: async (data: ExportStudentsRequest): Promise<{ blob: Blob; filename: string }> => {
    // Build query string with multiple classIds parameters
    const queryParams = new URLSearchParams();
    if (data.classIds.length > 0) {
      data.classIds.forEach((classId) => {
        queryParams.append("classIds", classId);
      });
    }

    // Build URL with or without query parameters
    const url = data.classIds.length > 0
      ? `/api/Reports/report-students-pdf?${queryParams.toString()}`
      : "/api/Reports/report-students-pdf";

    const response = await api.get<Blob>(url, {
      responseType: "blob",
    });

    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers["content-disposition"];
    let filename = `students_export_${new Date().toISOString().split("T")[0]}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    }

    return { blob: response.data, filename };
  },

  /**
   * Export students to Excel
   * Uses GET request with query parameters: /api/Reports/report-students-excel?classIds={id1}&classIds={id2}
   * If classIds array is empty, calls endpoint without query params (exports all students)
   */
  exportStudentsToExcel: async (data: ExportStudentsRequest): Promise<{ blob: Blob; filename: string }> => {
    // Build query string with multiple classIds parameters
    const queryParams = new URLSearchParams();
    if (data.classIds.length > 0) {
      data.classIds.forEach((classId) => {
        queryParams.append("classIds", classId);
      });
    }

    // Build URL with or without query parameters
    const url = data.classIds.length > 0
      ? `/api/Reports/report-students-excel?${queryParams.toString()}`
      : "/api/Reports/report-students-excel";

    const response = await api.get<Blob>(url, {
      responseType: "blob",
    });

    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers["content-disposition"];
    let filename = `students_export_${new Date().toISOString().split("T")[0]}.xlsx`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    }

    return { blob: response.data, filename };
  },
};

