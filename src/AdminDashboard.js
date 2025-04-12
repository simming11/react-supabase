import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [reservations, setReservations] = useState([]);
  const [events, setEvents] = useState([]);  // State to hold events
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false); // To toggle modal visibility
  const [totalReservations, setTotalReservations] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const reservationsPerPage = 5; // Set the number of reservations per page
  const [editingEvent, setEditingEvent] = useState(null);
  // Add the state for editing modal visibility
  const [showEditModal, setShowEditModal] = useState(false); // Fix: Add showEditModal state
  const [newImageFile, setNewImageFile] = useState(null); // State to store the new image file
  const [visitorCount, setVisitorCount] = useState(null); // จำนวนผู้เข้าชม path นี้
  const [totalVisitorCount, setTotalVisitorCount] = useState(null); // จำนวนผู้เข้าชมทั้งหมด
  const [timeFilter, setTimeFilter] = useState('all'); // ช่วงเวลาที่เลือก (all, hour, day, week, month, year)

  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    poster: null // To store the selected poster image file
  });
  const navigate = useNavigate();

  // Fetch functions moved outside of useEffect
  const fetchReservations = async () => {
    const offset = (currentPage - 1) * reservationsPerPage;

    const { data: reservationData, error, count } = await supabase
      .from('reservations')
      .select('*', { count: 'exact' })
      .order('reservation_date', { ascending: false })
      .range(offset, offset + reservationsPerPage - 1);

    if (error) {
      console.error('Error fetching reservations:', error.message);
    } else {
      setReservations(reservationData);
      setTotalReservations(count);
    }
  };

  const fetchEvents = async () => {
    const { data: eventData, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error.message);
    } else {
      setEvents(eventData);
    }
  };

  useEffect(() => {
    const fetchUserAndInitialData = async () => {
      const storedUser = localStorage.getItem('adminUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
       
      }

      await fetchReservations(); // ดึงจองตอนโหลด
      await fetchEvents();       // ดึงอีเวนต์ตอนโหลด
    };

    fetchUserAndInitialData();


    // ✅ Realtime subscription: reservations
    const reservationChannel = supabase
      .channel('realtime:reservations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reservations',
      }, (payload) => {
    
        fetchReservations(); // re-fetch
      })
      .subscribe();

    // ✅ Realtime subscription: events
    const eventsChannel = supabase
      .channel('realtime:events')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events',
      }, (payload) => {
      
        fetchEvents(); // re-fetch
      })
      .subscribe();

    // 🔚 Cleanup subscription
    return () => {
      supabase.removeChannel(reservationChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, [currentPage]);

  // ฟังก์ชันสำหรับการคำนวณวันที่ตามช่วงเวลา
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

  // useEffect สำหรับการดึงจำนวนผู้เข้าชมทั้งหมด
  useEffect(() => {
    const fetchTotalVisitorCount = async () => {
      const { count, error } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', getStartDate(timeFilter)); // ใช้เวลาในการกรองข้อมูล

      if (error) {
        console.error('Error fetching total visitor count:', error.message);
      } else {
        setTotalVisitorCount(count);
      }
    };

    fetchTotalVisitorCount();
  }, [timeFilter]); // รันใหม่เมื่อมีการเปลี่ยนแปลงเวลา

  // useEffect สำหรับการดึงจำนวนผู้เข้าชม path /speech-to-text
  useEffect(() => {
    const fetchVisitorCount = async () => {
      const { count, error } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .eq('path', '/speech-to-text') // นับเฉพาะ path นี้
        .gte('timestamp', getStartDate(timeFilter)); // ใช้เวลาในการกรองข้อมูล

      if (error) {
        console.error('Error fetching visitor count for /speech-to-text:', error.message);
      } else {
        setVisitorCount(count);
      }
    };

    fetchVisitorCount();
  }, [timeFilter]); // รันใหม่เมื่อมีการเปลี่ยนแปลงเวลา

  // Handle input changes
  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setNewEvent({ ...newEvent, [name]: value });
  };

  // Handle file input for the poster image
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setNewEvent({ ...newEvent, poster: file });
  };



  const handleNextPage = () => {
    if (currentPage * reservationsPerPage < totalReservations) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      setUser(null);
      localStorage.removeItem('adminUser');
      navigate('/');
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.start_time || !newEvent.end_time) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    let posterUrl = '';

    if (newEvent.poster) {
      const fileExt = newEvent.poster.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `posters/${fileName}`;

      try {
        // 1️⃣ อัปโหลดรูปโปสเตอร์
        const { error: uploadError } = await supabase.storage
          .from('event-posters')
          .upload(filePath, newEvent.poster);

        if (uploadError) {
          console.error('❌ Error uploading poster:', uploadError.message);
          alert('ไม่สามารถอัพโหลดโปสเตอร์ได้');
          return;
        }

        // 2️⃣ สร้าง public URL สำหรับรูป
        const { data: urlData } = supabase
          .storage
          .from('event-posters')
          .getPublicUrl(filePath);

        posterUrl = urlData.publicUrl;
      } catch (error) {
        console.error('❌ Unexpected error during upload:', error.message);
        alert('ไม่สามารถอัพโหลดโปสเตอร์ได้');
        return;
      }
    }

    // 3️⃣ Insert ข้อมูล event พร้อมโปสเตอร์ URL
    const { data, error } = await supabase
      .from('events')
      .insert([{
        name: newEvent.name,
        description: newEvent.description,
        start_time: newEvent.start_time,
        end_time: newEvent.end_time,
        poster_url: posterUrl
      }]);

    if (error) {
      console.error('❌ Error creating event:', error.message);
      alert('เกิดข้อผิดพลาดในการสร้างอีเวนต์');
    } else {
      setShowModal(false);
      setNewEvent({ name: '', description: '', start_time: '', end_time: '', poster: null });
    }
  };

  const handleEdit = (event) => {
    setEditingEvent({ ...event });
    setShowEditModal(true); // Open the edit modal
  };

  const handleSaveEdit = async () => {
    const { id, name, description, start_time, end_time, image } = editingEvent;

    // Check if there's a new image file
    let imageUrl = image; // Default to the current image if no new image is provided

    if (newImageFile) {
      // If a new image is selected, upload it
      const { data, error: uploadError } = await supabase.storage
        .from('event-posters') // Assuming the storage bucket is named "event-posters"
        .upload(`event_${id}_${newImageFile.name}`, newImageFile);

      if (uploadError) {
        alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + uploadError.message);
        return;
      }

      // Get the URL of the uploaded image
      imageUrl = data?.Key; // This gives the URL of the uploaded image
    }

    // Now update the event record in the database
    const { error } = await supabase
      .from('events')
      .update({
        name,
        description,
        start_time,
        end_time,
        image: imageUrl, // Save the image URL
      })
      .eq('id', id);

    if (error) {
      alert('เกิดข้อผิดพลาดในการอัปเดต: ' + error.message);
    } else {
      setShowEditModal(false); // Close the edit modal
      setEditingEvent(null); // Clear the editing event state
      fetchEvents(); // Reload events
    }
  };



  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('คุณแน่ใจว่าต้องการลบอีเวนต์นี้หรือไม่?');
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      alert('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    } else {
      fetchEvents(); // Reload events
    }
  };









  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold"></h2>
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-lg">{user.username || user.username.user_metadata.full_name}</span>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              ออกจากระบบ
            </button>
          </div>
        ) : (
          <span>ไม่ได้เข้าสู่ระบบ</span>
        )}
      </div>
      <div className="p-4 text-center">
        <div className="p-6 text-center bg-white rounded-lg shadow-md">
          {/* ตัวเลือกสำหรับกรองตามเวลา */}
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

          {/* จำนวนผู้เข้าชมทั้งหมด */}
          <div className="flex justify-between gap-8 items-center bg-gray-50 p-6 rounded-lg shadow-inner">
            <div className="flex-1 text-center">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">จำนวนผู้เข้าชมทั้งหมด:</h2>
              <p className="text-3xl font-bold text-blue-600">
                {totalVisitorCount !== null ? totalVisitorCount : 'กำลังโหลด...'}
              </p>
            </div>

            {/* จำนวนผู้เข้าชมของ path /speech-to-text */}
            <div className="flex-1 text-center">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">จำนวนผู้เข้าชมหน้านี้:</h2>
              <p className="text-3xl font-bold text-blue-600">
                {visitorCount !== null ? visitorCount : 'กำลังโหลด...'}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Button to create new event */}
      <div className="mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          สร้างอีเวนต์
        </button>
      </div>

      {/* Modal for creating a new event */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-100 sm:w-1/2">
            <h3 className="text-2xl mb-4">สร้างอีเวนต์ใหม่</h3>
            <div className="mb-4">
              <input
                type="text"
                name="name"
                value={newEvent.name}
                onChange={handleEventChange}
                placeholder="ชื่ออีเวนต์"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <textarea
                name="description"
                value={newEvent.description}
                onChange={handleEventChange}
                placeholder="รายละเอียดอีเวนต์"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4 ">
              <label className="block mb-2 text-sm font-medium text-gray-700">เวลาเริ่มและสิ้นสุด</label>
              <input
                type="datetime-local"
                name="start_time"
                value={newEvent.start_time}
                onChange={handleEventChange}
                className="w-full p-2 border rounded"
              />
              <input
                type="datetime-local"
                name="end_time"
                value={newEvent.end_time}
                onChange={handleEventChange}
                className="w-full p-2 border rounded"
              />
            </div>
            {/* File input for poster image */}
            <div className="mb-4">
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full p-2 border rounded"
                accept="image/*" // Only allow image files
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleCreateEvent}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                สร้าง
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-semibold">ข้อมูลการจองทั้งหมด</h2>

        {/* Display Reservations */}
        <div className="overflow-x-auto bg-white shadow-lg rounded-lg mt-6">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">ชื่อผู้จอง</th>
                <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">หมายเลขคิว</th>
                <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">สถานะการชำระเงิน</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{reservation.name} {reservation.surname}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{reservation.queue_number}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${reservation.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                        reservation.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'}`}
                    >
                      {reservation.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 text-white rounded-lg disabled:bg-white disabled:border disabled:border-gray-300 disabled:text-gray-500 bg-blue-500 hover:bg-blue-600"
          >
            ย้อนกลับ
          </button>
          <span className="text-lg"> {currentPage}</span>
          <button
            onClick={handleNextPage}
            disabled={currentPage * reservationsPerPage >= totalReservations}
            className={`px-4 py-2 text-white rounded-lg ${currentPage * reservationsPerPage >= totalReservations
              ? 'bg-white border border-gray-300 text-gray-500'
              : 'bg-blue-500 hover:bg-blue-600'
              }`}
          >
            ถัดไป
          </button>
        </div>

      </div>


      <h2 className="py-5 px-4 text-3xl font-semibold">ข้อมูลอีเวนต์ทั้งหมด</h2>
      {/* Display Events */}
      <div className="overflow-x-auto bg-white shadow-lg rounded-lg mt-6">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">ชื่ออีเวนต์</th>
              <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">รายละเอียด</th>
              <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">เวลาเริ่ม</th>
              <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">เวลาสิ้นสุด</th>
              <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">การจัดการ</th> {/* 👈 เพิ่มตรงนี้ */}
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-900">{event.name}</td>
                <td className="py-3 px-4 text-sm text-gray-900">{event.description}</td>
                <td className="py-3 px-4 text-sm text-gray-900">{new Date(event.start_time).toLocaleString()}</td>
                <td className="py-3 px-4 text-sm text-gray-900">{new Date(event.end_time).toLocaleString()}</td>
                <td className="py-3 px-4 text-sm text-gray-900">
                  <button
                    className="text-blue-600 hover:underline mr-3"
                    onClick={() => handleEdit(event)}
                  >
                    แก้ไข
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDelete(event.id)}
                  >
                    ลบ
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>
      {/* Edit Event Modal */}
      {showEditModal && editingEvent && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-100 sm:w-1/2">
            <h3 className="text-2xl mb-4">แก้ไขอีเวนต์</h3>
            <div className="mb-4">
              <input
                type="text"
                name="name"
                value={editingEvent.name}
                onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                placeholder="ชื่ออีเวนต์"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <textarea
                name="description"
                value={editingEvent.description}
                onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                placeholder="รายละเอียดอีเวนต์"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">เวลาเริ่มและสิ้นสุด</label>
              <input
                type="datetime-local"
                name="start_time"
                value={editingEvent.start_time}
                onChange={(e) => setEditingEvent({ ...editingEvent, start_time: e.target.value })}
                className="w-full p-2 border rounded"
              />
              <input
                type="datetime-local"
                name="end_time"
                value={editingEvent.end_time}
                onChange={(e) => setEditingEvent({ ...editingEvent, end_time: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            {/* Optionally, add a file input for poster image */}
            <div className="mb-4">
              <input
                type="file"
                onChange={(e) => handleFileChange(e)} // You can use the same handleFileChange function if needed
                className="w-full p-2 border rounded"
                accept="image/*" // This ensures only image files can be selected
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                บันทึก
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
