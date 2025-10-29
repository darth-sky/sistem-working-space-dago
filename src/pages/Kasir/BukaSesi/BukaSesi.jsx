// src/pages/Kasir/BukaSesi/BukaSesi.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
// Impor service baru
import {
    apiGetAllOpenSessions,
    apiGetRecentClosedSessions,
    apiTakeoverSession
} from '../../../services/service'; // (Sesuaikan path ke file service Anda)
import { formatRupiah } from '../../../utils/formatRupiah'; // Asumsi Anda punya ini

// Komponen kecil untuk menampilkan item sesi
const SessionItem = ({ session, onAction, actionText, isTakeover }) => {
    const startTime = new Date(session.waktu_mulai).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className={`p-4 border rounded-lg flex justify-between items-center ${isTakeover ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50'}`}>
            <div>
                <p className="font-semibold">{session.nama_sesi || 'Sesi Tanpa Nama'}</p>
                <p className="text-sm text-gray-600">
                    Kasir: <span className="font-medium">{session.nama_kasir || 'N/A'}</span>
                </p>
                <p className="text-sm text-gray-600">
                    Mulai: {startTime}
                </p>
                <p className="text-sm text-gray-600">
                    Saldo Awal: {formatRupiah(session.saldo_awal)}
                </p>
            </div>
            {onAction && (
                <button
                    onClick={onAction}
                    className={`px-4 py-2 text-white rounded-md ${isTakeover ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    {actionText}
                </button>
            )}
        </div>
    );
};

const BukaSesi = () => {
    const {
        openSession,
        getLastSaldo,
        activeSession,      // Sesi milik user ini
        isSessionLoading,   // Loading dari AuthProvider
        checkActiveSession  // Fungsi untuk refresh sesi (setelah takeover)
    } = useAuth();

    const [namaSesi, setNamaSesi] = useState('');
    const [saldoAwal, setSaldoAwal] = useState(''); // State ini tetap string
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // State untuk daftar sesi
    const [openSessions, setOpenSessions] = useState([]);
    const [closedSessions, setClosedSessions] = useState([]);

    // 1. Set nama sesi default (hanya sekali)
    useEffect(() => {
        const tgl = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        setNamaSesi(`Kasir ${tgl}`);
    }, []);

    // 2. Fetch semua data sesi saat halaman dimuat
    useEffect(() => {
        // Jangan fetch apapun jika loading sesi dari AuthProvider belum selesai
        if (isSessionLoading) {
            return;
        }

        setIsPageLoading(true);

        // Kita jalankan semua API call secara bersamaan
        Promise.all([
            getLastSaldo(),
            apiGetAllOpenSessions(),
            apiGetRecentClosedSessions()
        ])
        .then(([saldoData, openSessionsData, closedSessionsData]) => {
            // Simpan saldo awal sebagai string
            setSaldoAwal(saldoData != null ? saldoData.toString() : '0');
            setOpenSessions(openSessionsData.sessions || []);
            setClosedSessions(closedSessionsData.sessions || []);
        })
        .catch((err) => {
            setError(err.message || 'Gagal memuat data sesi');
            setSaldoAwal('0'); // Set default jika gagal
        })
        .finally(() => {
            setIsPageLoading(false);
        });

    }, [isSessionLoading, getLastSaldo]); // Jalankan ulang jika status loading sesi berubah

    // 3. Logika untuk memfilter sesi
    const { myActiveSession, otherOpenSessions } = useMemo(() => {
        const mySession = activeSession;
        const others = openSessions.filter(s => s.id_sesi !== mySession?.id_sesi);
        return { myActiveSession: mySession, otherOpenSessions: others };
    }, [activeSession, openSessions]);


    // 4. Handler untuk Buka Sesi Baru (Submit Form)
    const handleSubmitNewSession = async (e) => {
        e.preventDefault();
        setError('');
        if (!saldoAwal || isNaN(parseFloat(saldoAwal)) || parseFloat(saldoAwal) < 0) {
            setError('Saldo awal tidak valid');
            return;
        }
        try {
            await openSession(namaSesi, parseFloat(saldoAwal));
            navigate('/transaksikasir', { replace: true });
        } catch (err) {
            setError(err.message || 'Gagal membuka sesi');
        }
    };

    // 5. Handler untuk "Lanjutkan Sesi"
    const handleContinueSession = () => {
        navigate('/transaksikasir', { replace: true });
    };

    // 6. Handler untuk "Ambil Alih Sesi"
    const handleTakeoverSession = async (id_sesi) => {
        setError('');
        if (!window.confirm("Apakah Anda yakin ingin mengambil alih sesi ini? Kasir sebelumnya akan kehilangan akses.")) {
            return;
        }
        try {
            await apiTakeoverSession(id_sesi);
            await checkActiveSession();
            navigate('/transaksikasir', { replace: true });
        } catch (err) {
            setError(err.message || 'Gagal mengambil alih sesi');
        }
    };

    // Tampilkan loading utama
    if (isPageLoading || isSessionLoading) {
        return <div className="p-8">Memuat data sesi...</div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Manajemen Sesi Kasir</h1>

            {error && <p className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</p>}

            {/* 1. Sesi Aktif Milik Sendiri */}
            {myActiveSession && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-green-700">Sesi Aktif Anda</h2>
                    <SessionItem
                        session={myActiveSession}
                        onAction={handleContinueSession}
                        actionText="Lanjutkan Sesi"
                        isTakeover={false}
                    />
                </div>
            )}

            {/* 2. Sesi Terbuka Lainnya (Ambil Alih) */}
            {!myActiveSession && otherOpenSessions.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-yellow-700">Sesi Terbuka (Ambil Alih)</h2>
                    <p className="text-sm text-gray-600">
                        Sesi ini masih berjalan, ditinggalkan oleh kasir lain. Anda bisa mengambil alih untuk melanjutkan.
                    </p>
                    {otherOpenSessions.map(session => (
                        <SessionItem
                            key={session.id_sesi}
                            session={session}
                            onAction={() => handleTakeoverSession(session.id_sesi)}
                            actionText="Ambil Alih"
                            isTakeover={true}
                        />
                    ))}
                </div>
            )}

            {/* 3. Form Buka Sesi Baru */}
            {!myActiveSession && (
                <div className="space-y-4 p-6 bg-white rounded-lg shadow-md border">
                    <h2 className="text-xl font-semibold text-gray-800">Buka Sesi Kasir Baru</h2>
                    <form onSubmit={handleSubmitNewSession} className="space-y-4">
                        <div>
                            <label htmlFor="namaSesi" className="block text-sm font-medium text-gray-700">Nama Sesi</label>
                            <input
                                id="namaSesi"
                                type="text"
                                value={namaSesi}
                                onChange={(e) => setNamaSesi(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="saldoAwal" className="block text-sm font-medium text-gray-700">Saldo Awal (Tunai)</label>
                            <input
                                id="saldoAwal"
                                type="number"
                                value={saldoAwal}
                                onChange={(e) => setSaldoAwal(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            {/* --- PERBAIKAN DI SINI --- */}
                            <small className="text-gray-500">Saldo awal diambil dari uang tunai di laci (rekomendasi: {formatRupiah(parseFloat(saldoAwal) || 0)}).</small>
                            {/* --- AKHIR PERBAIKAN --- */}
                        </div>
                        <button
                            type="submit"
                            className="w-full px-4 py-2 text-white font-semibold bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Buka Sesi Baru
                        </button>
                    </form>
                </div>
            )}

            {/* 4. Riwayat Sesi Ditutup */}
            {closedSessions.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800">Riwayat Sesi Terakhir (Ditutup)</h2>
                    <div className="space-y-3">
                        {closedSessions.map(session => {
                            // Konversi aman ke angka dengan fallback 0
                            const saldoAwalNum = parseFloat(session.saldo_awal);
                            const saldoTercatatNum = parseFloat(session.saldo_akhir_tercatat);
                            const saldoAktualNum = parseFloat(session.saldo_akhir_aktual);

                            const saldoAwalFormatted = formatRupiah(isNaN(saldoAwalNum) ? 0 : saldoAwalNum);
                            const saldoTercatatFormatted = formatRupiah(isNaN(saldoTercatatNum) ? 0 : saldoTercatatNum);
                            const saldoAktualFormatted = formatRupiah(isNaN(saldoAktualNum) ? 0 : saldoAktualNum);

                            return (
                                <div key={session.id_sesi} className="p-4 border rounded-lg bg-gray-50">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold">{session.nama_sesi || 'Sesi Tanpa Nama'}</p>
                                        <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Ditutup</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Kasir: <span className="font-medium">{session.nama_kasir || 'N/A'}</span></p>
                                    <p className="text-sm text-gray-600">
                                        Mulai: {new Date(session.waktu_mulai).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        {session.waktu_selesai ? ` | Selesai: ${new Date(session.waktu_selesai).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''}
                                    </p>
                                    <div className="text-sm grid grid-cols-2 gap-x-4 mt-1">
                                        <p>Saldo Awal: {saldoAwalFormatted}</p>
                                        <p>Saldo Tercatat: {saldoTercatatFormatted}</p>
                                        <p>Saldo Aktual: {saldoAktualFormatted}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BukaSesi;