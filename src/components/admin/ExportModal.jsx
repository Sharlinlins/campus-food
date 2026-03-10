import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import Button from '../ui/Button'
import GlassCard from '../ui/GlassCard'

const ExportModal = ({ isOpen, onClose, onExport, title = 'Export Report' }) => {
  const [format, setFormat] = useState('excel')
  const [dateRange, setDateRange] = useState('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [exporting, setExporting] = useState(false)

  const formats = [
    { value: 'excel', label: 'Excel (.xlsx)', icon: '📊', description: 'Best for data analysis' },
    { value: 'csv', label: 'CSV (.csv)', icon: '📄', description: 'Compatible with all apps' },
    { value: 'pdf', label: 'PDF (.pdf)', icon: '📑', description: 'Best for printing/sharing' }
  ]

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const handleExport = async () => {
    // Validate custom dates
    if (dateRange === 'custom') {
      if (!customStart || !customEnd) {
        alert('Please select both start and end dates')
        return
      }
      if (new Date(customStart) > new Date(customEnd)) {
        alert('Start date cannot be after end date')
        return
      }
    }

    setExporting(true)
    try {
      await onExport({
        format,
        dateRange,
        customStart: dateRange === 'custom' ? customStart : null,
        customEnd: dateRange === 'custom' ? customEnd : null
      })
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md"
          >
            <GlassCard className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <DocumentArrowDownIcon className="h-6 w-6 text-primary-600" />
                  <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  disabled={exporting}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Format Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {formats.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFormat(f.value)}
                      disabled={exporting}
                      className={`
                        p-3 border rounded-lg flex flex-col items-center gap-1 transition-colors
                        ${format === f.value
                          ? 'bg-primary-50 border-primary-500 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:bg-gray-50'
                        }
                        ${exporting ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <span className="text-xl">{f.icon}</span>
                      <span className="text-xs font-medium">{f.label}</span>
                      <span className="text-[10px] text-gray-400 text-center">
                        {f.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  disabled={exporting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {dateRanges.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Custom Date Range */}
              {dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      disabled={exporting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      disabled={exporting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {/* Info Text */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <span className="font-medium">💡 Tip:</span> The report will include all data based on your selected date range and format.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleExport}
                  disabled={exporting}
                  fullWidth
                >
                  {exporting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      Export Now
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={exporting}
                  fullWidth
                >
                  Cancel
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ExportModal