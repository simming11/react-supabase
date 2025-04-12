// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EventBooking from './EventBooking';
import Payment from './Payment';
import ReservationQR from './ReservationQR';
import AdminDashboard from './AdminDashboard';
import Login from './Login';
import ProtectedRoute from './ProtectedRoute';
import SpeechToText from './SpeechToText'; // ใช้ตำแหน่งที่เก็บ component
import Home from './home'; // เพิ่มการ import หน้า Home.js
import VisitorChart from './VisitorChart'; // Import the VisitorChart component
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* <header className="bg-blue-600 text-white p-4 text-center">
          <h1 className="text-3xl font-semibold">ระบบจองคิว</h1>
        </header> */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} /> {/* เปลี่ยนหน้าแรกเป็น Home */}
            <Route path="/payment" element={<Payment />} />
            <Route path="/reservation-qr/:id" element={<ReservationQR />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/speech-to-text" element={<SpeechToText />} />
            <Route path="/event-booking" element={<EventBooking />} />
            <Route path="/Chart" element={<VisitorChart />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
