import { api } from "./api";

export interface TutorialVideo {
  id: number;
  title: string;
  description: string;
  videoPath: string;
  createdAt: string;
}

export const tutorialsApi = {
  getAll: async () => {
    const response = await api.get<TutorialVideo[]>("/api/TutorialVideos");
    return response.data;
  },

  create: async (formData: FormData) => {
    const response = await api.post<TutorialVideo>("/api/TutorialVideos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/TutorialVideos/${id}`);
  },
};
