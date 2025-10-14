import React, { useState, useEffect, useRef } from 'react';

const RentalTimer = ({ startTime, endTime }) => {
  // 💎 1. Buat 'ref' untuk menyimpan objek audio
  const notificationSound = useRef(null);
  
  // 💎 2. State untuk melacak apakah notifikasi sudah diputar untuk timer ini
  const [hasPlayedNotification, setHasPlayedNotification] = useState(false);

  // 💎 3. Inisialisasi audio saat komponen pertama kali dimuat
  useEffect(() => {
    notificationSound.current = new Audio("../../public/sounds/notification.mp3");
  }, []);

  const calculateTimeLeft = () => {
    const now = +new Date();
    const start = +new Date(startTime);
    const end = +new Date(endTime);
    let timeLeft = {};

    if (now < start) {
      const difference = start - now;
      timeLeft = {
        status: 'UPCOMING',
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else if (now >= start && now <= end) {
      const difference = end - now;
      timeLeft = {
        status: 'ACTIVE',
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        totalSeconds: difference / 1000,
      };
    } else {
      timeLeft = { status: 'FINISHED', totalSeconds: 0 };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    // Reset status notifikasi setiap kali props (sewa) berubah
    setHasPlayedNotification(false);

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, endTime]);

  // 💎 4. useEffect baru yang khusus menangani logika notifikasi
  useEffect(() => {
    // Kondisi:
    // 1. Notifikasi belum pernah diputar (hasPlayedNotification === false)
    // 2. Timer sedang aktif
    // 3. Sisa waktu kurang dari atau sama dengan 15 menit (900 detik)
    if (
      !hasPlayedNotification &&
      timeLeft.status === 'ACTIVE' &&
      timeLeft.totalSeconds <= 900 &&
      timeLeft.totalSeconds > 0
    ) {
      // Putar suara
      notificationSound.current.play().catch(e => console.error("Gagal memutar suara:", e));
      // Set status menjadi sudah diputar agar tidak berbunyi lagi
      setHasPlayedNotification(true);
    }
  }, [timeLeft, hasPlayedNotification]); // Dijalankan setiap kali 'timeLeft' berubah

  // Sisa kode render tidak perlu diubah
  const getTimeLevelAndColor = () => {
    if (timeLeft.status === 'UPCOMING') return { color: 'bg-orange-200 text-black' };
    if (timeLeft.status === 'FINISHED' || timeLeft.totalSeconds <= 0) return { color: 'bg-gray-200 text-black' };
    if (timeLeft.totalSeconds > 3600) return { color: 'bg-green-200 text-black' };
    if (timeLeft.totalSeconds > 900) return { color: 'bg-yellow-200 text-black' };
    return { color: 'bg-red-200 text-black' };
  };

  const { color } = getTimeLevelAndColor();
  const { hours, minutes, seconds } = timeLeft;
  
  let formattedTime;
  let prefix = '';

  if (timeLeft.status === 'UPCOMING') {
    prefix = 'Starts in ';
    formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else if (timeLeft.status === 'ACTIVE') {
    prefix = '⏱ ';
    formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    formattedTime = "Finished";
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${color}`}>
      <span>{prefix}{formattedTime}</span>
    </div>
  );
};

export default RentalTimer;