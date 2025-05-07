import React, { useState, useCallback } from 'react';
import type { FileUploadResult, UploadMethod } from '../types';
import { extractTextFromPDF } from '../utils/pdfUtils';
import { extractTextFromImage } from '../utils/imageUtils';

interface FileUploaderProps {
  onUpload: (result: FileUploadResult) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>('pdf');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    await processFile(file);
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file);
  }, []);

  const processFile = async (file: File) => {
    const fileType = file.type;
    let text = '';

    try {
      setError(null);
      setIsProcessing(true);
      console.log(`Processing file: ${file.name}, type: ${fileType}`);
      
      if (fileType === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else if (fileType.startsWith('image/')) {
        text = await extractTextFromImage(file);
      }

      if (!text.trim()) {
        throw new Error('No text content was extracted from the file');
      }

      onUpload({
        text,
        fileName: file.name,
        fileType: fileType === 'application/pdf' ? 'pdf' : 'image'
      });
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Error processing file: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    onUpload({
      text: textInput,
      fileName: 'pasted-text.txt',
      fileType: 'text'
    });
    setTextInput('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="mb-6">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <div className="flex space-x-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${uploadMethod === 'pdf' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setUploadMethod('pdf')}
            disabled={isProcessing}
          >
            PDF
          </button>
          <button
            className={`px-4 py-2 rounded ${uploadMethod === 'image' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setUploadMethod('image')}
            disabled={isProcessing}
          >
            Image
          </button>
          <button
            className={`px-4 py-2 rounded ${uploadMethod === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setUploadMethod('text')}
            disabled={isProcessing}
          >
            Text
          </button>
        </div>

        {uploadMethod !== 'text' ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept={uploadMethod === 'pdf' ? '.pdf' : 'image/*'}
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isProcessing}
            />
            <label
              htmlFor="file-upload"
              className={`cursor-pointer text-blue-500 hover:text-blue-600 ${isProcessing ? 'cursor-not-allowed' : ''}`}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                  <p className="text-lg mb-2">Processing your file...</p>
                </div>
              ) : (
                <>
                  <p className="text-lg mb-2">Drag and drop your {uploadMethod.toUpperCase()} here</p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                </>
              )}
            </label>
          </div>
        ) : (
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="w-full h-48 p-4 border rounded-lg resize-none"
              placeholder="Paste your contract text here..."
              disabled={isProcessing}
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Analyze Text'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FileUploader; 