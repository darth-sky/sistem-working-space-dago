import React, { useState, useEffect } from 'react';

const RentalTimer = ({ endTime }) => {
  // Fungsi untuk menghitung sisa waktu
  const calculateTimeLeft = () => {
    const difference = +new Date(endTime) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        totalSeconds: difference / 1000,
      };
    } else {
      timeLeft = { totalSeconds: 0 };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    // Set interval untuk update timer setiap 1 detik
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Ini adalah cleanup function. Sangat penting untuk mencegah memory leak.
    // Timer akan dihapus saat komponen tidak lagi ditampilkan.
    return () => clearInterval(timer);
  }, [endTime]); // Dependency array, effect akan dijalankan ulang jika endTime berubah

  // Fungsi untuk menentukan warna berdasarkan sisa waktu
  const getTimeLevelAndColor = () => {
    const { totalSeconds } = timeLeft;
    if (totalSeconds <= 0) return { level: 'gray', color: 'bg-gray-200 text-black' };
    if (totalSeconds > 3600) return { level: 'green', color: 'bg-green-200 text-black' }; // > 1 jam
    if (totalSeconds > 900) return { level: 'yellow', color: 'bg-yellow-200 text-black' }; // > 15 menit
    return { level: 'red', color: 'bg-red-200 text-black' }; // <= 15 menit
  };

  const { color } = getTimeLevelAndColor();
  const { hours, minutes, seconds, totalSeconds } = timeLeft;
  
  const formattedTime = totalSeconds > 0 
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : "Finished";

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${color}`}
    >
      {totalSeconds > 0 && '⏱'} <span>{formattedTime}</span>
    </div>
  );
};

export default RentalTimer;