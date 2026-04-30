/**
 * AI Trainer Types
 * Single source of truth for all AI Trainer dataset-related types
 */

// ==================== Dataset Types ====================

export interface DatasetFile {
  fileName: string;
  fileUrl: string;
  creationTime: string;
}

// ==================== Request Types ====================

export interface DownloadDatasetRequest {
  selectedFiles: string[];
}
