// src/pages/Kasir/BukaSesi/BukaSesi.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import {
    apiGetAllOpenSessions,
    apiGetRecentClosedSessions,
} from '../../../services/service';
import { formatRupiah } from '../../../utils/formatRupiah';
import logoImage from '../../../assets/images/logo.png';
import { Modal, message, Spin } from 'antd';
import dayjs from 'dayjs';

const BukaSesi = () => {

    // --- (PERUBAHAN 1: Ambil 'userRole' dari useAuth) ---
    const {
        openSession,
        getLastSaldo,
        activeSession,
        isSessionLoading,
        checkActiveSession,
        joinSession,
        userRole, // <-- TAMBAHKAN INI
        isLoggedIn
    } = useAuth();
    // --- (AKHIR PERUBAHAN 1) ---

    const [namaSesi, setNamaSesi] = useState('');
    const [saldoAwal, setSaldoAwal] = useState('');
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const navigate = useNavigate();

    const [openSessions, setOpenSessions] = useState([]);
    const [closedSessions, setClosedSessions] = useState([]);

    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // Set nama sesi default (Tidak berubah)
    useEffect(() => {
        const tgl = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        setNamaSesi(`Cashier ${tgl}`);
    }, []);

    // --- (PERUBAHAN 2: Buat fungsi navigasi berdasarkan peran) ---
    const navigateToDashboard = (role) => {
        if (role === 'admin_tenant') {
            navigate('/ordertenant', { replace: true });
        } else {
            // Default ke kasir (atau peran lain yang mungkin)
            navigate('/transaksikasir', { replace: true });
        }
    };
    // --- (AKHIR PERUBAHAN 2) ---

    // Fetch data sesi (Tidak berubah)
    const fetchAllSessions = async () => {
        try {
            const [saldoData, openSessionsData, closedSessionsData] = await Promise.all([
                getLastSaldo(),
                apiGetAllOpenSessions(),
                apiGetRecentClosedSessions()
            ]);

            setSaldoAwal(saldoData != null ? saldoData.toString() : '0');
            setOpenSessions(openSessionsData.sessions || []);
            setClosedSessions(closedSessionsData.sessions || []);
        } catch (err) {
            setError(err.message || 'Gagal memuat data sesi');
            message.error(err.message || 'Gagal memuat data sesi');
            setSaldoAwal('0');
        } finally {
            setIsPageLoading(false);
        }
    };

    // --- (PERUBAHAN 3: Update useEffect untuk navigasi berbasis peran) ---
    useEffect(() => {
        // Jangan lakukan apa-apa jika AuthProvider masih loading
        if (isSessionLoading || !userRole) return;

        // Cek jika kita sudah "join" sesi, langsung redirect
        if (activeSession) {
            // Panggil fungsi navigasi baru Anda
            navigateToDashboard(userRole);
            return;
        }

        // Jika belum join, baru fetch daftar sesi
        setIsPageLoading(true);
        fetchAllSessions();
    }, [isSessionLoading, activeSession, navigate, userRole]); // <-- Tambahkan userRole
    // --- (AKHIR PERUBAHAN 3) ---

    // useMemo (allSessionsForDisplay) (Tidak berubah)
    const allSessionsForDisplay = useMemo(() => {
        const openWithStatus = openSessions.map(s => ({ ...s, status: 'open' }));
        const closedWithStatus = closedSessions.map(s => ({ ...s, status: 'closed' }));
        const combined = [...openWithStatus, ...closedWithStatus];

        return combined.filter(session => {
            const sessionDate = new Date(session.waktu_mulai);
            const matchSearch = session.nama_sesi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                session.nama_kasir?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchMonth = sessionDate.getMonth() === selectedMonth;
            const matchYear = sessionDate.getFullYear() === selectedYear;

            return matchSearch && matchMonth && matchYear;
        }).sort((a, b) => new Date(b.waktu_mulai) - new Date(a.waktu_mulai));
    }, [openSessions, closedSessions, searchQuery, selectedMonth, selectedYear]);


    // handleSubmitNewSession (Tidak Perlu Diubah)
    // Fungsi ini memanggil `openSession`, yang memperbarui `activeSession`.
    // `useEffect` (Perubahan 3) akan menangkap perubahan `activeSession` 
    // dan melakukan navigasi berbasis peran secara otomatis.
    const handleSubmitNewSession = async (e) => {
        e.preventDefault();
        setError('');

        if (!saldoAwal || isNaN(parseFloat(saldoAwal)) || parseFloat(saldoAwal) < 0) {
            setError('Saldo awal tidak valid');
            return;
        }

        setIsSubmitting(true);

        try {
            await openSession(namaSesi, parseFloat(saldoAwal));

            setShowModal(false);
            message.success("Sesi baru berhasil dibuat!");
            // Navigasi akan di-handle oleh useEffect [activeSession]

        } catch (err) {
            setError(err.message || 'Gagal membuka sesi');
            message.error(err.message || 'Gagal membuka sesi');
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- (PERUBAHAN 4: Update 'handleJoinSession' untuk navigasi berbasis peran) ---
    const handleJoinSession = (session) => {
        if (session.status !== 'open') return;

        // Panggil fungsi 'joinSession' dari AuthProvider
        joinSession(session);

        // Panggil fungsi navigasi baru Anda
        navigateToDashboard(userRole);
    };
    // --- (AKHIR PERUBAHAN 4) ---

    // Clock component (Tidak berubah)
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Loading UI (Tidak berubah)
    if (isPageLoading || isSessionLoading || (isLoggedIn && !userRole)) { // Tambahan cek userRole
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Spin size="large" tip="Memuat data sesi..." />
                </div>
            </div>
        );
    }

    // ... sisa JSX (return (...)) tidak perlu diubah ...
    // (UI, Modal, Tampilan daftar sesi, dll. semuanya sudah benar)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header (Tidak berubah) */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-semibold text-gray-800">Cashier Session</h1>
                    <button
                        onClick={() => {
                            // Cek jika sudah ada sesi terbuka, jangan biarkan buat baru
                            if (openSessions.length > 0) {
                                message.warn("Sesi sudah ada. Silakan gabung sesi yang sedang berjalan.");
                            } else {
                                setShowModal(true);
                            }
                        }}
                        className="flex items-center gap-2 text-green-600 font-medium hover:text-green-700 transition-colors"
                    >
                        <span className="text-2xl leading-none">+</span>
                        <span>Buat Sesi Baru</span>
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Sessions List (Tidak berubah) */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Search Bar (Tidak berubah) */}
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Cari nama sesi atau nama kasir..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Month/Year Filter (Tidak berubah) */}
                        <div className="flex justify-center gap-4 bg-white rounded-lg p-3 shadow-sm">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                            >
                                {[2023, 2024, 2025, 2026].map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                            >
                                {months.map((month, idx) => (
                                    <option key={idx} value={idx}>{month}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sessions List - Combined Open and Closed (Tidak berubah) */}
                        <div className="space-y-2">
                            {allSessionsForDisplay.length === 0 ? (
                                <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                                    <p className="text-gray-500">Tidak ada sesi ditemukan</p>
                                </div>
                            ) : (
                                allSessionsForDisplay.map(session => {
                                    const isOpen = session.status === 'open';

                                    // Pengecekan 'activeSession' dari AuthProvider
                                    const isMyJoinedSession = session.id_sesi === activeSession?.id_sesi;

                                    return (
                                        <div key={session.id_sesi} className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${isMyJoinedSession ? 'ring-2 ring-blue-500' : ''}`}>
                                            <div className="flex items-center gap-4 p-4">
                                                {/* Status Badge (Tidak berubah) */}
                                                <div className={`flex-shrink-0 rounded-lg px-4 py-2 ${isOpen ? 'bg-blue-100' : 'bg-green-100'}`}>
                                                    <div className="flex items-center gap-2">
                                                        {isOpen ? (
                                                            <>
                                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                                                </svg>
                                                                <span className="text-sm font-medium text-blue-700">OPEN</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span className="text-sm font-medium text-green-700">CLOSE</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Session Info (Tidak berubah) */}
                                                <div className="flex-grow">
                                                    <p className="font-semibold text-gray-800">{session.nama_sesi}</p>
                                                    <p className="text-sm text-gray-500">Kasir: {session.nama_kasir}</p>
                                                    <p className="text-xs text-gray-400">
                                                        Mulai: {dayjs(session.waktu_mulai).format('DD MMM YYYY, HH:mm')}
                                                    </p>
                                                </div>

                                                {/* Tombol Aksi (Tidak berubah) */}
                                                {isOpen ? (
                                                    <button
                                                        onClick={() => handleJoinSession(session)}
                                                        className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium ${isMyJoinedSession
                                                                ? 'bg-green-600 text-white hover:bg-green-700'
                                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                                            }`}
                                                    >
                                                        {isMyJoinedSession ? 'Lanjutkan Sesi' : 'Masuk Sesi'}
                                                    </button>
                                                ) : (
                                                    <div className="px-4 py-2">
                                                        <span className="text-sm font-medium text-gray-400">
                                                            Selesai
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Column (Tidak berubah) */}
                    <div className="hidden lg:flex flex-col items-center justify-start h-screen pt-20">
                        <div className="w-36 h-36 mb-6 flex items-center justify-center">
                            <img
                                src={logoImage}
                                alt="Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-mono font-bold text-gray-800 tracking-wider">
                                {currentTime.toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false
                                }).replace(/:/g, ' : ')}
                            </div>
                            <p className="text-sm text-gray-500 mt-1 font-medium">Asia/Makassar</p>
                            <p className="text-xs text-gray-400">Wita server</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modal Add New Session (Tidak berubah) */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)'
                    }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                            disabled={isSubmitting}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Modal Header */}
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Add New Cashier Session</h2>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmitNewSession} className="space-y-5">
                            {/* Nama Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nama</label>
                                <input
                                    type="text"
                                    value={namaSesi}
                                    onChange={(e) => setNamaSesi(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Cashier 29 Oktober 2025"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Saldo Awal Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Saldo Awal</label>
                                <input
                                    type="text"
                                    value={saldoAwal === '0' ? 'Rp. 0' : `Rp. ${parseInt(saldoAwal).toLocaleString('id-ID')}`}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^\d]/g, '');
                                        setSaldoAwal(value || '0');
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Rp. 0"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Confirm Button */}
                            <button
                                type="submit"
                                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-gray-400"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spin size="small" />
                                        <span>Membuat Sesi...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Confirm
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BukaSesi;