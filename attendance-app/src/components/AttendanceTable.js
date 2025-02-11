import React, { useState } from 'react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const AttendanceTable = ({ attendanceData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const sortedData = [...attendanceData].sort((a, b) => {
    if (sortConfig.key === 'date') {
      return sortConfig.direction === 'asc' 
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    }
    return sortConfig.direction === 'asc'
      ? a[sortConfig.key].localeCompare(b[sortConfig.key])
      : b[sortConfig.key].localeCompare(a[sortConfig.key]);
  });

  const filteredData = sortedData.filter(item =>
    Object.values(item).some(value =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData.map(item => ({
      Tanggal: format(new Date(item.date), 'dd/MM/yyyy'),
      Waktu: format(new Date(item.date), 'HH:mm:ss'),
      NIS: item.studentId,
      Nama: item.studentName,
      Kelas: item.class,
      Status: item.status,
      Metode: item.method,
      Lokasi: item.location
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, `attendance_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="attendance-table">
      <div className="table-actions">
        <input
          type="text"
          placeholder="Cari..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button onClick={exportToExcel} className="export-button">
          Export to Excel
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('date')}>
                Tanggal/Waktu {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('studentId')}>
                NIS {sortConfig.key === 'studentId' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('studentName')}>
                Nama {sortConfig.key === 'studentName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('class')}>
                Kelas {sortConfig.key === 'class' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('status')}>
                Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Metode</th>
              <th>Lokasi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr key={index}>
                <td>
                  {format(new Date(item.date), 'dd/MM/yyyy HH:mm:ss')}
                </td>
                <td>{item.studentId}</td>
                <td>{item.studentName}</td>
                <td>{item.class}</td>
                <td>
                  <span className={`status-badge ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td>{item.method}</td>
                <td>{item.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .attendance-table {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 20px;
        }

        .table-actions {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .search-input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 200px;
        }

        .export-button {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        th {
          background: #f8f9fa;
          cursor: pointer;
        }

        th:hover {
          background: #e9ecef;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
        }

        .hadir {
          background: #d4edda;
          color: #155724;
        }

        .tidak-hadir {
          background: #f8d7da;
          color: #721c24;
        }

        .terlambat {
          background: #fff3cd;
          color: #856404;
        }

        @media (max-width: 768px) {
          .table-actions {
            flex-direction: column;
            gap: 10px;
          }

          .search-input {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AttendanceTable;
