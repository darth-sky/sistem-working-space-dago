import React, { useEffect, useState } from "react";
// Import useNavigate dari react-router-dom
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
// Import service, termasuk createBulkBooking, getUserProfile, dan jwtStorage
import { getAllRuangan, createBulkBooking, getUserProfile } from "../../../services/service"; // Pastikan path ini benar dan getUserProfile ada
import { jwtStorage } from "../../../utils/jwtStorage"; // Sesuaikan path jika perlu
import { formatRupiah } from "../../../utils/formatRupiah"; // Pastikan path ini benar
import {
    CalendarOutlined,
    ClockCircleOutlined,
    UserOutlined,
    CheckCircleOutlined,
    DollarCircleOutlined,
    InfoCircleOutlined // Icon untuk info user
} from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { Option } = Select;
const baseUrl = import.meta.env.VITE_BASE_URL || "";

const qrisImgSrc = "/static/qris-barcode.png"; // Pastikan path ini benar relatif terhadap folder public

const PrivateOffice = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false); // Loading umum
    const [rooms, setRooms] = useState([]);
    const [selectedDateRange, setSelectedDateRange] = useState(null);
    const [selectedTimeRange, setSelectedTimeRange] = useState(null);
    const [quantities, setQuantities] = useState({});
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Hapus 'nama' dari formData awal
    const [formData, setFormData] = useState({
        perusahaan: "",
        metode: "qris",
    });
    const [selectedCategoriesForModal, setSelectedCategoriesForModal] = useState([]);
    // State untuk menyimpan data user login
    const [loggedInUser, setLoggedInUser] = useState(null);

    // Fetch data ruangan
    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                setLoading(true);
                const data = await getAllRuangan();
                setRooms(data.datas || []);
            } catch (err) {
                console.error("Error fetching rooms:", err);
                setError("Gagal memuat data ruangan.");
            } finally {
                setLoading(false);
            }
        };
        fetchRoomData();
    }, []);

    // Fetch data user login
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Asumsi ada service getUserProfile()
                const userData = await getUserProfile();
                if (userData.status === 200 && userData.data) {
                    setLoggedInUser(userData.data); // Simpan data user
                } else {
                     message.error("Gagal memuat data pengguna.");
                     // Mungkin redirect ke login jika user tidak terautentikasi
                     // navigate("/login");
                }
            } catch (err) {
                console.error("Error fetching user profile:", err);
                message.error("Terjadi kesalahan saat memuat profil pengguna.");
                 // Mungkin redirect ke login
                 // navigate("/login");
            }
        };
        // Hanya fetch user data jika token ada (meskipun service mungkin sudah handle)
        if (jwtStorage.retrieveToken()) {
            fetchUserData();
        } else {
             message.error("Sesi tidak valid. Silakan login kembali.");
             // navigate("/login"); // Redirect ke login jika tidak ada token
        }
    }, [navigate]); // Tambahkan navigate sebagai dependency jika digunakan

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
        // Hapus validasi formData.nama
        if (!formData.perusahaan) {
            return message.warning("Nama Perusahaan wajib diisi.");
        }
        if (!selectedDateRange || !selectedTimeRange || !selectedDateRange[0] || !selectedDateRange[1] || !selectedTimeRange[0] || !selectedTimeRange[1]) {
             return message.warning("Rentang tanggal atau waktu sewa tidak lengkap atau tidak valid.");
        }

        const selectedCats = Object.keys(quantities).filter((k) => quantities[k] > 0);
        if (selectedCats.length === 0) {
            return message.warning("Pilih minimal satu unit ruangan.");
        }

        // Validasi jumlah vs ketersediaan
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

    // --- FUNGSI handleFinalSubmit YANG DIPERBARUI ---
    const handleFinalSubmit = async () => {
        // Hapus 'nama' dari destrukturisasi
        const { perusahaan } = formData;
        if (!perusahaan) {
            return message.warning("Nama Perusahaan tidak boleh kosong di modal.");
        }
         if (!selectedDateRange || !selectedTimeRange || !selectedDateRange[0] || !selectedDateRange[1] || !selectedTimeRange[0] || !selectedTimeRange[1]) {
            return message.warning("Rentang tanggal atau waktu tidak valid.");
        }


        const selectedCats = Object.keys(quantities).filter((k) => quantities[k] > 0);

        // Siapkan detail booking per unit
        const detailedPemesanan = [];
        let validationError = false;
        selectedCats.forEach(cat => {
            const availableRoomsInCategory = groupedRooms[cat] || [];
            const roomsToBook = availableRoomsInCategory.slice(0, quantities[cat]);

            roomsToBook.forEach(room => {
               try {
                   const startTimeStr = selectedDateRange[0].format("YYYY-MM-DD") + " " + selectedTimeRange[0].format("HH:mm:ss");
                   const endTimeStr = selectedDateRange[1].format("YYYY-MM-DD") + " " + selectedTimeRange[1].format("HH:mm:ss");
                   const startTime = dayjs(startTimeStr);
                   const endTime = dayjs(endTimeStr);

                   if (!startTime.isValid() || !endTime.isValid() || endTime.isBefore(startTime) || endTime.isSame(startTime)) {
                       throw new Error("Waktu mulai/selesai tidak valid.");
                   }

                    detailedPemesanan.push({
                        id_ruangan: room.id_ruangan,
                        waktu_mulai: startTime.toISOString(),
                        waktu_selesai: endTime.toISOString(),
                    });
                } catch(err) {
                     console.error("Error formatting date/time:", err);
                     message.error(`Terjadi masalah saat memproses waktu untuk ${cat}: ${err.message}`);
                     validationError = true;
                }
            });
        });

        if (validationError) return;

        // Siapkan payload akhir (tanpa nama_guest)
        const payload = {
            // nama_guest tidak dikirim
            perusahaan: perusahaan, // Kirim perusahaan jika backend menyimpannya
            metode_pembayaran: "Non-Tunai",
            status_pembayaran: "Belum Lunas",
            status_order: "Baru",
            // id_user akan diambil dari token di backend
            bookings: detailedPemesanan
        };

        console.log("Mengirim Payload:", JSON.stringify(payload, null, 2));

        try {
            setLoading(true);
            const response = await createBulkBooking(payload); // Panggil service

            if (response.status === 200 || response.status === 201) {
                message.success(response.data.message || "Pesanan berhasil dibuat! Silakan scan QRIS.");
                setIsModalOpen(false);
                // Reset form
                setQuantities({});
                setSelectedDateRange(null);
                setSelectedTimeRange(null);
                setFormData({ ...formData, perusahaan: "" }); // Hanya reset perusahaan

                navigate("/riwayat-transaksi");
            } else {
                message.error(response.data.error || response.data.message || "Gagal membuat pesanan.");
            }
        } catch (error) {
            console.error("Error creating bulk booking:", error);
            message.error("Gagal mengirim pesanan: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Tampilkan loading awal saat data belum ada ATAU user belum terload
    if ((loading && rooms.length === 0) || !loggedInUser)
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Spin size="large" tip="Memuat data..." />
            </div>
        );

    if (error)
        return (
            <div className="p-6 max-w-xl mx-auto">
                <Alert type="error" message={error} showIcon />
            </div>
        );

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold mb-4">Pemesanan Ruang Kerja Tim</h2>
            <p className="text-gray-600 mb-8">
                Sewa beberapa unit ruang kerja sekaligus untuk tim Anda ({loggedInUser?.nama}). Pilih tanggal, waktu, dan jumlah unit per kategori.
            </p>

            {/* FORM PEMESANAN */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-10">
                <h2 className="text-2xl font-bold mb-6">Detail Pemesan & Waktu Sewa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Tampilkan Nama User (Read Only) */}
                    {/* Input Perusahaan */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Nama Perusahaan <span className="text-red-500">*</span></label>
                        <Input
                            placeholder="Masukkan nama perusahaan"
                            value={formData.perusahaan}
                            onChange={(e) => setFormData({ ...formData, perusahaan: e.target.value })}
                        />
                    </div>
                </div>

                {/* Input Tanggal & Waktu (Sama seperti sebelumnya) */}
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

            {/* LIST RUANGAN */}
            <h2 className="text-2xl font-bold mb-6">Pilih Unit Ruangan</h2>
            {loading && rooms.length > 0 && <div className="text-center mb-4"><Spin/> Memuat detail ruangan...</div>}
            <div className="grid grid-cols-1 gap-6 mb-8">
                 {Object.keys(groupedRooms).length === 0 && !loading && (
                     <Alert message="Tidak ada kategori ruangan yang tersedia saat ini." type="info" showIcon />
                 )}
                {Object.keys(groupedRooms).map((category) => {
                    const categoryRooms = groupedRooms[category];
                    if (!categoryRooms || categoryRooms.length === 0) return null;

                    const room = categoryRooms[0];
                    const minPrice = room?.paket_harga?.reduce(
                        (min, p) => (p.harga_paket < min ? p.harga_paket : min),
                        Infinity
                        ) ?? room?.harga_per_jam ?? 0;

                    const features = room?.fitur_ruangan
                        ? room.fitur_ruangan.split(/[\r\n]+/).map(f => f.trim()).filter(f => f)
                        : [];

                    const availableUnits = categoryRooms.length;

                    return (
                        <div
                            key={category}
                            className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row items-start md:items-stretch gap-4 relative ${availableUnits === 0 ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {/* GAMBAR */}
                            <div className="w-full md:w-1/3 flex-shrink-0">
                                <img
                                    src={`${baseUrl}/static/${room?.gambar_ruangan}`}
                                    alt={category}
                                    className="w-full h-56 object-cover rounded-lg bg-gray-200"
                                    onError={(e) => { e.target.src = "https://placehold.co/600x400/EEE/31343C?text=No+Image"; }}
                                />
                            </div>

                            {/* DETAIL */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                                        <h3 className="text-xl font-semibold">{category}</h3>
                                        {minPrice > 0 && (
                                            <div>
                                                <span className="text-sm text-gray-600 mr-1">Mulai:</span>
                                                <Tag icon={<DollarCircleOutlined />} color="blue" className="font-semibold text-sm py-1 px-3">
                                                    {formatRupiah(minPrice)}
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
                                {/* Jumlah Unit */}
                                <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100">
                                    <label className="block text-gray-700 font-semibold mr-2">
                                        Jumlah Unit <span className="text-red-500">*</span>:
                                    </label>
                                    <InputNumber
                                        min={0}
                                        max={availableUnits}
                                        value={quantities[category] || 0}
                                        onChange={(val) => handleQuantityChange(category, val)}
                                        disabled={availableUnits === 0 || loading}
                                        controls={true}
                                        className="w-24"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tombol Pesan Sekarang */}
            <div className="mt-8 mb-10">
                <Button
                    type="primary"
                    size="large"
                    className="w-full"
                    onClick={openOrderModal}
                    disabled={
                        !formData.perusahaan || // Cek perusahaan saja
                        !isAnyCategorySelected ||
                        !selectedDateRange ||
                        !selectedTimeRange ||
                        loading
                    }
                    loading={loading && isModalOpen} // Loading saat submit modal
                >
                    Lanjut ke Konfirmasi Pesanan
                </Button>
            </div>

            {/* MODAL KONFIRMASI */}
            <Modal
                title="Konfirmasi Pesanan & Pembayaran"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                centered
                width={500}
                bodyStyle={{ padding: 24 }}
                maskClosable={!loading}
            >
                <Spin spinning={loading} tip="Memproses pesanan...">
                    <div className="space-y-4">
                        {/* Detail Pemesan (Read Only) */}
                        <div className="grid grid-cols-1 gap-2">
                             {/* Tampilkan Nama User dari state */}
                             {/* <Input addonBefore="Nama" value={loggedInUser?.nama || "..."} readOnly /> */}
                             <Input addonBefore="Perusahaan" value={formData.perusahaan} readOnly />
                        </div>

                        {/* Metode Pembayaran & QRIS */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Metode Pembayaran</label>
                            <Select value="qris" disabled className="w-full">
                                <Option value="qris">QRIS</Option>
                            </Select>
                            <div className="mt-3 flex flex-col items-center p-3 border rounded-lg bg-gray-50">
                                <img
                                    src={qrisImgSrc}
                                    alt="QRIS Barcode"
                                    style={{ width: 160, height: 160, objectFit: "contain" }}
                                    onError={(e) => { e.target.src = "https://placehold.co/160x160/EEE/31343C?text=QR+Error"; }}
                                />
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Scan kode QR di atas untuk pembayaran.<br/>
                                    Pesanan akan diproses setelah pembayaran dikonfirmasi.
                                </p>
                            </div>
                        </div>

                        {/* Rincian Pesanan */}
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
                            {/* Pertimbangkan menambahkan estimasi total harga */}
                        </div>

                        {/* Tombol aksi */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button onClick={() => setIsModalOpen(false)} disabled={loading}>
                                Batal
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleFinalSubmit}
                                loading={loading}
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