import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    DatePicker,
    TimePicker,
    InputNumber,
    Button,
    message,
    Spin,
    Alert,
    Modal,
    Input,
    Select,
    Tag,
} from "antd";
import dayjs from "dayjs";
import { jwtStorage } from "../../../utils/jwtStorage"; // Sesuaikan path jika perlu
import { formatRupiah } from "../../../utils/formatRupiah"; // Pastikan path ini benar
import {
    CalendarOutlined,
    ClockCircleOutlined,
    UserOutlined,
    CheckCircleOutlined,
    DollarCircleOutlined,
} from "@ant-design/icons";

// --- IMPORT FUNGSI SERVICE BARU ---
import {
    getUserProfile,
    getPrivateOfficeRooms,
    createBulkBooking,
} from "../../../services/service"; // Sesuaikan path

const { RangePicker } = DatePicker;
const { Option } = Select;
const baseUrl = import.meta.env.VITE_BASE_URL || "";

const qrisImgSrc = "/static/qris-barcode.png"; // Pastikan path ini benar

const PrivateOffice = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true); // Loading awal
    const [submitLoading, setSubmitLoading] = useState(false); // Loading saat submit
    const [rooms, setRooms] = useState([]);
    const [selectedDateRange, setSelectedDateRange] = useState(null);
    const [selectedTimeRange, setSelectedTimeRange] = useState(null);
    const [quantities, setQuantities] = useState({});
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        metode: "qris",
    });
    const [selectedCategoriesForModal, setSelectedCategoriesForModal] = useState([]);
    const [loggedInUser, setLoggedInUser] = useState(null);

    // --- FUNGSI UNTUK MEMUAT DATA AWAL ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1. Ambil data user
                const userData = await getUserProfile();
                if (userData.data) {
                    setLoggedInUser(userData.data);
                } else {
                    throw new Error("Gagal memuat data pengguna.");
                }

                // 2. Ambil data ruangan
                const roomData = await getPrivateOfficeRooms();
                setRooms(roomData || []);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message || "Gagal memuat data. Silakan coba lagi.");
                if (err.message.includes("Token")) {
                    message.error("Sesi Anda habis, silakan login kembali.");
                    navigate("/login");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const groupByCategory = (list) => {
        return list.reduce((acc, item) => {
            const kategori = item.nama_kategori || "Lainnya";
            if (!acc[kategori]) acc[kategori] = [];
            acc[kategori].push(item);
            return acc;
        }, {});
    };

    const groupedRooms = groupByCategory(rooms);

    const disabledDate = (current) => current && current < dayjs().startOf("day");

    const handleQuantityChange = (category, value) => {
        const availableUnits = groupedRooms[category]?.length ?? 0;
        const numericValue = Number(value);
        if (isNaN(numericValue)) {
            setQuantities((prev) => ({ ...prev, [category]: 0 }));
            return;
        }
        const newValue = Math.max(0, Math.min(numericValue, availableUnits));
        setQuantities((prev) => ({ ...prev, [category]: newValue }));
    };

    const isAnyCategorySelected = Object.keys(quantities).some((k) => quantities[k] > 0);

    const openOrderModal = () => {
        if (!selectedDateRange || !selectedTimeRange || !selectedDateRange[0] || !selectedDateRange[1] || !selectedTimeRange[0] || !selectedTimeRange[1]) {
            return message.warning("Rentang tanggal atau waktu sewa tidak lengkap atau tidak valid.");
        }

        const selectedCats = Object.keys(quantities).filter((k) => quantities[k] > 0);
        if (selectedCats.length === 0) {
            return message.warning("Pilih minimal satu unit ruangan.");
        }

        let validationPassed = true;
        selectedCats.forEach(cat => {
            const requestedQuantity = quantities[cat];
            const availableQuantity = groupedRooms[cat]?.length ?? 0;
            if (requestedQuantity > availableQuantity) {
                message.error(`Jumlah unit ${cat} (${requestedQuantity}) melebihi stok (${availableQuantity}).`);
                validationPassed = false;
            }
            if (requestedQuantity <= 0) {
                message.error(`Jumlah unit ${cat} harus lebih dari 0.`);
                validationPassed = false;
            }
        });

        if (!validationPassed) return;

        setSelectedCategoriesForModal(selectedCats);
        setIsModalOpen(true);
    };
    const handleFinalSubmit = async () => {
        // Validasi input tanggal dan waktu (tetap sama)
        if (!selectedDateRange || !selectedTimeRange || !selectedDateRange[0] || !selectedDateRange[1] || !selectedTimeRange[0] || !selectedTimeRange[1]) {
            return message.warning("Rentang tanggal atau waktu tidak valid.");
        }

        const selectedCats = Object.keys(quantities).filter((k) => quantities[k] > 0);
        if (selectedCats.length === 0) {
            return message.warning("Pilih minimal satu unit ruangan.");
        }

        // --- PERUBAHAN UTAMA DI SINI ---
        // Kumpulkan semua ID ruangan yang dipilih
        const roomIdsToBook = [];
        let validationError = false;
        selectedCats.forEach(cat => {
            const availableRoomsInCategory = groupedRooms[cat] || [];
            const numToBook = quantities[cat];
            if (numToBook > availableRoomsInCategory.length) {
                message.error(`Jumlah unit ${cat} (${numToBook}) melebihi stok (${availableRoomsInCategory.length}).`);
                validationError = true;
                return; // Stop forEach category if invalid
            }
            if (numToBook <= 0) {
                message.error(`Jumlah unit ${cat} harus lebih dari 0.`);
                validationError = true;
                return; // Stop forEach category if invalid
            }
            // Ambil ID ruangan sebanyak yang diminta
            const ids = availableRoomsInCategory.slice(0, numToBook).map(room => room.id_ruangan);
            roomIdsToBook.push(...ids);
        });

        if (validationError) return;
        if (roomIdsToBook.length === 0) {
            return message.warning("Tidak ada ID ruangan valid yang terpilih.");
        }

        // Siapkan payload dengan format BARU
        const payload = {
            id_user: loggedInUser?.id_user, // Kirim id_user jika backend membutuhkannya langsung
            room_ids: roomIdsToBook, // Array berisi ID ruangan yang akan dibooking
            tanggal_mulai: selectedDateRange[0].format("YYYY-MM-DD"), // String tanggal mulai
            tanggal_selesai: selectedDateRange[1].format("YYYY-MM-DD"), // String tanggal selesai
            jam_mulai: selectedTimeRange[0].hour(), // Integer jam mulai (0-23)
            jam_selesai: selectedTimeRange[1].hour(), // Integer jam selesai (0-23) -> Perhatikan: Jika selesai jam 17:00, ini akan 17.
            metode_pembayaran: "Non-Tunai", // Atau sesuai pilihan
            status_pembayaran: "Belum Lunas" // Atau sesuai alur pembayaran
        };
        // --- AKHIR PERUBAHAN UTAMA ---

        console.log("Mengirim Payload (Format Baru):", JSON.stringify(payload, null, 2));

        try {
            setSubmitLoading(true);
            // Panggil endpoint yang SAMA, tapi backend akan diubah untuk menangani format baru
            const response = await createBulkBooking(payload);

            if (response.status === 201) {
                message.success(response.data.message || "Pesanan berhasil dibuat! Silakan scan QRIS.");
                setIsModalOpen(false);
                setQuantities({});
                setSelectedDateRange(null);
                setSelectedTimeRange(null);
                navigate("/riwayat-transaksi");
            } else {
                message.error(response.data.error || response.data.message || "Gagal membuat pesanan.");
            }
        } catch (error) {
            console.error("Error creating bulk booking:", error);
            const errMsg = error.response?.data?.error || error.message || "Terjadi kesalahan";
            message.error("Gagal mengirim pesanan: " + errMsg);
        } finally {
            setSubmitLoading(false);
        }
    };

    // Tampilkan loading awal
    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Spin size="large" tip="Memuat data..." />
            </div>
        );
    }

    // Tampilkan error jika ada
    if (error) {
        return (
            <div className="p-6 max-w-xl mx-auto">
                <Alert type="error" message={error} showIcon />
            </div>
        );
    }

    // Tampilkan halaman jika data user dan ruangan berhasil dimuat
    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold mb-4">Pemesanan Ruang Kerja Tim</h2>
            <p className="text-gray-600 mb-8">
                Sewa beberapa unit ruang kerja sekaligus untuk tim Anda ({loggedInUser?.nama}). Pilih tanggal, waktu, dan jumlah unit per kategori.
            </p>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-10">
                <h2 className="text-2xl font-bold mb-6">Detail Pemesan & Waktu Sewa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-gray-700 mb-2 font-semibold">
                            <CalendarOutlined className="mr-2" /> Tanggal Sewa <span className="text-red-500">*</span>
                        </label>
                        <RangePicker
                            className="w-full"
                            format="DD MMM YYYY"
                            onChange={(dates) => setSelectedDateRange(dates)}
                            disabledDate={disabledDate}
                            value={selectedDateRange}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2 font-semibold">
                            <ClockCircleOutlined className="mr-2" /> Waktu Sewa <span className="text-red-500">*</span>
                        </label>
                        <TimePicker.RangePicker
                            className="w-full"
                            format="HH:mm"
                            minuteStep={30}
                            hourStep={1}
                            onChange={(times) => setSelectedTimeRange(times)}
                            value={selectedTimeRange}
                        />
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-6">Pilih Unit Ruangan</h2>
            <div className="grid grid-cols-1 gap-6 mb-8">
                {Object.keys(groupedRooms).length === 0 && !loading && (
                    <Alert message="Tidak ada kategori ruangan yang tersedia saat ini." type="info" showIcon />
                )}
                {Object.keys(groupedRooms).map((category) => {
                    const categoryRooms = groupedRooms[category];
                    if (!categoryRooms || categoryRooms.length === 0) return null;

                    const room = categoryRooms[0];

                    // Cek harga, utamakan paket, baru harga per jam
                    let displayPrice = room?.harga_per_jam ?? 0;
                    let priceLabel = "per Jam";
                    if (room.paket_harga && room.paket_harga.length > 0) {
                        const minPackage = room.paket_harga.reduce(
                            (min, p) => (p.harga_paket < min.harga_paket ? p : min),
                            room.paket_harga[0]
                        );
                        displayPrice = minPackage.harga_paket;
                        priceLabel = `/ ${minPackage.durasi_jam} Jam`;
                    } else if (displayPrice > 0) {
                        priceLabel = "per Jam";
                    } else {
                        priceLabel = ""; // Jangan tampilkan jika harga 0
                    }


                    const features = room?.fitur_ruangan
                        ? room.fitur_ruangan.split(/[\r\n]+/).map(f => f.trim()).filter(f => f)
                        : [];

                    const availableUnits = categoryRooms.length;

                    return (
                        <div
                            key={category}
                            className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row items-start md:items-stretch gap-4 relative ${availableUnits === 0 ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <div className="w-full md:w-1/3 flex-shrink-0">
                                <img
                                    src={`${baseUrl}/static/${room?.gambar_ruangan}`} // Sesuaikan path static
                                    alt={category}
                                    className="w-full h-56 object-cover rounded-lg bg-gray-200"
                                    onError={(e) => { e.target.src = "https://placehold.co/600x400/EEE/31343C?text=No+Image"; }}
                                />
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                                        <h3 className="text-xl font-semibold">{category}</h3>
                                        {displayPrice > 0 && (
                                            <div>
                                                <span className="text-sm text-gray-600 mr-1">Mulai:</span>
                                                <Tag icon={<DollarCircleOutlined />} color="blue" className="font-semibold text-sm py-1 px-3">
                                                    {formatRupiah(displayPrice)} {priceLabel}
                                                </Tag>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-gray-600 text-sm flex items-center gap-3 mb-3">
                                        <UserOutlined />
                                        <span>
                                            Kapasitas: {room?.kapasitas || 'N/A'} org/unit | Tersedia:{" "}
                                            <strong className={availableUnits > 0 ? 'text-green-600' : 'text-red-600'}>{availableUnits} unit</strong>
                                        </span>
                                    </div>
                                    {features.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 mt-3 text-sm text-gray-700 mb-3">
                                            {features.map((f, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <CheckCircleOutlined className="text-blue-600 flex-shrink-0" />
                                                    <span className="truncate" title={f}>{f}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100">
                                    <label className="block text-gray-700 font-semibold mr-2">
                                        Jumlah Unit <span className="text-red-500">*</span>:
                                    </label>
                                    <InputNumber
                                        min={0}
                                        max={availableUnits}
                                        value={quantities[category] || 0}
                                        onChange={(val) => handleQuantityChange(category, val)}
                                        disabled={availableUnits === 0}
                                        controls={true}
                                        className="w-24"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 mb-10">
                <Button
                    type="primary"
                    size="large"
                    className="w-full"
                    onClick={openOrderModal}
                    disabled={
                        !isAnyCategorySelected ||
                        !selectedDateRange ||
                        !selectedTimeRange ||
                        submitLoading
                    }
                    loading={submitLoading}
                >
                    Lanjut ke Konfirmasi Pesanan
                </Button>
            </div>

            <Modal
                title="Konfirmasi Pesanan & Pembayaran"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                centered
                width={500}
                bodyStyle={{ padding: 24 }}
                maskClosable={!submitLoading}
            >
                <Spin spinning={submitLoading} tip="Memproses pesanan...">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-2">

                            {/* <Input addonBefore="Perusahaan" value={formData.perusahaan} readOnly /> */}
                        </div>

                        <div>

                            <div className="mt-3 flex flex-col items-center p-3 border rounded-lg bg-gray-50">
                                <img
                                    src={qrisImgSrc}
                                    alt="QRIS Barcode"
                                    style={{ width: 160, height: 160, objectFit: "contain" }}
                                    onError={(e) => { e.target.src = "https://placehold.co/160x160/EEE/31343C?text=QR+Error"; }}
                                />
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Scan kode QR di atas untuk pembayaran.<br />
                                    Pesanan akan diproses setelah pembayaran dikonfirmasi.
                                </p>
                            </div>
                        </div>

                        <div className="border-t pt-3 text-sm text-gray-700">
                            <p className="mb-1">
                                <strong>Tanggal:</strong>{" "}
                                {selectedDateRange?.[0]?.format("DD MMM YYYY")} -{" "}
                                {selectedDateRange?.[1]?.format("DD MMM YYYY")}
                            </p>
                            <p className="mb-2">
                                <strong>Waktu:</strong>{" "}
                                {selectedTimeRange?.[0]?.format("HH:mm")} -{" "}
                                {selectedTimeRange?.[1]?.format("HH:mm")}
                            </p>
                            <p className="mt-2 font-medium">Kategori Dipesan:</p>
                            <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                                {selectedCategoriesForModal.map((k) => (
                                    <li key={k}>
                                        {k} ({quantities[k]} unit)
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button onClick={() => setIsModalOpen(false)} disabled={submitLoading}>
                                Batal
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleFinalSubmit}
                                loading={submitLoading}
                            >
                                Saya Sudah Bayar & Kirim Pesanan
                            </Button>
                            </div>
                    </div>
                </Spin>
            </Modal>
        </div>
    );
};

export default PrivateOffice;