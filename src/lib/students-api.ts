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
  ImportStudentsRequest,
  ExportStudentsRequest,
} from "@/types/students";

// Students API endpoints
export const studentsApi = {
  getStudents: async (
    params: GetStudentsRequest
  ): Promise<GetStudentsResponse> => {
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
      `/Students?${queryParams.toString()}`
    );
    return response.data;
  },

  getStudent: async (
    params: GetStudentRequest
  ): Promise<GetStudentResponse> => {
    const queryParams = new URLSearchParams({
      classId: params.classId,
    });

    const response = await api.get<GetStudentResponse>(
      `/Students/${params.studentId}?${queryParams.toString()}`
    );
    return response.data;
  },

  addStudent: async (
    classId: string,
    data: AddStudentRequest
  ): Promise<AddStudentResponse> => {
    const queryParams = new URLSearchParams({
      classId,
    });

    const response = await api.post<AddStudentResponse>(
      `/Students?${queryParams.toString()}`,
      data
    );
    return response.data;
  },

  updateStudent: async (
    studentId: string,
    data: UpdateStudentRequest
  ): Promise<UpdateStudentResponse> => {
    const response = await api.put<UpdateStudentResponse>(
      `/Students/${studentId}`,
      data
    );
    return response.data;
  },

  deleteStudent: async (studentId: string): Promise<DeleteStudentResponse> => {
    const response = await api.delete<DeleteStudentResponse>(
      `/Students/${studentId}`
    );
    // Handle 204 No Content or empty response
    return response.data || { success: true };
  },

  importStudents: async (
    file: File,
    data: ImportStudentsRequest
  ): Promise<ImportStudentsResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    // Backend expects this field name exactly
    formData.append("ClassId", data.ClassId);

    const response = await api.post<ImportStudentsResponse>(
      "/Students/import-students",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  exportStudentsToPdf: async (
    data: ExportStudentsRequest
  ): Promise<{ blob: Blob; filename: string }> => {
    // Build query string with multiple classIds parameters
    const queryParams = new URLSearchParams();
    if (data.classIds.length > 0) {
      data.classIds.forEach((classId) => {
        queryParams.append("classIds", classId);
      });
    }

    const url =
      data.classIds.length > 0
        ? `/Reports/report-students-pdf?${queryParams.toString()}`
        : "/Reports/report-students-pdf";

    const response = await api.get<Blob>(url, {
      responseType: "blob",
    });

    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers["content-disposition"];
    let filename = `students_export_${new Date().toISOString().split("T")[0]
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

  exportStudentsToExcel: async (
    data: ExportStudentsRequest
  ): Promise<{ blob: Blob; filename: string }> => {
    // Build query string with multiple classIds parameters
    const queryParams = new URLSearchParams();
    if (data.classIds.length > 0) {
      data.classIds.forEach((classId) => {
        queryParams.append("classIds", classId);
      });
    }

    // Build URL with or without query parameters
    const url =
      data.classIds.length > 0
        ? `/Reports/report-students-excel?${queryParams.toString()}`
        : "/Reports/report-students-excel";

    const response = await api.get<Blob>(url, {
      responseType: "blob",
    });

    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers["content-disposition"];
    let filename = `students_export_${new Date().toISOString().split("T")[0]
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
