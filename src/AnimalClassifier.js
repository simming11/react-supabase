import React, { useState } from "react";

function AnimalClassifier() {
  const [imageUrl, setImageUrl] = useState("");
  const [result, setResult] = useState(null);

  const classifyAnimal = async () => {
    const response = await fetch(
      "https://api.clarifai.com/v2/models/e0be3b9d6a454f0493ac3a30784001ff/outputs",
      {
        method: "POST",
        headers: {
            Authorization: "Key 7264f73edfed46449a7ea09365a3fdd6",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: [
            {
              data: {
                image: {
                  url: imageUrl,
                },
              },
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const concepts = data.outputs?.[0]?.data?.concepts || [];
    setResult(concepts);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">🐾 Animal Classifier</h1>
      <input
        type="text"
        placeholder="วางลิงก์รูปสัตว์ที่นี่"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        className="w-full p-2 border rounded mb-3"
      />
      <button
        onClick={classifyAnimal}
        className="w-full bg-blue-500 text-white py-2 rounded"
      >
        วิเคราะห์รูป
      </button>

      {result && (
        <div className="mt-4">
          <h2 className="font-semibold mb-2">ผลลัพธ์:</h2>
          <ul>
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
