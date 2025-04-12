import React, { useState } from "react";

function AnimalClassifier() {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]); // ตัด "data:image/...;base64," ออก
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  const classifyAnimal = async () => {
    if (!imageFile) return;
    const base64Image = await fileToBase64(imageFile);
  
    try {
      const response = await fetch(
        "https://api.clarifai.com/v2/models/e0be3b9d6a454f0493ac3a30784001ff/outputs",
        {
          method: "POST",
          headers: {
            Authorization: "Key 7264f73edfed46449a7ea09365a3fdd6", // เปลี่ยนเป็น API Key ของคุณ
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_app_id: {
              user_id: "clarifai",  // ✅ หากไม่ได้สร้าง project ใหม่ จะใช้ค่า default นี้ได้เลย
              app_id: "main",
            },
            inputs: [
              {
                data: {
                  image: {
                    base64: base64Image,
                  },
                },
              },
            ],
          }),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error("Clarifai error:", data);
        alert("❌ วิเคราะห์ไม่สำเร็จ: " + (data.status?.description || "Unknown Error"));
        return;
      }
  
      const concepts = data.outputs?.[0]?.data?.concepts || [];
      setResult(concepts);
    } catch (error) {
      console.error("Fetch error:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับ Clarifai");
    }
  };
  

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">🐾 Animal Classifier (Upload)</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="w-full p-2 border rounded mb-3"
      />

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Preview"
          className="w-full h-auto mb-3 rounded shadow"
        />
      )}

      <button
        onClick={classifyAnimal}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        วิเคราะห์รูป
      </button>

      {result && (
        <div className="mt-4">
          <h2 className="font-semibold mb-2">ผลลัพธ์:</h2>
          <ul className="list-disc pl-5">
            {result.map((item) => (
              <li key={item.id}>
                {item.name} — {(item.value * 100).toFixed(2)}%
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AnimalClassifier;
