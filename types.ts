
export interface GenerationState {
  isGenerating: boolean;
  error: string | null;
  resultUrl: string | null;
  uploadedImageUrls: string[];
}

export interface ImagePart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}
