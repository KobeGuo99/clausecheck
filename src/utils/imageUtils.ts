import { createWorker } from 'tesseract.js';

export async function extractTextFromImage(file: File): Promise<string> {
  try {
    // Create a worker
    const worker: any = await createWorker();
    
    // Initialize the worker with English language
    // @ts-ignore
    await worker.loadLanguage('eng');
    // @ts-ignore
    await worker.initialize('eng');
    
    // Convert File to base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]); // Remove the data URL prefix
      };
      reader.readAsDataURL(file);
    });
    
    // Perform OCR
    const { data: { text } } = await worker.recognize(`data:image/png;base64,${base64}`);
    
    // Terminate the worker
    await worker.terminate();
    
    return text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image');
  }
} 