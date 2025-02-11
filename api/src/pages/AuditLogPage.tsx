import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
    endDate: new Date(),
    userId: '',
    action: '',
    resource: '',
    page: 1
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        page: filters.page.toString(),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.action && { action: filters.action }),
        ...(filters.resource && { resource: filters.resource })
      });

      const response = await fetch(`/api/audit-logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset page when filters change
    }));
  };

  return (
    <div className="audit-log-page">
      <h1>Audit Logs</h1>

      <div className="filters">
        <div className="filter-group">
          <label>Date Range:</label>
          <DatePicker
            selectsRange={true}
            startDate={filters.startDate}
            endDate={filters.endDate}
            onChange={([start, end]) => {
              handleFilterChange('startDate', start);
              handleFilterChange('endDate', end);
            }}
            dateFormat="dd/MM/yyyy"
          />
        </div>

        <div className="filter-group">
          <label>User ID:</label>
          <input
            type="text"
            value={filters.userId}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
            placeholder="Filter by user ID"
          />
        </div>

        <div className="filter-group">
          <label>Action:</label>
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="LOGIN">Login</option>
            <option value="ATTENDANCE">Attendance</option>
            <option value="EXPORT">Export</option>
            <option value="UPDATE">Update</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="logs-table">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>IP Address</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}</td>
                  <td>
                    {log.user.name}
                    <br />
                    <small>{log.user.email}</small>
                  </td>
                  <td>{log.action}</td>
                  <td>{log.resource}</td>
                  <td>{log.ipAddress}</td>
                  <td>
                    <pre>{JSON.stringify(JSON.parse(log.details), null, 2)}</pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .audit-log-page {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .filters {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-group label {
          font-weight: 500;
        }

        .filter-group input,
        .filter-group select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          min-width: 200px;
        }

        .logs-table {
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
        }

        pre {
          margin: 0;
          white-space: pre-wrap;
          font-size: 12px;
        }

        .loading {
          text-align: center;
          padding: 40px;
        }

        @media (max-width: 768px) {
          .filters {
            flex-direction: column;
          }

          .filter-group input,
          .filter-group select {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AuditLogPage;
