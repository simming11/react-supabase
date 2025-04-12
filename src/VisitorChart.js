import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend, Filler } from 'chart.js';
import 'chartjs-adapter-date-fns'; // For time scale support
import { supabase } from './supabaseClient';

// Register Chart.js components
ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend, Filler);

const VisitorChart = () => {
  const [timeFilter, setTimeFilter] = useState('day'); // Default to 1 day
  const [totalVisitorCount, setTotalVisitorCount] = useState(null);
  const [visitorCount, setVisitorCount] = useState(null);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  // Function to calculate the start date based on the time filter
  const getStartDate = (filter) => {
    const currentDate = new Date();
    switch (filter) {
      case 'hour':
        currentDate.setHours(currentDate.getHours() - 1);
        break;
      case 'day':
        currentDate.setDate(currentDate.getDate() - 1);
        break;
      case 'week':
        currentDate.setDate(currentDate.getDate() - 7);
        break;
      case 'month':
        currentDate.setMonth(currentDate.getMonth() - 1);
        break;
      case 'year':
        currentDate.setFullYear(currentDate.getFullYear() - 1);
        break;
      default:
        break;
    }
    return currentDate.toISOString();
  };

  // Fetch total visitor count (for display in the summary)
  useEffect(() => {
    const fetchTotalVisitorCount = async () => {
      const { count, error } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', getStartDate(timeFilter));

      if (error) {
        console.error('Error fetching total visitor count:', error.message);
      } else {
        setTotalVisitorCount(count);
      }
    };

    fetchTotalVisitorCount();
  }, [timeFilter]);

  // Fetch visitor count for /speech-to-text path (for display in the summary)
  useEffect(() => {
    const fetchVisitorCount = async () => {
      const { count, error } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .eq('path', '/speech-to-text')
        .gte('timestamp', getStartDate(timeFilter));

      if (error) {
        console.error('Error fetching visitor count for /speech-to-text:', error.message);
      } else {
        setVisitorCount(count);
      }
    };

    fetchVisitorCount();
  }, [timeFilter]);

  // Fetch data for the chart (individual visitor records for both total and /speech-to-text)
  useEffect(() => {
    const fetchChartData = async () => {
      // Fetch total visitors (all paths)
      const { data: totalData, error: totalError } = await supabase
        .from('visitors')
        .select('timestamp')
        .gte('timestamp', getStartDate(timeFilter))
        .order('timestamp', { ascending: true });

      // Fetch visitors for /speech-to-text path
      const { data: speechToTextData, error: speechToTextError } = await supabase
        .from('visitors')
        .select('timestamp')
        .eq('path', '/speech-to-text')
        .gte('timestamp', getStartDate(timeFilter))
        .order('timestamp', { ascending: true });

      if (totalError || speechToTextError) {
        console.error('Error fetching chart data:', totalError?.message || speechToTextError?.message);
        return;
      }

      // Process total visitors: Group by time intervals
      const totalTimeMap = new Map();
      totalData.forEach((entry) => {
        const timestamp = new Date(entry.timestamp);
        let timeKey;

        switch (timeFilter) {
          case 'hour':
            timeKey = timestamp.toISOString().slice(0, 16); // Group by minute
            break;
          case 'day':
            timeKey = timestamp.toISOString().slice(0, 13); // Group by hour
            break;
          case 'week':
          case 'month':
            timeKey = timestamp.toISOString().slice(0, 10); // Group by day
            break;
          case 'year':
            timeKey = timestamp.toISOString().slice(0, 7); // Group by month
            break;
          default:
            timeKey = timestamp.toISOString().slice(0, 10); // Default to day
        }

        totalTimeMap.set(timeKey, (totalTimeMap.get(timeKey) || 0) + 1);
      });

      // Process /speech-to-text visitors: Group by time intervals
      const speechToTextTimeMap = new Map();
      speechToTextData.forEach((entry) => {
        const timestamp = new Date(entry.timestamp);
        let timeKey;

        switch (timeFilter) {
          case 'hour':
            timeKey = timestamp.toISOString().slice(0, 16); // Group by minute
            break;
          case 'day':
            timeKey = timestamp.toISOString().slice(0, 13); // Group by hour
            break;
          case 'week':
          case 'month':
            timeKey = timestamp.toISOString().slice(0, 10); // Group by day
            break;
          case 'year':
            timeKey = timestamp.toISOString().slice(0, 7); // Group by month
            break;
          default:
            timeKey = timestamp.toISOString().slice(0, 10); // Default to day
        }

        speechToTextTimeMap.set(timeKey, (speechToTextTimeMap.get(timeKey) || 0) + 1);
      });

      // Combine the time keys from both datasets to ensure all timestamps are represented
      const allTimeKeys = new Set([
        ...Array.from(totalTimeMap.keys()),
        ...Array.from(speechToTextTimeMap.keys()),
      ]);
      const sortedTimeKeys = Array.from(allTimeKeys).sort();

      // Prepare data for Chart.js
      const labels = sortedTimeKeys.map((key) => new Date(key));
      const totalVisitorCounts = sortedTimeKeys.map((key) => totalTimeMap.get(key) || 0);
      const speechToTextVisitorCounts = sortedTimeKeys.map((key) => speechToTextTimeMap.get(key) || 0);

      setChartData({
        labels,
        datasets: [
          {
            label: 'Total Visitors',
            data: totalVisitorCounts,
            borderColor: '#FFD700', // Gold line for total visitors
            backgroundColor: 'rgba(255, 215, 0, 0.2)', // Gold fill with transparency
            fill: true,
            tension: 0.1,
            pointRadius: 0,
          },
          {
            label: 'Visitors to /speech-to-text',
            data: speechToTextVisitorCounts,
            borderColor: '#00C4B4', // Teal line for /speech-to-text visitors
            backgroundColor: 'rgba(0, 196, 180, 0.2)', // Teal fill with transparency
            fill: true,
            tension: 0.1,
            pointRadius: 0,
          },
        ],
      });
    };

    fetchChartData();
  }, [timeFilter]);

  // Chart options to match the style of the image
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeFilter === 'hour' ? 'minute' : timeFilter === 'day' ? 'hour' : timeFilter === 'week' || timeFilter === 'month' ? 'day' : 'month',
          tooltipFormat: 'MMM d, yyyy h:mm a',
          displayFormats: {
            minute: 'h:mm a',
            hour: 'h:mm a',
            day: 'MMM d',
            month: 'MMM yyyy',
          },
        },
        grid: {
          display: false,
        },
        ticks: {
          color: '#FFFFFF',
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Visitors',
          color: '#FFFFFF',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#FFFFFF',
        },
      },
    },
    plugins: {
      legend: {
        display: true, // Show the legend to distinguish between the two lines
        labels: {
          color: '#FFFFFF', // White text for legend labels
        },
      },
      tooltip: {
        backgroundColor: '#333',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
      },
    },
    layout: {
      padding: 20,
    },
    backgroundColor: '#1A1A1A', // Dark background
  };

  return (
    <div className="p-6 text-center bg-white rounded-lg shadow-md">
      {/* Time filter dropdown */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">กรองจำนวนผู้เข้าชมตามเวลา:</h2>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="px-6 py-2 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">ทั้งหมด</option>
          <option value="hour">1 ชั่วโมง</option>
          <option value="day">1 วัน</option>
          <option value="week">7 วัน</option>
          <option value="month">1 เดือน</option>
          <option value="year">1 ปี</option>
        </select>
      </div>

      {/* Visitor counts */}
      <div className="flex justify-between gap-8 items-center bg-gray-50 p-6 rounded-lg shadow-inner">
        <div className="flex-1 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">จำนวนผู้เข้าชมทั้งหมด:</h2>
          <p className="text-3xl font-bold text-blue-600">
            {totalVisitorCount !== null ? totalVisitorCount : 'กำลังโหลด...'}
          </p>
        </div>
        <div className="flex-1 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">จำนวนผู้เข้าชมหน้านี้:</h2>
          <p className="text-3xl font-bold text-blue-600">
            {visitorCount !== null ? visitorCount : 'กำลังโหลด...'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-6" style={{ height: '400px', backgroundColor: '#1A1A1A', padding: '20px', borderRadius: '8px' }}>
        {chartData.labels.length === 0 ? (
          <div className="flex justify-center items-center h-full text-white">
            <p>No data available for the selected time period.</p>
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
};

export default VisitorChart;