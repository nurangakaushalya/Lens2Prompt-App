
export interface AnalysisResult {
  prompt: string;
  metadata: {
    style: string;
    subject: string;
    lighting: string;
    composition: string;
  };
}

export interface ImageItem {
  id: string;
  file: File;
  preview: string;
  base64: string;
  mimeType: string;
  status: 'idle' | 'loading' | 'completed' | 'error';
  result?: AnalysisResult;
  error?: string;
  // Refinement states
  selectedColor?: string;
  selectedStyle?: string;
}
