import { useState } from 'react'
import Navbar from './components/Navbar'
import FileUploader from './components/FileUploader'
import ClauseList from './components/ClauseList'
import type { Clause, FileUploadResult } from './types'
import { extractClauses } from './utils/clauseUtils'
import './App.css'

function App() {
  const [clauses, setClauses] = useState<Clause[]>([])

  const handleFileUpload = async (result: FileUploadResult) => {
    // Extract clauses from the uploaded text
    const clauseStrings = extractClauses(result.text)
    // Map to Clause objects (placeholder summary, etc.)
    const clauseObjects: Clause[] = clauseStrings.map((clauseText, idx) => ({
      id: `${Date.now()}-${idx}`,
      originalText: clauseText,
      summary: 'This is a placeholder summary',
      dangerScore: 50,
      riskReason: 'This is a placeholder risk assessment',
    }))
    setClauses(clauseObjects)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <FileUploader onUpload={handleFileUpload} />
          <div className="mt-8">
            <ClauseList clauses={clauses} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
