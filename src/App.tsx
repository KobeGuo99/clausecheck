import { useState } from 'react'
import Navbar from './components/Navbar'
import FileUploader from './components/FileUploader'
import ClauseList from './components/ClauseList'
import type { Clause, FileUploadResult } from './types'
import { extractClauses } from './utils/clauseUtils'
import { analyzeClausesBatchWithOpenAI } from './utils/openaiUtils'
import './App.css'

function App() {
  const [clauses, setClauses] = useState<Clause[]>([])

  const handleFileUpload = async (result: FileUploadResult) => {
    // Extract clauses from the uploaded text
    const clauseStrings = extractClauses(result.text)
    // Set initial loading state for each clause
    const now = Date.now()
    const clauseObjects: Clause[] = clauseStrings.map((clauseText, idx) => ({
      id: `${now}-${idx}`,
      originalText: clauseText,
      summary: 'Analyzing...',
      dangerScore: -1, // -1 indicates loading
      riskReason: 'Analyzing...'
    }))
    setClauses(clauseObjects)

    try {
      const analysisResults = await analyzeClausesBatchWithOpenAI(clauseStrings)
      setClauses(clauseObjects.map((clause, idx) => ({
        ...clause,
        summary: analysisResults[idx]?.summary || 'Analysis failed',
        dangerScore: typeof analysisResults[idx]?.dangerScore === 'number' ? analysisResults[idx].dangerScore : 0,
        riskReason: analysisResults[idx]?.riskReason || 'Could not analyze clause.'
      })))
    } catch (e) {
      setClauses(clauseObjects.map(clause => ({
        ...clause,
        summary: 'Analysis failed',
        dangerScore: 0,
        riskReason: 'Could not analyze clause.'
      })))
    }
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
