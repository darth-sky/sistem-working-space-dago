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
import { HistoryOutlined } from '@ant-design/icons'; // Import Icon untuk tombol history

const BukaSesi = () => {

    const {
        openSession,
        getLastSaldo,
        activeSession,
        isSessionLoading,
        checkActiveSession,
        joinSession,
        userRole,
        isLoggedIn
    } = useAuth();

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

    useEffect(() => {
        const tgl = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        setNamaSesi(`Cashier ${tgl}`);
    }, []);

    const navigateToDashboard = (role) => {
        if (role === 'admin_tenant') {
            navigate('/ordertenant', { replace: true });
        } else {
            navigate('/transaksikasir', { replace: true });
        }
    };

    // --- FUNGSI BARU: Navigasi ke Riwayat ---
    const handleViewHistory = (session) => {
        if (userRole === 'admin_tenant') {
            navigate(`/ordertenant/${session.id_sesi}`); // Ke Dashboard Tenant
        } else {
            navigate(`/kasir/riwayat-sesi/${session.id_sesi}`); // Ke Dashboard Kasir
        }
    };

    const fetchAllSessions = async () => {
        try {
            const [saldoData, openSessionsData, closedSessionsData] = await Promise.all([
                getLastSaldo(),
                apiGetAllOpenSessions(),
                apiGetRecentClosedSessions()
            ]);

            // Handle jika saldoData berupa object { data: "..." }
            const saldoVal = (saldoData && typeof saldoData === 'object' && saldoData.data)
                ? saldoData.data
                : saldoData;

            setSaldoAwal(saldoVal != null ? saldoVal.toString() : '0');
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

    useEffect(() => {
        if (isSessionLoading || !userRole) return;

        if (activeSession) {
            navigateToDashboard(userRole);
            return;
        }

        setIsPageLoading(true);
        fetchAllSessions();
    }, [isSessionLoading, activeSession, navigate, userRole]);

    const allSessionsForDisplay = useMemo(() => {
        const openWithStatus = openSessions.map(s => ({ ...s, status: 'open' }));
        const closedWithStatus = closedSessions.map(s => ({ ...s, status: 'closed' }));
        const combined = [...openWithStatus, ...closedWithStatus];

        return combined.filter(session => {
            const sessionDate = new Date(session.waktu_mulai);
            // Null check untuk properti string agar tidak crash
            const sName = session.nama_sesi || '';
            const kName = session.nama_kasir || '';

            const matchSearch = sName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                kName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchMonth = sessionDate.getMonth() === selectedMonth;
            const matchYear = sessionDate.getFullYear() === selectedYear;

            return matchSearch && matchMonth && matchYear;
        }).sort((a, b) => new Date(b.waktu_mulai) - new Date(a.waktu_mulai));
    }, [openSessions, closedSessions, searchQuery, selectedMonth, selectedYear]);

    const handleSubmitNewSession = async (e) => {
        e.preventDefault();
        setError('');

        // Bersihkan string rupiah menjadi angka
        const cleanSaldo = saldoAwal.toString().replace(/[^\d]/g, '');

        if (!cleanSaldo || isNaN(parseFloat(cleanSaldo)) || parseFloat(cleanSaldo) < 0) {
            setError('Saldo awal tidak valid');
            return;
        }

        setIsSubmitting(true);

        try {
            await openSession(namaSesi, parseFloat(cleanSaldo));
            setShowModal(false);
            message.success("Sesi baru berhasil dibuat!");
            // Navigasi ditangani oleh useEffect [activeSession]
        } catch (err) {
            setError(err.message || 'Gagal membuka sesi');
            message.error(err.message || 'Gagal membuka sesi');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleJoinSession = (session) => {
        if (session.status !== 'open') return;
        joinSession(session);
        navigateToDashboard(userRole);
    };

    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (isPageLoading || isSessionLoading || (isLoggedIn && !userRole)) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Spin size="large" tip="Memuat data sesi..." />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-semibold text-gray-800">Cashier Session</h1>
                    <button
                        onClick={() => {
                            if (openSessions.length > 0) {
                                message.warning("Sesi sudah ada. Silakan gabung sesi yang sedang berjalan.");
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
                    {/* Left Column - Sessions List */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Search Bar */}
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

                        {/* Month/Year Filter */}
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

                        {/* Sessions List */}
                        <div className="space-y-2">
                            {allSessionsForDisplay.length === 0 ? (
                                <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                                    <p className="text-gray-500">Tidak ada sesi ditemukan</p>
                                </div>
                            ) : (
                                allSessionsForDisplay.map(session => {
                                    const isOpen = session.status === 'open';
                                    const isMyJoinedSession = session.id_sesi === activeSession?.id_sesi;

                                    return (
                                        <div key={session.id_sesi} className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${isMyJoinedSession ? 'ring-2 ring-blue-500' : ''}`}>
                                            <div className="flex items-center gap-4 p-4">
                                                {/* Status Badge */}
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

                                                {/* Session Info */}
                                                <div className="flex-grow">
                                                    <p className="font-semibold text-gray-800">{session.nama_sesi}</p>
                                                    <p className="text-sm text-gray-500">Kasir: {session.nama_kasir}</p>
                                                    <p className="text-xs text-gray-400">
                                                        Mulai: {dayjs(session.waktu_mulai).format('DD MMM YYYY, HH:mm')}
                                                    </p>
                                                </div>

                                                {/* Tombol Aksi */}
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
                                                    // --- MODIFIKASI DI SINI: Tombol Lihat Riwayat ---
                                                    // UI tetap menggunakan style yang sama agar konsisten
                                                    <button
                                                        onClick={() => handleViewHistory(session)}
                                                        className="px-4 py-2 text-sm bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-all font-medium flex items-center gap-2"
                                                    >
                                                        <HistoryOutlined />
                                                        Lihat Riwayat
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="hidden lg:flex flex-col items-center justify-center fixed right-40 top-1/2 -translate-y-1/2">
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

            {/* Modal Add New Session */}
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
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                            disabled={isSubmitting}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Add New Cashier Session</h2>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmitNewSession} className="space-y-5">
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Saldo Awal</label>
                                <input
                                    type="text"
                                    value={saldoAwal === '0' ? 'Rp. 0' : `Rp. ${parseInt(saldoAwal.toString().replace(/[^\d]/g, '') || 0).toLocaleString('id-ID')}`}
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