
// Add declaration for process.env to satisfy TypeScript and align with API guidelines.
declare var process: {
  env: {
    API_KEY?: string;
  };
};

export interface UploadedImage {
  file: File;
  previewUrl: string;
}