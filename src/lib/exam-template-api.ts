import { api } from "./api";
import type { UploadTeacherExamRequest, TeacherExamResponse } from "@/types/exam-template";

export const examTemplateApi = {
    uploadTeacherExam: async (data: UploadTeacherExamRequest): Promise<TeacherExamResponse> => {
        const formData = new FormData();
        formData.append("ExamId", data.ExamId.toString());
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
};
