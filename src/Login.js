import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import bcrypt from 'bcryptjs';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    // ดึง user จาก Supabase
    const { data, error } = await supabase
      .from('admins')  // เปลี่ยนจาก 'users' เป็น 'admins'
      .select('id, username, password_hash')
      .eq('username', username)
      .single();

    if (error || !data) {
      alert('ไม่พบผู้ใช้หรือชื่อผู้ใช้ไม่ถูกต้อง');
      return;
    }

    // ใช้ bcrypt เพื่อเปรียบเทียบรหัสผ่านที่ผู้ใช้ป้อนกับรหัสผ่านที่เก็บในฐานข้อมูล
    const isValid = await bcrypt.compare(password, data.password_hash);

    if (!isValid) {
      alert('รหัสผ่านไม่ถูกต้อง');
      return;
    }

    // เก็บสถานะ login ใน localStorage หรือ context
    localStorage.setItem('adminUser', JSON.stringify({ id: data.id, username: data.username }));

    // หลังจากเข้าสู่ระบบสำเร็จ ไปที่หน้าผู้ดูแลระบบ (admin)
    // alert('เข้าสู่ระบบสำเร็จ');
    navigate('/admin');  // เปลี่ยนไปยังหน้าผู้ดูแลระบบ
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-xl p-8 rounded-xl w-full max-w-sm">
        <h2 className="text-xl font-bold text-center mb-4">เข้าสู่ระบบแอดมิน</h2>
        <input
          type="text"
          placeholder="ชื่อผู้ใช้"
          className="w-full border p-2 rounded mb-3"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="รหัสผ่าน"
          className="w-full border p-2 rounded mb-4"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          เข้าสู่ระบบ
        </button>
      </div>
    </div>
  );
}

export default Login;
