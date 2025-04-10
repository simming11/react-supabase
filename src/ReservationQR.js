import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { supabase } from './supabaseClient'; // Make sure this path is correct
import html2canvas from 'html2canvas';

function ReservationQR() {
    const { id } = useParams();
    const [reservation, setReservation] = useState(null);
    const qrRef = useRef(null);  // Reference for the QR code container
    const reservationRef = useRef(null);  // Reference for the entire reservation section
    const downloadBtnRef = useRef(null);  // Reference for the download button
    const [loading, setLoading] = useState(true); // Track loading state

    useEffect(() => {
        const fetchReservationData = async () => {
            setLoading(true);  // Start loading

            const { data, error } = await supabase
                .from('reservations')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching reservation:', error.message);
            } else {
                setReservation(data);
            }
            setLoading(false);  // End loading
            console.log('Fetched reservation data:', data);
        };

        fetchReservationData();
    }, [id]);

    // Function to download the entire reservation as an image, excluding the download button
    const downloadReservation = () => {
        if (reservationRef.current) {
            // Temporarily hide the download button
            if (downloadBtnRef.current) {
                downloadBtnRef.current.style.display = 'none';
            }

            html2canvas(reservationRef.current).then((canvas) => {
                const link = document.createElement('a');
                link.href = canvas.toDataURL();  // Converts canvas to image URL
                link.download = `reservation-${reservation.id}-details.png`;  // Set the file name
                link.click();  // Trigger the download

                // Restore the download button visibility after download
                if (downloadBtnRef.current) {
                    downloadBtnRef.current.style.display = 'block';
                }
            });
        }
    };

    return (
        <div>
            <div
                className="modal-overlay"
                ref={reservationRef}
            >
                <div className="modal-content">
                    <h2 className="text-xl font-semibold mb-4">🎟️ ข้อมูลการจองของคุณ</h2>

                    {/* Show loading spinner or message if still loading */}
                    {loading ? (
                        <div className="text-center mt-10 text-gray-500">กำลังโหลดข้อมูล...</div>
                    ) : (
                        <>
                            <p>
                                หมายเลขคิว: <strong>{reservation.queue_number}</strong>
                            </p>
                            <p>ชื่อ: {reservation.name}</p>
                            {/* <p>สถานะการชำระเงิน: <span className="text-green-600 font-medium">{reservation.payment_status}</span></p> */}
                        </>
                    )}

                    {/* Always visible download button */}
                    <button
                        ref={downloadBtnRef}
                        onClick={downloadReservation}
                        className="mt-6 py-2 px-4 bg-blue-600 text-white rounded-md"
                    >
                        ดาวน์โหลดข้อมูลการจอง
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ReservationQR;
