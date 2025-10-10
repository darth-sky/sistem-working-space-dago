// Ganti seluruh isi file BookingPayment.js Anda dengan kode di bawah ini.

import React, { useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import moment from "moment";
import { AuthContext } from "../../../providers/AuthProvider";
import { postTransaksiRuangan } from "../../../services/service";
import { formatRupiah } from "../../../utils/formatRupiah";
import { message } from "antd";

const BookingPayment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userProfile } = useContext(AuthContext);

    // Menerima semua data yang dikirim dari halaman RoomDetail
    const {
        room,
        selectedRange,
        selectedStartTime,
        selectedEndTime,
        duration,
        purpose,
        total,
        paymentMethod,
        creditCost,
        membershipId,
        virtualOfficeId, // Data VO sekarang diterima di sini
    } = location.state || {};

    // Validasi data esensial
    useEffect(() => {
        if (!room || !selectedRange || !duration) {
            message.error("Data booking tidak lengkap, silakan ulangi.");
            navigate("/");
        }
    }, [location.state, navigate, room, selectedRange, duration]);

    // Mencegah error render jika data belum siap
    if (!room || !selectedRange || !duration) return null;

    // --- FUNGSI HELPER & KALKULASI ---
    const formattedDateDisplay = () => {
        if (!selectedRange.from) return "-";
        if (!selectedRange.to || moment(selectedRange.from).isSame(selectedRange.to, 'day')) {
            return moment(selectedRange.from).format("dddd, DD MMMM YYYY");
        }
        return `${moment(selectedRange.from).format("DD MMM YYYY")} - ${moment(selectedRange.to).format("DD MMM YYYY")}`;
    };

    const totalHari = selectedRange?.to ? moment(selectedRange.to).diff(moment(selectedRange.from), 'days') + 1 : 1;
    const totalCreditCost = creditCost * totalHari;
    const formattedStartTime = `${String(selectedStartTime).padStart(2, '0')}:00`;
    const formattedEndTime = `${String(selectedEndTime).padStart(2, '0')}:00`;

    // --- HANDLER UNTUK MENGIRIM DATA KE BACKEND ---
    const handleInputTransaksi = async () => {
        try {
            // Siapkan payload yang lengkap untuk backend
            const bookingData = {
                id_user: userProfile?.id_user,
                id_ruangan: room.id_ruangan,
                tanggal_mulai: moment(selectedRange.from).format("YYYY-MM-DD"),
                tanggal_selesai: moment(selectedRange.to || selectedRange.from).format("YYYY-MM-DD"),
                jam_mulai: selectedStartTime,
                jam_selesai: selectedEndTime,
                
                // Mengirim metode pembayaran yang dipilih dari halaman sebelumnya
                paymentMethod: paymentMethod,

                // --- PERUBAHAN LOGIKA HARGA & METODE PEMBAYARAN ---
                total_harga_final: (paymentMethod === 'credit' || paymentMethod === 'virtual_office') ? 0 : total,
                
                metode_pembayaran: 
                    paymentMethod === 'credit' ? 'Membership Credit' 
                    : paymentMethod === 'virtual_office' ? 'Virtual Office Benefit' 
                    : 'qris',

                // Data spesifik untuk setiap metode
                creditCost: totalCreditCost,
                membershipId: membershipId,
                virtualOfficeId: virtualOfficeId,
                benefitCost: duration * totalHari // Total jam benefit yang digunakan
            };

            const res = await postTransaksiRuangan(bookingData);

            if (res.message.includes("berhasil")) {
                message.success("Booking berhasil dikonfirmasi!");
                navigate("/riwayat-transaksi", {
                    state: { transaksi: res, isNew: true },
                });
            } else {
                message.error(`Booking gagal: ${res.error || 'Terjadi kesalahan'}`);
            }
        } catch (error) {
            console.error("Gagal input transaksi:", error);
            message.error(`Terjadi kesalahan pada sistem: ${error.message || 'Silakan coba lagi.'}`);
        }
    };

    // --- VARIABEL BOOLEAN UNTUK KEMUDAHAN RENDER ---
    const isCreditPayment = paymentMethod === 'credit';
    const isVOPayment = paymentMethod === 'virtual_office';
    const isNormalPayment = !isCreditPayment && !isVOPayment;

    // --- RENDER KOMPONEN ---
    return (
        <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-lg w-full">

                {/* Tampilkan QR Code hanya untuk pembayaran normal */}
                {isNormalPayment && (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan QR Code</h2>
                        <p className="text-gray-600 text-sm mb-8 leading-relaxed">Gunakan aplikasi e-wallet untuk <br /> scan dan bayar dengan QRIS</p>
                        <div className="flex justify-center mb-8">
                            <div className="w-56 h-56 bg-white p-2 rounded-xl shadow-lg border">
                                <img
                                    src='/img/WhatsApp Image 2025-10-08 at 09.02.45.jpeg' // Path relatif dari folder public
                                    alt="QRIS Payment Code"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                    <h3 className="font-bold text-lg mb-2 text-center">
                        {!isNormalPayment ? "Konfirmasi Booking" : "Detail Pemesanan"}
                    </h3>
                    
                    {/* Detail Booking */}
                    <div className="flex justify-between items-center text-gray-700"> <span className="font-medium">Ruangan</span> <span className="font-semibold">{room.nama_ruangan}</span> </div>
                    <div className="flex justify-between items-center text-gray-700"> <span className="font-medium">Tanggal</span> <span className="font-semibold text-right">{formattedDateDisplay()}</span> </div>
                    <div className="flex justify-between items-center text-gray-700"> <span className="font-medium">Waktu (Harian)</span> <span className="font-semibold"> {formattedStartTime} - {formattedEndTime} </span> </div>
                    <div className="flex justify-between items-center text-gray-700"> <span className="font-medium">Durasi (Harian)</span> <span className="font-semibold">{duration} jam</span> </div>
                    <div className="flex justify-between items-center text-gray-700"> <span className="font-medium">Total Hari</span> <span className="font-semibold">{totalHari} hari</span> </div>
                    <div className="flex justify-between items-center text-gray-700"> <span className="font-medium">Keperluan</span> <span className="font-semibold">{purpose || "-"}</span> </div>

                    <hr className="my-2 border-gray-200" />

                    {/* Tampilan Total Biaya Dinamis */}
                    {isVOPayment ? (
                        <div className="flex justify-between font-semibold text-xl text-gray-900">
                            <span>Total Biaya</span>
                            <span className="text-green-600">Benefit VO (Gratis)</span>
                        </div>
                    ) : isCreditPayment ? (
                        <div className="flex justify-between font-semibold text-xl text-gray-900">
                            <span>Total Biaya</span>
                            <span className="text-blue-600">{totalCreditCost} Kredit</span>
                        </div>
                    ) : (
                        <div className="flex justify-between font-semibold text-xl text-gray-900">
                            <span>Total Bayar</span>
                            <span className="text-blue-600">{formatRupiah(total)}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <button onClick={() => navigate(-1)} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-full font-semibold shadow-md transition">
                        Batal
                    </button>
                    <button onClick={handleInputTransaksi} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-full font-semibold shadow-md transition">
                        {isVOPayment ? 'Konfirmasi & Gunakan Benefit' 
                            : isCreditPayment ? 'Konfirmasi & Gunakan Kredit' 
                            : 'Cek Status Pembayaran'
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingPayment;