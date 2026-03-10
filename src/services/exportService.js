import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, formatCurrency } from '../utils/formatDate'

export const exportService = {
  // Export to CSV
  exportToCSV(data, filename = 'export') {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data to export')
      }

      // Convert data to CSV format
      const headers = Object.keys(data[0] || {}).join(',')
      const rows = data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      )
      const csv = [headers, ...rows].join('\n')
      
      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      saveAs(blob, `${filename}_${formatDate(new Date(), 'short').replace(/\//g, '-')}.csv`)
      return true
    } catch (error) {
      console.error('Error exporting to CSV:', error)
      throw error
    }
  },

  // Export to Excel
  exportToExcel(data, filename = 'export') {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data to export')
      }

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
      
      // Generate Excel file
      XLSX.writeFile(workbook, `${filename}_${formatDate(new Date(), 'short').replace(/\//g, '-')}.xlsx`)
      return true
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      throw error
    }
  },

  // Export to PDF
  exportToPDF(data, title = 'Report', filename = 'export') {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data to export')
      }

      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(18)
      doc.text(title, 14, 22)
      
      // Add date
      doc.setFontSize(11)
      doc.text(`Generated: ${formatDate(new Date(), 'medium')}`, 14, 32)
      
      // Prepare table data
      const headers = Object.keys(data[0] || [])
      const rows = data.map(row => Object.values(row))
      
      // Add table using autoTable
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 40,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { top: 40 }
      })
      
      // Save PDF
      doc.save(`${filename}_${formatDate(new Date(), 'short').replace(/\//g, '-')}.pdf`)
      return true
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      throw error
    }
  },

  // Export to PDF with custom styling
  exportToPDFStyled(data, title = 'Report', subtitle = '', filename = 'export') {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data to export')
      }

      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(20)
      doc.setTextColor(37, 99, 235)
      doc.text(title, 14, 20)
      
      // Add subtitle if provided
      if (subtitle) {
        doc.setFontSize(12)
        doc.setTextColor(100, 100, 100)
        doc.text(subtitle, 14, 28)
      }
      
      // Add date
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.text(`Generated: ${formatDate(new Date(), 'medium')}`, 14, 38)
      
      // Add line separator
      doc.setDrawColor(200, 200, 200)
      doc.line(14, 42, 196, 42)
      
      // Prepare table data
      const headers = Object.keys(data[0] || [])
      const rows = data.map(row => Object.values(row))
      
      // Add table using autoTable
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 48,
        styles: { 
          fontSize: 8, 
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [37, 99, 235], 
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Add footer with page number
          doc.setFontSize(8)
          doc.setTextColor(150, 150, 150)
          doc.text(
            `Page ${data.pageNumber}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          )
        }
      })
      
      // Save PDF
      doc.save(`${filename}_${formatDate(new Date(), 'short').replace(/\//g, '-')}.pdf`)
      return true
    } catch (error) {
      console.error('Error exporting to PDF with styling:', error)
      throw error
    }
  },

  // Prepare orders report
  prepareOrdersReport(orders) {
    return orders.map(order => ({
      'Order ID': order.orderNumber || order.id?.slice(-8) || 'N/A',
      'Customer': order.userName || 'N/A',
      'Email': order.userEmail || 'N/A',
      'Phone': order.userPhone || 'N/A',
      'Items': order.items?.length || 0,
      'Subtotal': formatCurrency(order.subtotal || 0),
      'Tax': formatCurrency(order.tax || 0),
      'Delivery Fee': formatCurrency(order.deliveryFee || 0),
      'Total': formatCurrency(order.total || 0),
      'Status': order.status || 'N/A',
      'Payment Method': order.paymentMethod || 'N/A',
      'Order Date': formatDate(order.createdAt, 'medium'),
      'Delivery Address': order.deliveryAddress || 'N/A',
      'Delivery Boy': order.deliveryBoyName || 'Not Assigned'
    }))
  },

  // Prepare revenue report
  prepareRevenueReport(orders) {
    const revenueByDay = {}
    orders.forEach(order => {
      if (order.status === 'delivered') {
        const date = formatDate(order.deliveredAt || order.createdAt, 'short')
        if (!revenueByDay[date]) {
          revenueByDay[date] = {
            date,
            orders: 0,
            revenue: 0,
            items: 0
          }
        }
        revenueByDay[date].orders++
        revenueByDay[date].revenue += order.total || 0
        revenueByDay[date].items += order.items?.length || 0
      }
    })

    return Object.values(revenueByDay).map(day => ({
      'Date': day.date,
      'Orders': day.orders,
      'Items Sold': day.items,
      'Revenue': formatCurrency(day.revenue)
    }))
  },

  // Prepare delivery report
  prepareDeliveryReport(orders) {
    const deliveryStats = {}
    orders.forEach(order => {
      if (order.deliveryBoyName && order.status === 'delivered') {
        const boy = order.deliveryBoyName
        if (!deliveryStats[boy]) {
          deliveryStats[boy] = {
            'Delivery Boy': boy,
            'Deliveries': 0,
            'Total Revenue': 0,
            'Avg Delivery Time': 0,
            'Total Time': 0
          }
        }
        deliveryStats[boy].Deliveries++
        deliveryStats[boy]['Total Revenue'] += order.deliveryFee || 0
        
        if (order.assignedAt && order.deliveredAt) {
          const assigned = new Date(order.assignedAt)
          const delivered = new Date(order.deliveredAt)
          const time = (delivered - assigned) / (1000 * 60) // minutes
          deliveryStats[boy]['Total Time'] += time
        }
      }
    })

    // Calculate averages
    Object.values(deliveryStats).forEach(stat => {
      stat['Avg Delivery Time'] = stat.Deliveries > 0 
        ? Math.round((stat['Total Time'] / stat.Deliveries) * 10) / 10 + ' min'
        : 'N/A'
      stat['Total Revenue'] = formatCurrency(stat['Total Revenue'])
      delete stat['Total Time']
    })

    return Object.values(deliveryStats)
  },

  // Prepare user report
  prepareUserReport(users) {
    return users.map(user => ({
      'Name': user.name || 'N/A',
      'Email': user.email || 'N/A',
      'Role': user.role || 'N/A',
      'Phone': user.phone || 'N/A',
      'Status': user.isActive ? 'Active' : 'Inactive',
      'Joined': formatDate(user.createdAt, 'medium'),
      'Last Login': user.lastLogin ? formatDate(user.lastLogin, 'relative') : 'N/A',
      'Total Orders': user.totalOrders || 0
    }))
  },

  // Prepare popular items report
  preparePopularItemsReport(items) {
    return items.map((item, index) => ({
      'Rank': index + 1,
      'Item Name': item.name,
      'Quantity Sold': item.value,
      'Revenue': formatCurrency(item.revenue || 0)
    }))
  }
}