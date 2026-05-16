'use client'

import { useState } from 'react'

const RAW_DATA = Array.from({ length: 50000 }, (_, i) => ({
  id: i,
  value: Math.random() * 100,
  category: i % 2 === 0 ? 'A' : 'B',
}))

export default function Home() {
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRunAnalysis = () => {
    setIsProcessing(true)
    setIsOpen(true) // Open the panel

    // 🚩 BAD: Massive synchronous processing on the Main Thread
    let sum = 0
    for (let i = 0; i < RAW_DATA.length; i++) {
      // Simulating heavy CPU work (e.g., complex cryptography or regex)
      for (let j = 0; j < 1000; j++) {
        sum += RAW_DATA[i].value * 0.0001
      }
    }

    setResults(sum)
    setIsProcessing(false)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50 p-8">
      <button
        onClick={handleRunAnalysis}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        {isProcessing ? 'Processing...' : 'Run Complex Analysis'}
      </button>

      {/* 
        🚩 BAD: Animating layout properties (width/right). 
        Causes layout thrashing and paints on every frame.
      */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: isOpen ? 0 : '-400px',
          width: '400px',
          height: '100%',
          backgroundColor: 'white',
          boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
          transition: 'right 0.4s ease-in-out',
        }}
      >
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
          <p className="text-xl">Total Score: {results.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
