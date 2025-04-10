// src/home.js
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
            {/* หัวข้อหลัก */}
            <h1 className="text-3xl font-semibold mb-4 text-blue-700 text-center py-6 border-b-4 border-blue-500 bg-blue-50">
  Explore Our Queue Management & Service Systems
</h1>


            <p className="text-xl text-center mb-8 px-6 text-gray-700">
                ระบบนี้ช่วยให้คุณสามารถจองคิวสำหรับบริการต่างๆ ได้อย่างสะดวกและรวดเร็ว เพียงแค่เลือกบริการที่คุณต้องการ
                แล้วระบบจะช่วยให้คุณสามารถจัดการกับคิวได้อย่างมีประสิทธิภาพ
            </p>

            {/* การอธิบายบริการต่างๆ ในระบบ */}
            <div className="flex flex-col sm:flex-row gap-8 sm:gap-16 p-6 justify-center items-center">

                {/* ปุ่มไปที่ Speech-to-Text */}
                <div className="text-center bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300">
                    <h2 className="text-2xl font-semibold mb-2 text-blue-600">Speech to Text</h2>
                    <p className="mb-4 text-gray-600">
                        หากคุณต้องการแปลงเสียงพูดเป็นข้อความในระบบ เพียงแค่กดเริ่มบันทึก และระบบจะช่วยแปลงคำพูดของคุณ
                        ให้กลายเป็นข้อความที่สามารถใช้ได้ทันที
                    </p>
                    <Link to="/speech-to-text">
                        <button className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300">
                            Go to Speech to Text
                        </button>
                    </Link>
                </div>

                {/* ปุ่มไปที่ Event Booking */}
                <div className="text-center bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300">
                    <h2 className="text-2xl font-semibold mb-2 text-green-600">Event Booking</h2>
                    <p className="mb-4 text-gray-600">
                        ระบบจองคิวนี้ช่วยให้คุณสามารถเลือกจองเวลาสำหรับกิจกรรมต่างๆ เช่น การจองห้องประชุม หรือกิจกรรมพิเศษ
                        ในเวลาที่คุณสะดวก
                    </p>
                    <Link to="/event-booking">
                        <button className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-300">
                            Go to Event Booking
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;
