import { api } from "./api";
import type { UploadTeacherExamRequest, TeacherExamResponse } from "@/types/exam-template";

export const examTemplateApi = {
    uploadTeacherExam: async (data: UploadTeacherExamRequest): Promise<TeacherExamResponse> => {
        const formData = new FormData();
        if (data.ExamId) formData.append("ExamId", data.ExamId.toString());
        if (data.Title) formData.append("Title", data.Title);
        if (data.Subject) formData.append("Subject", data.Subject);
        if (data.IsBarcode !== undefined) formData.append("IsBarcode", data.IsBarcode.toString());
        if (data.PageCount !== undefined) formData.append("PageCount", data.PageCount.toString());
        
        formData.append("File", data.File);
        formData.append("QuestionsJson", data.QuestionsJson);

        const response = await api.post<TeacherExamResponse>(
            "/api/Exam/upload-teacher-exam",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    },

    analyzeTemplate: async (file: File): Promise<any> => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post(
            "/api/Exam/analyze-template",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    },
};
