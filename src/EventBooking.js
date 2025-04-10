import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import './css/EventBooking.css';

function EventBooking() {
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [selectedEventId, setSelectedEventId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvents = async () => {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('start_time', { ascending: true });

            if (error) {
                console.error('Error fetching events:', error.message);
            } else {
                setEvents(data);
            }
        };

        fetchEvents(); // 🔹 โหลดครั้งแรก

        // 🔁 Subscribe to realtime updates
        const channel = supabase
            .channel('realtime-events')
            .on(
                'postgres_changes',
                {
                    event: '*', // เพิ่ม, ลบ, แก้ไข
                    schema: 'public',
                    table: 'events',
                },
                (payload) => {
                    console.log('📡 Realtime event payload:', payload);
                    fetchEvents(); // รีโหลดใหม่เมื่อมีการเปลี่ยนแปลง
                }
            )
            .subscribe();

        // 🔚 ล้างการ subscribe เมื่อ component ถูก unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleBooking = (eventId) => {
        setSelectedEventId(eventId);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setName('');
    };

    const handleSubmit = async () => {
        if (!name) {
            alert('กรุณากรอกชื่อ');
            return;
        }

        if (!selectedEventId) {
            alert('ไม่พบอีเวนต์ที่เลือก');
            return;
        }

        const { data: latestQueue, error: queueError } = await supabase
            .from('reservations')
            .select('queue_number')
            .eq('event_id', selectedEventId)
            .order('queue_number', { ascending: false })
            .limit(1)
            .single();

        if (queueError && queueError.code !== 'PGRST116') {
            console.error('❌ Error fetching latest queue number:', queueError.message);
            alert('เกิดข้อผิดพลาดในการดึงคิวล่าสุด');
            return;
        }

        const nextQueueNumber = latestQueue ? latestQueue.queue_number + 1 : 1;

        const { data, error } = await supabase
            .from('reservations')
            .insert([{
                event_id: selectedEventId,
                name,
                surname,
                payment_status: 'pending',
                queue_number: nextQueueNumber,
            }])
            .select();

        if (error) {
            console.error('❌ Error making reservation:', error.message);
            alert('เกิดข้อผิดพลาดในการจองคิว');
            return;
        }

        if (data && data.length > 0) {
            navigate(`/reservation-qr/${data[0].id}`);
            closeModal();
        } else {
            alert('เกิดข้อผิดพลาดในการจองคิว');
        }
    };

    return (
        <div className="event-booking-container">
            <h2>เลือกอีเวนต์ที่ต้องการจอง</h2>
            <div className="events-list">
                {events.map(event => (
                    <div className="event-card" key={event.id}>
                        <h3 className="event-name">{event.name}</h3>
                        <button onClick={() => handleBooking(event.id)}>
                            จอง
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>กรอกข้อมูลการจอง</h3>
                        <input
                            type="text"
                            placeholder="ชื่อ"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                        <div className="modal-actions">
                            <button onClick={handleSubmit}>ยืนยันการจอง</button>
                            <button onClick={closeModal}>ยกเลิก</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EventBooking;
