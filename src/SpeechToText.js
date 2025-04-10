import React, { useState, useEffect, useRef } from 'react';

const SpeechToText = () => {
  const [transcript, setTranscript] = useState([]); // เก็บข้อความที่แปลงจากเสียงเป็น Array
  const [isRecording, setIsRecording] = useState(false); // สถานะการบันทึก
  const [language, setLanguage] = useState('th-TH'); // ภาษาที่เลือก
  const recognitionRef = useRef(null); // ใช้ useRef เพื่อเก็บการตั้งค่า recognition

  useEffect(() => {
    // ตรวจสอบว่าเบราว์เซอร์รองรับ Web Speech API หรือไม่
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      alert('Web Speech API not supported in this browser.');
      return;
    }

    // สร้าง instance ของ SpeechRecognition
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = language; // ใช้ภาษาที่เลือก
    recognition.continuous = true; // ให้ฟังเสียงต่อเนื่อง
    recognition.interimResults = true; // แสดงผลลัพธ์ชั่วคราว

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      
      // เพิ่มคำพูดใหม่ใน transcript (เป็นบรรทัดใหม่)
      setTranscript(prevTranscript => [...prevTranscript, currentTranscript]);
    };

    // เก็บ reference ของ recognition ใน useRef
    recognitionRef.current = recognition;

    // Cleanup เมื่อ component ถูก unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]); // useEffect จะทำงานใหม่เมื่อภาษาถูกเปลี่ยน

  // ฟังก์ชันเริ่มบันทึก
  const startRecording = () => {
    const recognition = recognitionRef.current;
    if (recognition) { // ตรวจสอบว่า recognition ถูกสร้างแล้ว
      setIsRecording(true);
      recognition.start();
    } else {
      console.error('Speech recognition not initialized');
    }
  };

  // ฟังก์ชันหยุดบันทึก
  const stopRecording = () => {
    const recognition = recognitionRef.current;
    if (recognition) { // ตรวจสอบว่า recognition ถูกสร้างแล้ว
      setIsRecording(false);
      recognition.stop();
    } else {
      console.error('Speech recognition not initialized');
    }
  };

  // ฟังก์ชันคัดลอกข้อความ
  const copyTranscript = () => {
    const textToCopy = transcript.join(' '); // รวมข้อความทั้งหมดเป็นข้อความเดียว
    navigator.clipboard.writeText(textToCopy) // คัดลอกไปยังคลิปบอร์ด
      .then(() => {
        alert('ข้อความถูกคัดลอกแล้ว!');
      })
      .catch((err) => {
        console.error('ไม่สามารถคัดลอกข้อความได้', err);
      });
  };

  // ฟังก์ชันลบข้อความ
  const clearTranscript = () => {
    setTranscript([]); // รีเซ็ต transcript เป็นอาร์เรย์ว่าง
  };

  // ฟังก์ชันเปลี่ยนภาษา
  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-2xl font-semibold text-center mb-4">Speech to Text</h1>

      {/* Dropdown เลือกภาษา */}
      <div className="flex justify-center mb-6">
        <select
          value={language}
          onChange={handleLanguageChange}
          className="px-6 py-2 rounded-lg border border-gray-300"
        >
          <option value="th-TH">ไทย</option>
          <option value="en-US">English</option>
          <option value="ar-EG">Arabic</option>
          <option value="zh-CN">Chinese (Simplified)</option>
        </select>
      </div>

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className={`px-6 py-2 rounded-lg text-white ${
            isRecording ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
          } transition duration-300`}
        >
          {isRecording ? 'Recording...' : 'Start Recording'}
        </button>
        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className={`px-6 py-2 rounded-lg text-white ${
            !isRecording ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
          } transition duration-300`}
        >
          Stop Recording
        </button>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h2 className="text-xl font-medium">Transcription:</h2>
        <div className="mt-2 text-gray-700">
          {/* แสดง transcript ทีละบรรทัด */}
          {transcript.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      </div>

      {/* ปุ่มคัดลอกข้อความ */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={copyTranscript}
          className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition duration-300"
        >
          Copy Text
        </button>

        {/* ปุ่มลบข้อความ */}
        <button
          onClick={clearTranscript}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300"
        >
          Clear Text
        </button>
      </div>
    </div>
  );
};

export default SpeechToText;
