import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import bcrypt from 'bcryptjs';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // ฟังก์ชัน Login แบบปกติ
  const handleLogin = async () => {
    const { data, error } = await supabase
      .from('admins')
      .select('id, username, password_hash')
      .eq('username', username)
      .single();

    if (error || !data) {
      alert('ผู้ใช้ไม่ถูกต้อง');
      return;
    }

    const isValid = await bcrypt.compare(password, data.password_hash);
    if (!isValid) {
      alert('รหัสผ่านไม่ถูกต้อง');
      return;
    }

    localStorage.setItem('adminUser', JSON.stringify({ id: data.id, username: data.username }));
    navigate('/admin');
  };

  // ฟังก์ชัน Login ด้วย Google
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`
      }
    });
    if (error) console.error('Google login failed:', error.message);
  };

  // ตรวจจับการ login สำเร็จจาก Google
  useEffect(() => {
    // This will check if the user is logged in via Google
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
    
        localStorage.setItem('adminUser', JSON.stringify({ id: session.user.id, username: session.user.user_metadata.full_namel }));
        navigate('/admin');
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {

        localStorage.setItem('adminUser', JSON.stringify({ id: session.user.id, username: session.user.user_metadata.full_name}));
        navigate('/admin');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

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
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mb-3"
        >
          เข้าสู่ระบบ
        </button>

        <button
          onClick={loginWithGoogle}
          className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
        >
          Login with Google
        </button>
      </div>
    </div>
  );
}

export default Login;
