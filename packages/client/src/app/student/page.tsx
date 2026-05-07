import React, { Suspense } from 'react'
import StudentDiagramPage from './StudentDiagramPage'

export default function page() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-[#020617]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <StudentDiagramPage />
    </Suspense>
  )
}
