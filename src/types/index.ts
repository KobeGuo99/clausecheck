export type Clause = {
  id: string;
  originalText: string;
  summary: string;
  dangerScore: number;
  riskReason: string;
}

export type FileUploadResult = {
  text: string;
  fileName: string;
  fileType: 'pdf' | 'image' | 'text';
}

export type UploadMethod = 'pdf' | 'image' | 'text'; 