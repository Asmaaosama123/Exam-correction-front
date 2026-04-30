import { api } from "./api";
import type { DatasetFile } from "@/types/ai-trainer";

/**
 * AI Trainer API endpoints
 * Provides access to the raw exam datasets for model training
 */
export const aiTrainerApi = {
  /**
   * Get all available files in the AI dataset folder
   */
  getDatasetFiles: async (): Promise<DatasetFile[]> => {
    const response = await api.get<DatasetFile[]>("/api/AITrainer/dataset-files");
    return response.data;
  },

  /**
   * Download selected files as a ZIP archive
   */
  downloadDatasetZip: async (selectedFiles: string[]): Promise<void> => {
    const response = await api.post(
      "/api/AITrainer/dataset-download",
      { selectedFiles },
      {
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    link.setAttribute("download", `AI_Dataset_Selected_${timestamp}.zip`);
    document.body.appendChild(link);
    link.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  },

  /**
   * Get a single file as a blob for preview
   */
  getFileBlob: async (fileName: string): Promise<string> => {
    const response = await api.get(`/api/AITrainer/file/${encodeURIComponent(fileName)}`, {
      responseType: "blob",
    });
    return window.URL.createObjectURL(response.data);
  },
};
