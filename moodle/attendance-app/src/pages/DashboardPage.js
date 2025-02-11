import React, { useState, useEffect } from 'react';
import AttendanceStats from '../components/AttendanceStats';
import AttendanceTable from '../components/AttendanceTable';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const DashboardPage = () => {
  const [dateRange, setDateRange] = useState([new Date(), new Date()]);
  const [startDate, endDate] = dateRange;
  const [selectedClass, setSelectedClass] = useState('all');
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceData();
  }, [startDate, endDate, selectedClass]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/attendance/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          class: selectedClass
        })
      });

      const data = await response.json();
      setAttendanceData(data);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <h1>Dashboard Presensi</h1>

      <div className="filters">
        <div className="date-picker">
          <label>Rentang Tanggal:</label>
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => setDateRange(update)}
            dateFormat="dd/MM/yyyy"
            className="date-input"
          />
        </div>

        <div className="class-filter">
          <label>Kelas:</label>
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="class-select"
          >
            <option value="all">Semua Kelas</option>
            <option value="X-RPL">X RPL</option>
            <option value="XI-RPL">XI RPL</option>
            <option value="XII-RPL">XII RPL</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="stats-section">
            <AttendanceStats attendanceData={attendanceData.stats || {}} />
          </div>

          <div className="table-section">
            <AttendanceTable attendanceData={attendanceData.records || []} />
          </div>
        </>
      )}

      <style jsx>{`
        .dashboard-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        h1 {
          margin-bottom: 30px;
          color: #2c3e50;
        }

        .filters {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .date-picker, .class-filter {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        label {
          font-weight: 500;
          color: #2c3e50;
        }

        .date-input, .class-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          min-width: 200px;
        }

        .stats-section {
          margin-bottom: 30px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: #666;
        }

        @media (max-width: 768px) {
          .dashboard-page {
            padding: 10px;
          }

          .filters {
            flex-direction: column;
          }

          .date-input, .class-select {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
