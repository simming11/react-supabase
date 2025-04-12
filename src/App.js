import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EventBooking from './EventBooking';
import Payment from './Payment';
import ReservationQR from './ReservationQR';
import AdminDashboard from './AdminDashboard';
import Login from './Login';
import ProtectedRoute from './ProtectedRoute';
import SpeechToText from './SpeechToText';
import Home from './home';
import VisitorChart from './VisitorChart';
import AnimalClassifier from './AnimalClassifier'; // 👉 เพิ่มตรงนี้

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
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
            <Route path="/animal-classifier" element={<AnimalClassifier />} /> {/* ✅ เพิ่มหน้านี้ */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
