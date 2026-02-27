import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import GlassCard from '../ui/GlassCard'

const DeliveryPerformanceChart = ({ data, title = 'Delivery Performance' }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-green-600">
            On Time: {payload[0].value}%
          </p>
          <p className="text-sm text-red-600">
            Delayed: {payload[1].value}%
          </p>
        </div>
      )
    }
    return null
  }

  // Ensure we have data to display
  const chartData = data && data.length > 0 ? data : [
    { name: 'No Data', onTime: 0, delayed: 0 }
  ]

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="name" type="category" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="onTime" name="On Time %" fill="#10b981" stackId="a" />
            <Bar dataKey="delayed" name="Delayed %" fill="#ef4444" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}

export default DeliveryPerformanceChart