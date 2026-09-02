import React from 'react'
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react'

export interface DiagramNode {
  id: string
  label: string
  description?: string
}

export interface DiagramConnection {
  from: string
  to: string
  label?: string
}

export interface DiagramSpecification {
  diagramAvailable: boolean
  title?: string
  type?: 'flowchart' | 'process' | 'cycle' | 'concept_map' | 'comparison' | 'labeled_structure'
  nodes?: DiagramNode[]
  connections?: DiagramConnection[]
  sourcePages?: number[]
  reason?: string
}

interface DiagramRendererProps {
  spec: DiagramSpecification | null
}

export default function DiagramRenderer({ spec }: DiagramRendererProps) {
  if (!spec || !spec.diagramAvailable || !spec.nodes || spec.nodes.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 text-center">
        <span>Visual explanation is currently unavailable for this question topic.</span>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2 font-bold text-gray-900 text-base">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span>🖼️ Visual Explanation — {spec.title || 'Educational Flowchart'}</span>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 uppercase">
          {spec.type || 'flowchart'}
        </span>
      </div>

      {/* SVG / Component Visual Diagram Canvas */}
      <div className="overflow-x-auto pb-3">
        <div className="min-w-[640px] flex items-center justify-between gap-3 py-6 px-4 bg-gray-50 rounded-xl border border-gray-200">
          {spec.nodes.map((node, index) => {
            const hasNext = index < spec.nodes!.length - 1
            const connection = spec.connections?.find((c) => c.from === node.id)

            return (
              <React.Fragment key={node.id}>
                {/* Node Box */}
                <div className="flex-1 bg-white border border-blue-200 shadow-sm rounded-xl p-4 flex flex-col justify-between hover:border-blue-500 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{node.label}</h4>
                  </div>
                  {node.description && (
                    <p className="text-[11px] text-gray-600 leading-relaxed mt-1">
                      {node.description}
                    </p>
                  )}
                </div>

                {/* Connection Arrow */}
                {hasNext && (
                  <div className="flex flex-col items-center justify-center px-1 shrink-0">
                    {connection?.label && (
                      <span className="text-[10px] font-semibold text-blue-600 mb-1 bg-blue-50 px-1.5 py-0.5 rounded">
                        {connection.label}
                      </span>
                    )}
                    <ArrowRight className="w-5 h-5 text-blue-500" />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Source Citation Footer */}
      {spec.sourcePages && spec.sourcePages.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>Based on textbook pages: <strong>{spec.sourcePages.join('–')}</strong></span>
        </div>
      )}
    </div>
  )
}
