import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Schedule = ({ onSessionSelect }) => {
  const [schedule, setSchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, [selectedDate]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/schedule', {
        params: {
          date: selectedDate.toISOString()
        }
      });
      setSchedule(response.data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
    setLoading(false);
  };

  const handleSessionClick = (session) => {
    onSessionSelect(session);
  };

  return (
    <div className="schedule">
      <h3>Jadwal Pelajaran</h3>
      
      <div className="date-picker">
        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
        />
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="schedule-list">
          {schedule.map((session) => (
            <div
              key={session.id}
              className={`schedule-item ${session.isActive ? 'active' : ''}`}
              onClick={() => handleSessionClick(session)}
            >
              <div className="time">
                {session.startTime} - {session.endTime}
              </div>
              <div className="course">
                <strong>{session.courseName}</strong>
                <span className="teacher">{session.teacherName}</span>
              </div>
              <div className="status">
                <span className={`badge ${session.status}`}>
                  {session.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Schedule;
