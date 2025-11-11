import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    Button,
    Table,
    Tag,
    Select,
    Input,
    Modal,
    // Radio, // Radio tidak digunakan lagi di sini
    message,
    Spin, // Tambahkan Spin untuk loading
    Space, // Tambahkan Space untuk layout tombol
} from "antd";
import { PlusOutlined, UserOutlined, EditOutlined } from "@ant-design/icons"; // Tambahkan EditOutlined
// Import service baru Anda dan updatePaymentStatus
import {
    getDataTransaksiKasir,
    updatePaymentStatus,
    updateBatalStatus
    // Pastikan service lain yang mungkin Anda butuhkan sudah diimpor
} from "../../../services/service.js"; // Pastikan path ini benar
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { formatRupiah } from "../../../utils/formatRupiah";
import { useAuth } from "../../../providers/AuthProvider";


const { Option } = Select;

// Komponen OrderCard diperbarui untuk menampilkan status 'Disimpan'
const OrderCard = ({ order, getStatusColor, getDisplayStatus, getPaymentStatusColor, onClick }) => (
    <div
        className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer"
        onClick={() => onClick(order)} // Panggil onClick saat card diklik
    >
        <div className="flex-1 min-w-0 mr-4"> {/* Tambahkan min-w-0 untuk handle overflow text */}
            <div className="flex justify-between items-center mb-1">
                <div className="font-semibold text-base text-gray-800 tracking-wide truncate"> {/* Tambahkan truncate */}
                    {order.name} {order.location && order.location !== '-' ? `(${order.location})` : ''} {/* Tampilkan lokasi jika ada */}
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0"> {/* Cegah tag menyusut */}
                    {/* Tag Status Pesanan */}
                    <Tag
                        color={getStatusColor(order.status)}
                        className="font-medium rounded-md px-2 py-1 text-xs sm:text-sm" // Ukuran font responsif
                    >
                        {getDisplayStatus(order.status).toUpperCase()}
                    </Tag>
                    {/* Tag Status Pembayaran (Termasuk Disimpan) */}
                    <Tag
                        color={getPaymentStatusColor(order.payment_status)}
                        className="font-medium rounded-md px-2 py-1 text-xs sm:text-sm"
                    >
                        {order.payment_status.toUpperCase()}
                    </Tag>
                    {/* Tag Tipe Order */}
                    <Tag
                        color="cyan"
                        className="font-medium rounded-md px-2 py-1 text-xs sm:text-sm bg-cyan-50 text-cyan-700 border-none"
                    >
                        {order.type}
                    </Tag>
                </div>
            </div>
            {/* Tampilkan waktu order */}
            <p className="text-xs text-gray-400">{dayjs(order.time).format("DD/MM/YY HH:mm")}</p>
        </div>
    </div>
);


const TransaksiKasir = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false); // Modal detail order
    // State untuk modal create order baru (jika masih diperlukan, tapi tombolnya sudah navigasi)
    // const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    // const [orderType, setOrderType] = useState("Takeout");
    // const [customerName, setCustomerName] = useState("");
    // const [room, setRoom] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [filterPayment, setFilterPayment] = useState("all"); // <-- Filter Status Pembayaran BARU
    const [searchText, setSearchText] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const navigate = useNavigate();
    const [isUpdating, setIsUpdating] = useState(false); // Loading untuk tombol di modal

    const notificationSound = useRef(null);
    const knownTransactionIds = useRef(new Set());
    
    const { user } = useAuth();
    // Inisialisasi Audio
    useEffect(() => {
        // Gunakan path absolut dari public folder
        notificationSound.current = new Audio("/sounds/notification.mp3");
    }, []);

    // Fungsi Fetch Data dengan useCallback
    const fetchAndCheckOrders = useCallback(async (isInitialLoad = false) => {
        // Jangan set loading=true jika ini hanya polling, kecuali saat initial load
        if (isInitialLoad) setLoading(true);
        try {
            // Panggil service untuk mendapatkan data (pastikan backend mengirim semua status)
            const result = await getDataTransaksiKasir(/* Anda bisa tambahkan parameter filter ke backend jika perlu */);

            // Mapping data dari backend ke state 'orders'
            const fetchedOrders = result.datas?.map((o) => ({
                id: o.id, // Pastikan ini id_transaksi
                name: o.customer || "Guest",
                location: o.location || "-",
                status: o.status_pesanan || 'N/A', // Status Order (Baru, Diproses, Selesai)
                price: o.total || 0,
                items: o.items || [],
                time: o.time || new Date().toISOString(),
                type: o.type || 'N/A', // Tipe Order (Dine In, Takeaway, Pick Up)
                room: o.location, // Gunakan location sebagai room/meja jika dine-in
                payment_status: o.payment_status || 'N/A', // Status Pembayaran (Lunas, Belum Lunas, Disimpan)
                payment_method: o.payment_method || '-', // Metode Pembayaran
            })) || []; // Fallback ke array kosong jika datas tidak ada

            // Cek order baru untuk notifikasi suara
            const currentIds = new Set(fetchedOrders.map(o => o.id));
            const hasNewOrder = fetchedOrders.some(
                (order) => !knownTransactionIds.current.has(order.id)
            );

            // Putar suara jika ada order baru dan bukan load pertama
            if (hasNewOrder && knownTransactionIds.current.size > 0 && notificationSound.current) {
                notificationSound.current
                    .play()
                    .catch((e) => console.error("Audio play failed:", e));
            }

            // Update state orders dan set ID yang diketahui
            setOrders(fetchedOrders);
            knownTransactionIds.current = currentIds; // Update dengan ID terbaru

        } catch (err) {
            console.error("Polling/Fetch error:", err);
            if (isInitialLoad) { // Hanya tampilkan error saat load awal
                message.error(`Gagal memuat data transaksi: ${err.message || 'Error tidak diketahui'}`);
            }
        } finally {
            if (isInitialLoad) { // Matikan loading utama hanya saat initial load
                setLoading(false);
            }
        }
    }, []); // Dependency kosong agar useCallback tidak membuat ulang fungsi kecuali dipaksa

    // useEffect untuk initial load dan polling
    useEffect(() => {
        fetchAndCheckOrders(true); // Panggil sekali saat mount dengan flag initialLoad=true

        // Atur interval polling (setiap 15 detik)
        const intervalId = setInterval(() => fetchAndCheckOrders(false), 15000); // Panggil tanpa flag

        // Hentikan interval saat komponen unmount
        return () => clearInterval(intervalId);
    }, [fetchAndCheckOrders]); // fetchAndCheckOrders stabil karena useCallback

    const cashierName = "Rossa"; // Bisa diambil dari context/auth nanti

    // Fungsi helper warna status (order & payment)
    const getStatusColor = (status) => {
        switch (status) {
            case "Baru": return "blue";
            case "Diproses": return "orange";
            case "Sebagian Diproses": return "orange";
            case "Selesai": return "green";
            case "Batal": return "red";
            default: return "default";
        }
    };
    const getPaymentStatusColor = (paymentStatus) => {
        switch (paymentStatus) {
            case "Lunas": return "green";
            case "Belum Lunas": return "red";
            case "Disimpan": return "geekblue"; // Warna biru untuk 'Disimpan'
            case "Dibatalkan": return "red";
            default: return "default";
        }
    };
    // Fungsi display status (jika perlu terjemahan)
    const getDisplayStatus = (status) => status || 'N/A'; // Langsung return saja

    // Filtering logic
    const filteredOrders = useMemo(() => orders
        .filter((o) => o.type !== "Booking") // Abaikan tipe 'Booking'
        .filter((order) => {
            // Filter Status Pesanan
            if (filterStatus !== "all") {
                if (filterStatus === "Diproses") { // 'In Progress' mencakup 'Diproses' & 'Sebagian Diproses'
                    if (order.status !== "Diproses" && order.status !== "Sebagian Diproses") return false;
                } else if (order.status !== filterStatus) {
                    return false;
                }
            }
            // Filter Tipe Order
            if (filterType !== "all") {
                const typeMap = { dinein: "Dine In", takeaway: "Takeaway", pickup: "Pick Up" };
                if (order.type !== typeMap[filterType]) return false;
            }
            // Filter Status Pembayaran (BARU)
            if (filterPayment !== "all") {
                if (order.payment_status !== filterPayment) return false;
            }
            // Filter Pencarian Teks
            if (searchText) {
                const searchLower = searchText.toLowerCase();
                const itemMatch = order.items?.some(item =>
                    item.product?.toLowerCase().includes(searchLower) // Pastikan item.product ada
                );
                return (
                    order.name?.toLowerCase().includes(searchLower) ||
                    order.location?.toLowerCase().includes(searchLower) ||
                    order.id?.toString().includes(searchLower) || // Cari berdasarkan ID juga
                    itemMatch
                );
            }
            return true; // Lolos semua filter
        }), [orders, filterStatus, filterType, filterPayment, searchText]); // Tambahkan filterPayment


    // Kalkulasi total sales (tetap sama)
    const totalSales = useMemo(() =>
        filteredOrders
            .filter(order => order.payment_status === 'Lunas') // Hanya hitung yang lunas
            .reduce((sum, order) => sum + (parseFloat(order.price) || 0), 0)
        , [filteredOrders]);

    // Summary produk (tetap sama)
    const productSummary = useMemo(() => filteredOrders
        .filter(order => order.payment_status === 'Lunas') // Hanya hitung dari yg lunas
        .reduce((acc, order) => {
            order.items?.forEach((item) => { // Pastikan items ada
                const productName = item.product || 'Unknown Product'; // Handle jika nama produk tidak ada
                if (!acc[productName]) acc[productName] = { qty: 0, total: 0 };
                acc[productName].qty += (item.qty || 0);
                acc[productName].total += (item.price || 0) * (item.qty || 0); // Pastikan price & qty ada
            });
            return acc;
        }, {})
        , [filteredOrders]);

    // Top produk (tetap sama)
    const topProducts = useMemo(() => Object.entries(productSummary)
        .map(([product, data], index) => ({
            key: index + 1,
            item: product,
            qty: data.qty,
            total: formatRupiah(data.total), // Format di sini
        }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10)
        , [productSummary]);

    // Handler klik order card -> buka modal detail
    const handleOrderClick = (order) => {
        setSelectedOrder(order);
        setIsModalVisible(true); // Buka modal detail
    };

    // Handler tutup modal detail
    const handleCloseDetail = () => {
        setIsModalVisible(false);
        // Beri sedikit waktu sebelum state di-reset agar transisi modal mulus
        setTimeout(() => setSelectedOrder(null), 300);
    };

    // Handler untuk tombol "Tandai Lunas" di modal
    const handleMarkAsPaid = async () => {
        if (!selectedOrder || selectedOrder.payment_status === 'Lunas' || selectedOrder.payment_status === 'Disimpan') return; // Jangan proses jika sudah lunas atau disimpan

        setIsUpdating(true);
        try {
            await updatePaymentStatus(selectedOrder.id);
            message.success(`Transaksi #${selectedOrder.id} telah ditandai Lunas.`);
            handleCloseDetail(); // Tutup modal
            await fetchAndCheckOrders(false); // Refresh data list (tanpa set loading utama)
        } catch (error) {
            console.error("Error updating payment status:", error);
            message.error(`Gagal memperbarui status: ${error.message || 'Error tidak diketahui'}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleMarkAsBatal = async () => {
        if (!selectedOrder || selectedOrder.payment_status === 'Lunas' || selectedOrder.payment_status === 'Disimpan') return; // Jangan proses jika sudah lunas atau disimpan

        setIsUpdating(true);
        try {
            await updateBatalStatus(selectedOrder.id);
            message.success(`Transaksi #${selectedOrder.id} telah ditandai Dibatalkan.`);
            handleCloseDetail(); // Tutup modal
            await fetchAndCheckOrders(false); // Refresh data list (tanpa set loading utama)
        } catch (error) {
            console.error("Error updating payment status:", error);
            message.error(`Gagal memperbarui status: ${error.message || 'Error tidak diketahui'}`);
        } finally {
            setIsUpdating(false);
        }
    };

    // --- Handler BARU untuk tombol "Lanjutkan Order" ---
    const handleContinueOrder = () => {
        if (!selectedOrder || selectedOrder.payment_status !== 'Disimpan') return;

        // Tutup modal dulu
        handleCloseDetail();

        // Navigasi ke halaman OrderKasir, kirim ID via state
        navigate('/orderkasir', { state: { savedOrderId: selectedOrder.id } });
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden"> {/* Tambah overflow-hidden */}
            {/* LEFT PANEL */}
            <div className="flex-1 bg-white p-5 overflow-y-auto rounded-r-3xl shadow-inner custom-scrollbar"> {/* Buat scrollable */}
                {/* Header Welcome */}
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Welcome</h2>
                        <p className="text-sm text-gray-500">Dago Creative Hub & Coffee Lab</p>
                    </div>
                    {/* Kasir Info (Opsional) */}
                    <div className="flex items-center space-x-2 text-gray-600 text-sm">
                        <UserOutlined />
                        <span>{cashierName}</span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="pb-3">
                    <Input.Search
                        placeholder="Cari ID, nama customer, lokasi, atau produk..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="rounded-lg"
                        allowClear // Tambah tombol clear
                    />
                </div>

                {/* Filters and New Order Button */}
                <div className="flex flex-wrap gap-3 justify-between items-center mb-5"> {/* flex-wrap dan gap */}
                    <div className="flex flex-wrap gap-3 items-center"> {/* flex-wrap dan gap */}
                        {/* Filter Status Pesanan */}
                        {/* Pastikan div pembungkus ketiga Select ini menggunakan flex dan flex-wrap 
  Contoh: <div className="flex flex-wrap gap-4"> 
*/}

                        <Select
                            value={filterStatus}
                            onChange={setFilterStatus}
                            className="w-full md:w-auto md:min-w-[180px]" // 👈 PERUBAHAN
                        >
                            <Option value="all">Semua Status Order</Option>
                            <Option value="Baru">Baru</Option>
                            <Option value="Diproses">Diproses</Option>
                            <Option value="Selesai">Selesai</Option>
                            <Option value="Batal">Batal</Option>
                            <Option value="Sebagian Diproses">Sebagian Diproses</Option>
                        </Select>

                        <Select
                            value={filterType}
                            onChange={setFilterType}
                            className="w-full md:w-auto md:min-w-[180px]" // 👈 PERUBAHAN
                        >
                            <Option value="all">Semua Tipe Order</Option>
                            <Option value="dinein">Dine In</Option>
                            <Option value="takeaway">Takeaway</Option>
                            <Option value="pickup">Pick Up</Option>
                        </Select>

                        <Select
                            value={filterPayment}
                            onChange={setFilterPayment}
                            className="w-full md:w-auto md:min-w-[180px]" // 👈 PERUBAHAN
                        >
                            <Option value="all">Semua Status Bayar</Option>
                            <Option value="Lunas">Lunas</Option>
                            <Option value="Belum Lunas">Belum Lunas</Option>
                            <Option value="Disimpan">Disimpan</Option>
                            <Option value="Dibatalkan">Dibatalkan</Option>
                        </Select>
                    </div>
                    {/* Tombol Order Baru */}
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        // Arahkan ke halaman POS utama (OrderKasir)
                        onClick={() => navigate('/buatorderkasir')} // Langsung navigasi
                        className="rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                    >
                        Order Baru
                    </Button>
                </div>

                {/* Transaction List Header */}
                <h3 className="font-semibold mb-2 text-gray-700">
                    Transaksi F&B ({filteredOrders.length})
                </h3>

                {/* Transaction List Body */}
                <div className="space-y-3">
                    {loading ? (
                        // Tampilkan spinner di tengah saat loading awal
                        <div className="flex justify-center items-center py-16">
                            <Spin tip="Memuat transaksi..." size="large" />
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            Tidak ada transaksi F&B yang cocok dengan filter.
                        </div>
                    ) : (
                        // Render daftar order card
                        filteredOrders.map((order) => (
                            <OrderCard
                                key={order.id} // Gunakan ID transaksi sebagai key
                                order={order}
                                getStatusColor={getStatusColor}
                                getDisplayStatus={getDisplayStatus}
                                getPaymentStatusColor={getPaymentStatusColor} // Kirim fungsi warna payment
                                onClick={handleOrderClick} // Handler untuk membuka modal detail
                            />
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT PANEL (Summary) */}
            <div className="w-80 bg-gray-50 p-5 space-y-6 hidden lg:block"> {/* Sembunyikan di layar kecil */}
                {/* Total Sales Card */}
                <div className="flex justify-between bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-600">Total Penjualan (Lunas)</h3>
                    <p className="text-xl font-bold text-blue-600">
                        {formatRupiah(totalSales)}
                    </p>
                </div>

                {/* Logo */}
                <div className="flex justify-center pt-4 pb-2">
                    <img src="/img/logo_dago.png" alt="Logo Dago" className="h-16 opacity-80" />
                </div>

                {/* Top Products Table */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Top 10 Produk (Lunas)</h3>
                    <Table
                        size="small"
                        pagination={false}
                        columns={[
                            { title: "Produk", dataIndex: "item", key: "item", ellipsis: true }, // Tambah ellipsis
                            { title: "Qty", dataIndex: "qty", key: "qty", width: 50, align: 'center' }, // Atur lebar & align
                            {
                                title: "Total", dataIndex: "total", key: "total", width: 100, align: 'right', // Atur lebar & align
                                render: (text) => <span className="font-medium">{text}</span>
                            },
                        ]}
                        dataSource={topProducts}
                        scroll={{ y: 240 }} // Sesuaikan tinggi scroll jika perlu
                    />
                </div>
            </div>

            {/* MODAL: Detail Order */}
            <Modal
                title={
                    <span className="text-lg font-semibold text-gray-800">
                        Detail Order #{selectedOrder?.id || ""} - {selectedOrder?.name || ""}
                    </span>
                }
                open={isModalVisible} // Gunakan state isModalVisible
                onCancel={handleCloseDetail}
                width={500}
                className="rounded-xl"
                destroyOnClose // Reset konten modal saat ditutup
                footer={[ // Footer kustom untuk tombol aksi
                    <Button key="back" onClick={handleCloseDetail}>
                        Tutup
                    </Button>,
                    // Tombol "Lanjutkan Order" HANYA untuk status 'Disimpan'
                    selectedOrder?.payment_status === "Disimpan" && (
                        <Button
                            key="continue"
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={handleContinueOrder} // Handler baru
                            loading={isUpdating} // Bisa gunakan state loading yang sama
                            disabled={isUpdating}
                        >
                            Lanjutkan Order
                        </Button>
                    ),
                    // Tombol "Tandai Lunas" HANYA untuk status 'Belum Lunas'
                    selectedOrder?.payment_status === "Belum Lunas" && (
                        <Button
                            key="submit"
                            type="primary"
                            loading={isUpdating}
                            onClick={handleMarkAsPaid}
                            // Styling hijau (opsional)
                            className="bg-green-600 hover:bg-green-700 border-green-600 text-white"
                        >
                            Tandai Lunas
                        </Button>
                    ),
                    selectedOrder?.payment_status === "Belum Lunas" && (
                        <Button
                            key="submit"
                            type="primary"
                            loading={isUpdating}
                            onClick={handleMarkAsBatal}
                            // Styling hijau (opsional)
                            className="bg-green-600 hover:bg-green-700 border-green-600 text-white"
                        >
                            Tandai Batal
                        </Button>
                    ),
                ]}
            >
                {/* Konten Modal Detail */}
                {selectedOrder && (
                    <div className="space-y-3 text-gray-700 pt-4"> {/* Tambah padding top */}
                        {/* Status Pesanan */}
                        <div className="flex justify-between items-center">
                            <span>Status Pesanan:</span>
                            <Tag color={getStatusColor(selectedOrder.status)}>
                                {getDisplayStatus(selectedOrder.status).toUpperCase()}
                            </Tag>
                        </div>
                        {/* Status Pembayaran */}
                        <div className="flex justify-between items-center">
                            <span>Status Bayar:</span>
                            <Tag color={getPaymentStatusColor(selectedOrder.payment_status)}>
                                {selectedOrder.payment_status.toUpperCase()}
                            </Tag>
                        </div>
                        {/* Metode Pembayaran (jika sudah lunas/disimpan) */}
                        {selectedOrder.payment_method && selectedOrder.payment_method !== '-' && (
                            <div className="flex justify-between">
                                <span>Metode Bayar:</span>
                                <span>{selectedOrder.payment_method}</span>
                            </div>
                        )}
                        {/* Tipe Order */}
                        <div className="flex justify-between">
                            <span>Tipe:</span>
                            <span>{selectedOrder.type}</span>
                        </div>
                        {/* Lokasi */}
                        <div className="flex justify-between">
                            <span>Lokasi/Meja:</span>
                            <span>{selectedOrder.location}</span>
                        </div>
                        {/* Waktu Order */}
                        <div className="flex justify-between">
                            <span>Waktu Order:</span>
                            <span>{dayjs(selectedOrder.time).format("DD/MM/YYYY HH:mm:ss")}</span>
                        </div>

                        {/* Rincian Item */}
                        <div className="mt-4 border-t pt-3">
                            <h4 className="font-semibold mb-2 text-gray-800">Item Pesanan ({selectedOrder.items?.length || 0}):</h4>
                            {/* Tambahkan area scroll jika item banyak */}
                            <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                    selectedOrder.items.map((item, i) => (
                                        <div key={item.id_detail || i} className="flex justify-between text-sm"> {/* Gunakan ID detail jika ada */}
                                            <span className="flex-1 mr-2">
                                                {item.product || 'Produk tidak diketahui'} x{item.qty || 0}
                                                {item.note && <i className="text-gray-500 block text-xs"> ({item.note})</i>} {/* Tampilkan note jika ada */}
                                            </span>
                                            <span className="font-medium whitespace-nowrap">
                                                {formatRupiah((item.price || 0) * (item.qty || 0))}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Tidak ada item detail.</p>
                                )}
                            </div>
                        </div>

                        {/* Total Harga */}
                        <div className="flex justify-between font-bold mt-4 border-t pt-2 text-blue-700 text-lg">
                            <span>Total:</span>
                            <span>{formatRupiah(selectedOrder.price || 0)}</span>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Buat Order Baru (jika masih diperlukan, tapi tombolnya sudah navigasi) */}
            {/* <Modal title="Buat Order Baru" open={isCreateModalVisible} onOk={handleCreateOrder} onCancel={() => setIsCreateModalVisible(false)}> ... </Modal> */}

        </div>
    );
};

export default TransaksiKasir;