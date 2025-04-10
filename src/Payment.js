import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useLocation, useNavigate } from 'react-router-dom';

function Payment() {
    const location = useLocation();
    const navigate = useNavigate();
    const { reservationId } = location.state || {};

    const [reservation, setReservation] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('pending');
    const [amount, setAmount] = useState(100); // ตัวอย่างราคาคงที่

    useEffect(() => {
        const fetchReservation = async () => {
            const { data, error } = await supabase
                .from('reservations')
                .select('id, queue_number, name, surname')
                .eq('id', reservationId);

            if (error) {
                console.error('Error fetching reservation:', error.message);
                alert('เกิดข้อผิดพลาดในการดึงข้อมูลการจอง');
            } else if (data && data.length > 0) {
                setReservation(data[0]);
            }
        };

        if (reservationId) {
            fetchReservation();
        }
    }, [reservationId]);

    const handlePayment = async () => {
        if (amount <= 0) {
            alert('จำนวนเงินไม่ถูกต้อง');
            return;
        }
    
        const { data, error } = await supabase
            .from('payments')
            .insert([{
                reservation_id: reservationId,
                amount,
                payment_status: 'paid',
                payment_date: new Date().toISOString()
            }]);
    
        if (error) {
            console.error('Error processing payment:', error.message);
            alert('เกิดข้อผิดพลาดในการชำระเงิน');
            return;
        }
    
        await supabase
            .from('reservations')
            .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
            .eq('id', reservationId);
    
        setPaymentStatus('paid');
    
        // 📤 เรียก EasySlip API
        try {
            const slipRes = await fetch('http://localhost:5000/api/easyslip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': '7429373f-1df5-4389-bc3c-2fbc25f5b34d' // 👈 แทนด้วย API key ของคุณ
                },
                body: JSON.stringify({
                    company_id: '20', // 👈 แทนด้วย Company ID
                    transaction_date: new Date().toISOString(),
                    customer_name: `${reservation.name} ${reservation.surname}`,
                    items: [
                        {
                            name: `ค่าบริการจองคิว #${reservation.queue_number}`,
                            quantity: 1,
                            price: amount
                        }
                    ],
                    total_amount: amount
                })
            });
    
            const slipData = await slipRes.json();
    
            if (!slipRes.ok) {
                console.error('❌ Error creating slip:', slipData.message);
            } else {
                console.log('✅ Slip created successfully:', slipData);
                // คุณอาจเก็บ slipData.id หรือ slipData.url ลง Supabase ได้ด้วย
            }
        } catch (err) {
            console.error('❌ Exception when calling EasySlip:', err);
        }
    
        // ไปหน้า QR หลังชำระ
        navigate(`/reservation-qr/${reservationId}`);
    };
    
    
    
    if (!reservation) {
        return <div className="text-center mt-10 text-gray-500">กำลังโหลดข้อมูลการจอง...</div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-semibold text-center text-blue-700 mb-6">💳 หน้าชำระเงิน</h2>

                <div className="mb-4">
                    <p className="text-gray-600">หมายเลขคิว:</p>
                    <p className="text-lg font-bold text-gray-800">{reservation.queue_number}</p>
                </div>

                <div className="mb-4">
                    <p className="text-gray-600">ชื่อผู้จอง:</p>
                    <p className="text-gray-800">{reservation.name} {reservation.surname}</p>
                </div>

                <div className="mb-6">
                    <p className="text-gray-600">จำนวนเงินที่ต้องชำระ:</p>
                    <p className="text-2xl font-semibold text-green-600">{amount.toFixed(2)} บาท</p>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={paymentStatus === 'paid'}
                    className={`w-full py-3 rounded-lg text-white text-lg font-medium transition duration-300
                        ${paymentStatus === 'paid' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {paymentStatus === 'paid' ? '✅ ชำระเงินแล้ว' : 'ชำระเงิน'}
                </button>

                <p className="mt-4 text-sm text-center text-gray-500">
                    สถานะ: <span className="font-medium">{paymentStatus}</span>
                </p>
            </div>
        </div>
    );
}

export default Payment;
