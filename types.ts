
// Fix: Add a global type declaration for `import.meta.env` to resolve TypeScript errors.
// This is necessary because the default TypeScript lib definitions do not include
// the `env` property that Vite injects. By augmenting the global `ImportMeta`
// interface, we make TypeScript aware of this property across the entire project.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_API_KEY: string;
    };
  }
}

export interface UploadedImage {
  file: File;
  previewUrl: string;
}
