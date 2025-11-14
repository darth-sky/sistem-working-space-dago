// src/pages/Kasir/TransaksiKasir/TransaksiKasir.jsx

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
    Card, // --- TAMBAHAN: Import Card ---
    Descriptions, // --- TAMBAHAN: Import Descriptions ---
} from "antd";
import { PlusOutlined, UserOutlined, EditOutlined } from "@ant-design/icons";

// --- TAMBAHAN: Import Pie Chart ---
import { Pie } from "@ant-design/charts";
// --- AKHIR TAMBAHAN ---

import {
    getDataTransaksiKasir,
    updatePaymentStatus,
    updateBatalStatus
} from "../../../services/service.js";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { formatRupiah } from "../../../utils/formatRupiah";
import { useAuth } from "../../../providers/AuthProvider";
import logoDago from "../../../assets/images/logo.png"


const { Option } = Select;

// Komponen OrderCard (Tidak perlu diubah, sudah generik)
const OrderCard = ({ order, getStatusColor, getDisplayStatus, getPaymentStatusColor, onClick }) => (
    <div
        className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer"
        onClick={() => onClick(order)} // Panggil onClick saat card diklik
    >
        <div className="flex-1 min-w-0 mr-4"> {/* Tambahkan min-w-0 untuk handle overflow text */}
            <div className="flex justify-between items-center mb-1">
                <div className="font-semibold text-base text-gray-800 tracking-wide truncate"> {/* Tambahkan truncate */}
                    {order.name} {order.location && order.location !== '-' ? `(${order.location})` : ''} {/* Tampilkan lokasi/ruangan */}
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
                        color={order.type === 'Booking' ? 'purple' : 'cyan'} // Warna berbeda untuk Booking
                        className="font-medium rounded-md px-2 py-1 text-xs sm:text-sm border-none"
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
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [filterPayment, setFilterPayment] = useState("all"); // <-- Filter Status Pembayaran
    const [searchText, setSearchText] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const navigate = useNavigate();
    const [isUpdating, setIsUpdating] = useState(false); // Loading untuk tombol di modal

    const notificationSound = useRef(null);
    const knownTransactionIds = useRef(new Set());

    // --- PERUBAHAN: Gunakan activeSession dan isSessionLoading ---
    const { activeSession, isSessionLoading } = useAuth();
    // -----------------------------------------------------------

    // Inisialisasi Audio
    useEffect(() => {
        notificationSound.current = new Audio("/sounds/notification.mp3");
    }, []);

    // --- PERUBAHAN: Modifikasi fetchAndCheckOrders untuk memetakan lokasi booking ---
    const fetchAndCheckOrders = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);
        try {
            const result = await getDataTransaksiKasir();

            if (result.message !== "OK") {
                throw new Error(result.error || "Gagal mengambil data transaksi");
            }

            const fetchedOrders = result.datas?.map((o) => {
                const isBooking = o.type === 'Booking';
                let orderLocation = o.location || "-"; // Default ke lokasi F&B

                // Jika ini adalah booking, ambil nama ruangan dari array bookings
                if (isBooking && o.bookings && o.bookings.length > 0) {
                    orderLocation = o.bookings.map(b => b.room_name).join(', ');
                }

                return {
                    id: o.id,
                    name: o.customer || "Guest",
                    location: orderLocation, // <-- LOKASI YANG SUDAH DIPERBARUI
                    status: o.status_pesanan || 'N/A',
                    price: o.total || 0,
                    items: o.items || [], // Ambil F&B items
                    bookings: o.bookings || [], // Ambil Booking items
                    time: o.time || new Date().toISOString(),
                    type: o.type || 'N/A',
                    payment_status: o.payment_status || 'N/A',
                    payment_method: o.payment_method || '-',
                };
            }) || [];

            // ... (Logika notifikasi suara tetap sama) ...
            const currentIds = new Set(fetchedOrders.map(o => o.id));
            const hasNewOrder = fetchedOrders.some(
                (order) => !knownTransactionIds.current.has(order.id)
            );

            if (hasNewOrder && knownTransactionIds.current.size > 0 && notificationSound.current) {
                notificationSound.current
                    .play()
                    .catch((e) => console.error("Audio play failed:", e));
            }

            setOrders(fetchedOrders);
            knownTransactionIds.current = currentIds;

        } catch (err) {
            console.error("Polling/Fetch error:", err);
            if (isInitialLoad) {
                message.error(`Gagal memuat data transaksi: ${err.message || 'Error tidak diketahui'}`);
            }
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            }
        }
    }, []);
    // --------------------------------------------------------------------------

    // --- PERUBAHAN: Gunakan useEffect yang "Session-Aware" ---
    useEffect(() => {
        let intervalId = null;

        const startPolling = () => {
            fetchAndCheckOrders(true); // Panggil sekali saat start
            intervalId = setInterval(() => fetchAndCheckOrders(false), 15000); // Polling
        };

        if (isSessionLoading) {
            setLoading(true);
            return; // Tunggu
        }

        if (activeSession) {
            startPolling(); // Sesi aktif, mulai
        } else {
            setLoading(false); // Sesi tidak aktif
            setOrders([]);
            knownTransactionIds.current.clear();
        }

        // Cleanup
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [activeSession, isSessionLoading, fetchAndCheckOrders]);
    // ---------------------------------------------------------

    // ... (Fungsi helper getStatusColor & getPaymentStatusColor tetap sama) ...
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
            case "Disimpan": return "geekblue";
            case "Dibatalkan": return "red";
            default: return "default";
        }
    };
    const getDisplayStatus = (status) => status || 'N/A';

    // --- PERUBAHAN: Buat DUA filtered list ---

    // 1. Filter untuk F&B Orders
    const filteredFnbOrders = useMemo(() => orders
        .filter((o) => o.type !== "Booking") // HANYA F&B
        .filter((order) => {
            // Filter Status Pesanan (F&B)
            if (filterStatus !== "all") {
                if (filterStatus === "Diproses") {
                    if (order.status !== "Diproses" && order.status !== "Sebagian Diproses") return false;
                } else if (order.status !== filterStatus) {
                    return false;
                }
            }
            // Filter Tipe Order (F&B)
            if (filterType !== "all") {
                const typeMap = { dinein: "Dine In", takeaway: "Takeaway", pickup: "Pick Up" };
                if (order.type.toLowerCase() !== typeMap[filterType].toLowerCase()) return false;
            }
            // Filter Status Pembayaran (Umum)
            if (filterPayment !== "all") {
                if (order.payment_status !== filterPayment) return false;
            }
            // Filter Pencarian Teks (Umum)
            if (searchText) {
                const searchLower = searchText.toLowerCase();
                const itemMatch = order.items?.some(item =>
                    item.product?.toLowerCase().includes(searchLower)
                );
                return (
                    order.name?.toLowerCase().includes(searchLower) ||
                    order.location?.toLowerCase().includes(searchLower) ||
                    order.id?.toString().includes(searchLower) ||
                    itemMatch
                );
            }
            return true;
        }), [orders, filterStatus, filterType, filterPayment, searchText]);

    // 2. Filter untuk Booking Orders
    const filteredBookingOrders = useMemo(() => orders
        .filter((o) => o.type === "Booking") // HANYA Booking
        .filter((order) => {
            // Filter Status Pesanan (Booking punya status 'Baru', 'Selesai', 'Batal')
            if (filterStatus !== "all") {
                if (order.status !== filterStatus) return false;
            }
            // (Filter Tipe Order F&B dilewati)

            // Filter Status Pembayaran (Umum)
            if (filterPayment !== "all") {
                if (order.payment_status !== filterPayment) return false;
            }
            // Filter Pencarian Teks (Umum, tapi tanpa 'items')
            if (searchText) {
                const searchLower = searchText.toLowerCase();
                return (
                    order.name?.toLowerCase().includes(searchLower) ||
                    order.location?.toLowerCase().includes(searchLower) || // Ini sekarang mencari nama ruangan
                    order.id?.toString().includes(searchLower)
                );
            }
            return true;
        }), [orders, filterStatus, filterPayment, searchText]); // Perhatikan dependencies yang lebih sedikit
    // ----------------------------------------------------

    // --- PERUBAHAN: Kalkulasi summary berdasarkan F&B SAJA ---
    const totalSales = useMemo(() =>
        filteredFnbOrders // Ganti ke filteredFnbOrders
            .filter(order => order.payment_status === 'Lunas')
            .reduce((sum, order) => sum + (parseFloat(order.price) || 0), 0)
        , [filteredFnbOrders]);

    const productSummary = useMemo(() => filteredFnbOrders // Ganti ke filteredFnbOrders
        .filter(order => order.payment_status === 'Lunas')
        .reduce((acc, order) => {
            order.items?.forEach((item) => {
                const productName = item.product || 'Unknown Product';
                if (!acc[productName]) acc[productName] = { qty: 0, total: 0 };
                acc[productName].qty += (item.qty || 0);
                acc[productName].total += (item.price || 0) * (item.qty || 0);
            });
            return acc;
        }, {})
        , [filteredFnbOrders]);

    const topProducts = useMemo(() => Object.entries(productSummary)
        .map(([product, data], index) => ({
            key: index + 1,
            item: product,
            qty: data.qty,
            total: formatRupiah(data.total),
        }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10)
        , [productSummary]);

    const tenantSummary = useMemo(() => {
        const summary = filteredFnbOrders // Ganti ke filteredFnbOrders
            .filter(order => order.payment_status === 'Lunas')
            .reduce((acc, order) => {
                order.items?.forEach((item) => {
                    const tenantName = item.tenant_name || 'Lainnya';
                    if (!acc[tenantName]) {
                        acc[tenantName] = 0;
                    }
                    acc[tenantName] += (item.price || 0) * (item.qty || 0);
                });
                return acc;
            }, {});

        return Object.entries(summary).map(([tenantName, total]) => ({
            type: tenantName,
            value: total,
        }));
    }, [filteredFnbOrders]);
    // ---------------------------------------------------------------

    // ... (Konfigurasi Pie Chart tetap sama) ...
    const pieConfig = {
        data: tenantSummary,
        angleField: 'value',
        colorField: 'type',
        radius: 0.85,
        innerRadius: 0.6, // Membuatnya jadi Donut chart
        label: {
            type: 'inner',
            offset: '-50%',
            content: '{value}', // Tampilkan nilai
            style: {
                textAlign: 'center',
                fontSize: 12,
                fill: '#fff'
            },
        },
        legend: {
            position: 'bottom', // Pindahkan legenda ke bawah
        },
        interactions: [{ type: 'element-selected' }, { type: 'element-active' }],
        animation: {
            appear: {
                animation: 'wave-in',
                duration: 500,
            },
        },
        tooltip: {
            formatter: (datum) => {
                return { name: datum.type, value: formatRupiah(datum.value) };
            },
        },
    };

    // ... (Semua handler modal: handleOrderClick, handleCloseDetail, handleMarkAsPaid, handleMarkAsBatal, handleContinueOrder tetap sama) ...
    const handleOrderClick = (order) => {
        setSelectedOrder(order);
        setIsModalVisible(true);
    };

    const handleCloseDetail = () => {
        setIsModalVisible(false);
        setTimeout(() => setSelectedOrder(null), 300);
    };

    const handleMarkAsPaid = async () => {
        if (!selectedOrder || selectedOrder.payment_status === 'Lunas' || selectedOrder.payment_status === 'Disimpan') return;
        setIsUpdating(true);
        try {
            await updatePaymentStatus(selectedOrder.id);
            message.success(`Transaksi #${selectedOrder.id} telah ditandai Lunas.`);
            handleCloseDetail();
            await fetchAndCheckOrders(false);
        } catch (error) {
            console.error("Error updating payment status:", error);
            message.error(`Gagal memperbarui status: ${error.message || 'Error tidak diketahui'}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleMarkAsBatal = async () => {
        if (!selectedOrder || selectedOrder.payment_status === 'Lunas' || selectedOrder.payment_status === 'Disimpan') return;
        setIsUpdating(true);
        try {
            await updateBatalStatus(selectedOrder.id);
            message.success(`Transaksi #${selectedOrder.id} telah ditandai Dibatalkan.`);
            handleCloseDetail();
            await fetchAndCheckOrders(false);
        } catch (error) {
            console.error("Error updating payment status:", error);
            message.error(`Gagal memperbarui status: ${error.message || 'Error tidak diketahui'}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleContinueOrder = () => {
        if (!selectedOrder || selectedOrder.payment_status !== 'Disimpan') return;
        handleCloseDetail();
        navigate('/orderkasir', { state: { savedOrderId: selectedOrder.id } });
    };


    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* LEFT PANEL */}
            <div className="flex-1 bg-white p-5 overflow-y-auto rounded-r-3xl shadow-inner custom-scrollbar">
                {/* ... (Header Welcome, Search Bar, Filters, Tombol Order Baru tetap sama) ... */}
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Welcome</h2>
                        <p className="text-sm text-gray-500">Dago Creative Hub & Coffee Lab</p>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600 text-sm">
                    </div>
                </div>
                <div className="pb-3">
                    <Input.Search
                        placeholder="Cari ID, nama customer, lokasi/ruangan, atau produk..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="rounded-lg"
                        allowClear
                    />
                </div>
                <div className="flex flex-wrap gap-3 justify-between items-center mb-5">
                    <div className="flex flex-wrap gap-3 items-center">
                        <Select
                            value={filterStatus}
                            onChange={setFilterStatus}
                            className="w-full md:w-auto md:min-w-[180px]"
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
                            className="w-full md:w-auto md:min-w-[180px]"
                        >
                            <Option value="all">Semua Tipe Order F&B</Option>
                            <Option value="dinein">Dine In</Option>
                            <Option value="takeaway">Takeaway</Option>
                            <Option value="pickup">Pick Up</Option>
                        </Select>

                        <Select
                            value={filterPayment}
                            onChange={setFilterPayment}
                            className="w-full md:w-auto md:min-w-[180px]"
                        >
                            <Option value="all">Semua Status Bayar</Option>
                            <Option value="Lunas">Lunas</Option>
                            <Option value="Belum Lunas">Belum Lunas</Option>
                            <Option value="Disimpan">Disimpan</Option>
                            <Option value="Dibatalkan">Dibatalkan</Option>
                        </Select>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/buatorderkasir')}
                        className="rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                    >
                        Order Baru
                    </Button>
                </div>

                {/* --- PERUBAHAN: Tampilkan Daftar F&B --- */}
                <h3 className="font-semibold mb-2 text-gray-700">
                    Transaksi F&B ({filteredFnbOrders.length})
                </h3>
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex justify-center items-center py-16">
                            <Spin tip="Memuat transaksi..." size="large" />
                        </div>
                    ) : orders.length === 0 && !loading ? (
                        // Jika tidak ada data SAMA SEKALI (termasuk booking)
                        <div className="text-center py-8 text-gray-400">
                            {activeSession
                                ? "Tidak ada transaksi pada sesi ini."
                                : "Tidak ada sesi kasir yang aktif."
                            }
                        </div>
                    ) : filteredFnbOrders.length === 0 ? (
                        // Jika ada data, tapi F&B terfilter habis
                        <div className="text-center py-8 text-gray-400">
                            Tidak ada transaksi F&B yang cocok dengan filter.
                        </div>
                    ) : (
                        filteredFnbOrders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                getStatusColor={getStatusColor}
                                getDisplayStatus={getDisplayStatus}
                                getPaymentStatusColor={getPaymentStatusColor}
                                onClick={handleOrderClick}
                            />
                        ))
                    )}
                </div>

            </div>

            {/* RIGHT PANEL (Summary) */}
            {/* Panel ini sekarang HANYA menampilkan summary F&B */}
            <div className="w-80 bg-gray-50 p-5 flex flex-col gap-6 lg:block">
                <div className="flex justify-between bg-white rounded-xl p-4 shadow-sm flex-shrink-0">
                    <h3 className="text-sm font-semibold text-gray-600">Total Penjualan F&B (Lunas)</h3>
                    <p className="text-xl font-bold text-blue-600">
                        {formatRupiah(totalSales)}
                    </p>
                </div>

                <Card title="Sales F&B per Tenant (Lunas)" size="small" className="shadow-sm flex-shrink-0">
                    {loading ? (
                        <div className="flex justify-center items-center h-[280px]">
                            <Spin />
                        </div>
                    ) : tenantSummary.length > 0 ? (
                        // --- MULAI PERUBAHAN ---
                        <div style={{ position: 'relative', height: 280 }}>
                            <Pie {...pieConfig} height={280} />
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '50%', // Pusat vertikal
                                    left: '50%', // Pusat horizontal
                                    transform: 'translate(-50%, -35%)', // Pastikan di tengah
                                    width: '100px', // Ukuran logo diperbesar
                                    height: '100px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <img
                                    src="/img/logo_dago.png" // Cukup pakai path dari /public
                                    alt="Logo"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                        </div>

                    ) : (

                        <div className="flex justify-center items-center h-[280px] text-gray-400">
                            Tidak ada data sales F&B.
                        </div>
                    )}
                </Card>

                <div className="bg-white rounded-xl p-4 shadow-sm flex-1 min-h-0 flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex-shrink-0">Top 10 Produk F&B (Lunas)</h3>
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                        <Table
                            size="small"
                            pagination={false}
                            columns={[
                                { title: "Produk", dataIndex: "item", key: "item", ellipsis: true },
                                { title: "Qty", dataIndex: "qty", key: "qty", width: 50, align: 'center' },
                                {
                                    title: "Total", dataIndex: "total", key: "total", width: 100, align: 'right',
                                    render: (text) => <span className="font-medium">{text}</span>
                                },
                            ]}
                            dataSource={topProducts}
                        />
                    </div>
                </div>
            </div>

            {/* --- PERUBAHAN: Modal Cerdas (Menampilkan F&B atau Booking) --- */}
            <Modal
                title={
                    <span className="text-lg font-semibold text-gray-800">
                        Detail Order #{selectedOrder?.id || ""} - {selectedOrder?.name || ""}
                    </span>
                }
                open={isModalVisible}
                onCancel={handleCloseDetail}
                width={500}
                className="rounded-xl"
                destroyOnClose
                footer={[
                    <Button key="back" onClick={handleCloseDetail}>
                        Tutup
                    </Button>,
                    selectedOrder?.payment_status === "Disimpan" && (
                        <Button
                            key="continue"
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={handleContinueOrder}
                            loading={isUpdating}
                            disabled={isUpdating}
                        >
                            Lanjutkan Order
                        </Button>
                    ),
                    selectedOrder?.payment_status === "Belum Lunas" && (
                        <Button
                            key="pay"
                            type="primary"
                            loading={isUpdating}
                            onClick={handleMarkAsPaid}
                            className="bg-green-600 hover:bg-green-700 border-green-600 text-white"
                        >
                            Tandai Lunas
                        </Button>
                    ),
                    selectedOrder?.payment_status === "Belum Lunas" && (
                        <Button
                            key="cancel"
                            type="primary"
                            danger
                            loading={isUpdating}
                            onClick={handleMarkAsBatal}
                        >
                            Tandai Batal
                        </Button>
                    ),
                ]}
        >
                {selectedOrder && (
                    <div className="space-y-3 text-gray-700 pt-4">
                        {/* Info Umum (Status, Bayar, Tipe, Lokasi) */}
                        <div className="flex justify-between items-center">
                            <span>Status Pesanan:</span>
                            <Tag color={getStatusColor(selectedOrder.status)}>
                                {getDisplayStatus(selectedOrder.status).toUpperCase()}
                            </Tag>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Status Bayar:</span>
                            <Tag color={getPaymentStatusColor(selectedOrder.payment_status)}>
                                {selectedOrder.payment_status.toUpperCase()}
                            </Tag>
                        </div>
                        {selectedOrder.payment_method && selectedOrder.payment_method !== '-' && (
                            <div className="flex justify-between">
                                <span>Metode Bayar:</span>
                                <span>{selectedOrder.payment_method}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span>Tipe:</span>
                            <span>{selectedOrder.type}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Lokasi/Ruangan:</span> {/* Label diubah */}
                            <span>{selectedOrder.location}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Waktu Order:</span>
                            <span>{dayjs(selectedOrder.time).format("DD/MM/YYYY HH:mm:ss")}</span>
                        </div>

                        {/* Detail Item F&B (Hanya tampil jika ada) */}
                        {selectedOrder.items && selectedOrder.items.length > 0 && (
                            <div className="mt-4 border-t pt-3">
                                <h4 className="font-semibold mb-2 text-gray-800">Item Pesanan F&B ({selectedOrder.items.length}):</h4>
                                <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                                    {selectedOrder.items.map((item, i) => (
                                        <div key={item.id_detail || i} className="flex justify-between text-sm">
                                            <span className="flex-1 mr-2">
                                                {item.product || 'Produk tidak diketahui'} x{item.qty || 0}
                                                {item.note && <i className="text-gray-500 block text-xs"> ({item.note})</i>}
                                            </span>
                                            <span className="font-medium whitespace-nowrap">
                                                {formatRupiah((item.price || 0) * (item.qty || 0))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Detail Booking (Hanya tampil jika ada) */}
                        {selectedOrder.bookings && selectedOrder.bookings.length > 0 && (
                            <div className="mt-4 border-t pt-3">
                                <h4 className="font-semibold mb-2 text-gray-800">Detail Booking Ruangan ({selectedOrder.bookings.length}):</h4>
                                <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                                    {selectedOrder.bookings.map((booking, i) => (
                                        <div key={booking.id_booking || i} className="text-sm mb-2">
                                            <div className="flex justify-between font-medium">
                                                <span className="flex-1 mr-2">{booking.room_name}</span>
                                            </div>
                                            <ul className="text-xs text-gray-600 pl-4" style={{ listStyleType: 'disc' }}>
                                                <li>Kategori: {booking.room_category}</li>
                                                <li>Mulai: {dayjs(booking.start_time).format("DD MMM YYYY, HH:mm")}</li>
                                                <li>Selesai: {dayjs(booking.end_time).format("DD MMM YYYY, HH:mm")}</li>
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Total */}
                        <div className="flex justify-between font-bold mt-4 border-t pt-2 text-blue-700 text-lg">
                            <span>Total:</span>
                            <span>{formatRupiah(selectedOrder.price || 0)}</span>
                        </div>
                    </div>
                )}
            </Modal>
            {/* --- AKHIR PERUBAHAN MODAL --- */}
        </div>
    );
};

export default TransaksiKasir;