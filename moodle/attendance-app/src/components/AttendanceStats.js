import React from 'react';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AttendanceStats = ({ attendanceData }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Statistik Kehadiran Mingguan'
      }
    }
  };

  const data = {
    labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    datasets: [
      {
        label: 'Hadir',
        data: attendanceData.present || [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Tidak Hadir',
        data: attendanceData.absent || [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Terlambat',
        data: attendanceData.late || [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
      }
    ]
  };

  return (
    <div className="attendance-stats">
      <div className="stats-summary">
        <div className="stat-box">
          <h3>Total Hadir</h3>
          <p className="stat-number">{attendanceData.totalPresent || 0}</p>
        </div>
        <div className="stat-box">
          <h3>Total Tidak Hadir</h3>
          <p className="stat-number">{attendanceData.totalAbsent || 0}</p>
        </div>
        <div className="stat-box">
          <h3>Persentase Kehadiran</h3>
          <p className="stat-number">
            {attendanceData.attendanceRate?.toFixed(1) || 0}%
          </p>
        </div>
      </div>
      
      <div className="chart-container">
        <Bar options={options} data={data} />
      </div>

      <style jsx>{`
        .attendance-stats {
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stats-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-box {
          padding: 15px;
          border-radius: 8px;
          background: #f8f9fa;
          text-align: center;
        }

        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #2c3e50;
        }

        .chart-container {
          height: 300px;
          margin-top: 20px;
        }

        @media (max-width: 768px) {
          .stats-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AttendanceStats;
