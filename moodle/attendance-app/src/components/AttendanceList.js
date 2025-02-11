import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const AttendanceList = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendances();
  }, []);

  const fetchAttendances = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/attendances`);
      setAttendances(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attendances:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading attendance records...</div>;
  }

  return (
    <div className="attendance-list">
      <h2>Attendance Records</h2>
      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {attendances.map((attendance) => (
            <tr key={attendance.id}>
              <td>{attendance.student_id}</td>
              <td>{attendance.student_name}</td>
              <td>{format(new Date(attendance.timestamp), 'dd/MM/yyyy')}</td>
              <td>{format(new Date(attendance.timestamp), 'HH:mm:ss')}</td>
              <td>{attendance.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceList;
