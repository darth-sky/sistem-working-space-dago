import React, { useState, useEffect, useContext, useRef } from "react";
import { Input, Modal, Button, Spin, message } from "antd";
import { getOrdersByTenant, updateOrderStatus } from "../../../services/service"; // Pastikan path ini benar
import { AuthContext } from "../../../providers/AuthProvider"; // Pastikan path ini benar

const { Search } = Input;
const useAuth = () => useContext(AuthContext);

const DashboardTenant = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]); 
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const { userProfile, loading: authLoading } = useAuth();
    
    // 👈 PERUBAHAN: tenantId diambil dari context
    const tenantId = userProfile?.detail?.id_tenant;

    const notificationSound = useRef(null);
    const knownOrderIds = useRef(new Set());

    useEffect(() => {
        // 👈 PERUBAHAN: Pastikan path ke file audio benar dari root public
        notificationSound.current = new Audio("/sounds/notification.mp3");
    }, []);

    useEffect(() => {
        if (authLoading || !tenantId) return;

        const fetchAndCheckOrders = async () => {
            try {
                const res = await getOrdersByTenant(tenantId);
                const fetchedOrders = res.data.datas || [];

                const hasNewOrder = fetchedOrders.some(order => !knownOrderIds.current.has(order.id));

                if (hasNewOrder && knownOrderIds.current.size > 0) { 
                    notificationSound.current.play().catch(e => console.error("Audio play failed:", e));
                }

                fetchedOrders.forEach(order => knownOrderIds.current.add(order.id));

                setOrders(fetchedOrders);

            } catch (err) {
                console.error("Polling error:", err);
            } finally {
                setLoading(false); 
            }
        };

        fetchAndCheckOrders();
        const intervalId = setInterval(fetchAndCheckOrders, 15000);
        return () => clearInterval(intervalId);

    }, [tenantId, authLoading]);

    useEffect(() => {
        setFilteredOrders(orders); 
    }, [orders]);


    // 👈 PERUBAHAN BESAR: Logika fungsi updateStatus diubah total
    const updateStatus = async (transaksiId, newStatusUi) => {
        // transaksiId = ID Transaksi (misal: 346)
        // newStatusUi = Status dari UI (misal: "ON PROSES" atau "FINISH")

        // 1. Cek apakah tenantId ada sebelum mengirim
        if (!tenantId) {
            message.error("ID Tenant tidak ditemukan. Silakan login ulang.");
            return;
        }
        
        try {
            setIsUpdating(true);
            
            // 2. 👈 Panggil service dengan 3 parameter
            await updateOrderStatus(transaksiId, newStatusUi, tenantId);

            // 3. Siapkan status DB baru untuk update state lokal
            const dbStatusMap = {
                "ON PROSES": "Diproses",
                "FINISH": "Selesai"
            };
            const newDbStatus = dbStatusMap[newStatusUi]; // misal: "Diproses"

            // 4. Logika update state lokal (cocokkan dengan ID Transaksi)
            const updatedOrders = orders.map((order) =>
                order.id === transaksiId ? { ...order, status: newDbStatus } : order
            );
            setOrders(updatedOrders);
            setFilteredOrders(updatedOrders); 

            // 5. Update state modal juga
            setSelectedOrder((prev) => (prev ? { ...prev, status: newDbStatus } : prev));

            message.success(`Status pesanan #${selectedOrder.code} berhasil diperbarui!`);

        } catch (err) {
            console.error(err);
            message.error("Gagal memperbarui status. Silakan coba lagi.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSearch = (value) => {
        const lowercasedValue = value.toLowerCase();
        const filtered = orders.filter(order =>
            (order.code && order.code.toLowerCase().includes(lowercasedValue)) ||
            (order.name && order.name.toLowerCase().includes(lowercasedValue))
        );
        setFilteredOrders(filtered);
    };

    if (loading || authLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spin size="large" tip="Memuat Data Tenant..." />
            </div>
        );
    }

    if (!tenantId) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-semibold mb-3">Akses Ditolak</h2>
                <p className="text-gray-600">Akun Anda tidak terhubung dengan Tenant manapun.</p>
            </div>
        );
    }

    return (
        <div className="p-6 overflow-y-auto flex-1">
            <h2 className="text-xl font-semibold mb-1">Welcome</h2>
            <p className="text-gray-600 mb-6">DagoEng Creative Hub & Coffee Lab</p>

            <div className="mb-6">
                <Search
                    placeholder="Search Order Code / Customer Name"
                    allowClear
                    className="w-full md:w-1/2"
                    onSearch={handleSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>

            <h3 className="text-lg font-semibold mb-4">Active Order ({filteredOrders.length})</h3>

            <div className="space-y-4">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                        <div
                            key={order.id} // key menggunakan ID Transaksi
                            className="bg-white shadow rounded-lg p-4 flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedOrder(order)}
                        >
                            <div>
                                <p className="font-bold uppercase">{order.name}</p>
                                <p className="text-xs text-gray-600">{order.code}</p>
                            </div>
                            <span
                                className={`font-bold py-1 px-3 rounded-full text-xs 
                                    ${order.status === "Baru"
                                        ? "bg-red-100 text-red-600"
                                        : order.status === "Diproses"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-green-100 text-green-600"
                                    }`}
                            >
                                {order.status}
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500">Tidak ada pesanan aktif</p>
                )}
            </div>

            <Modal
                title={`Detail Pesanan: ${selectedOrder?.code || ""}`}
                open={!!selectedOrder}
                footer={null}
                onCancel={() => setSelectedOrder(null)}
                width={600}
            >
                {selectedOrder && (
                    <div className="text-sm">
                        <p className="mb-1"><b>Nomor Pesanan:</b> {selectedOrder.code}</p>
                        <p className="mb-1"><b>Nama Pelanggan:</b> {selectedOrder.name}</p>
                        <p className="mb-1"><b>Jenis Pesanan:</b> {selectedOrder.type}</p>
                        <p className="mb-1"><b>Tempat:</b> {selectedOrder.place}</p>
                        <p className="mb-3"><b>Total Harga:</b> Rp{selectedOrder.total.toLocaleString('id-ID')}</p>
                        <hr className="my-3" />

                        <p className="font-semibold mb-2 text-md">Rincian Pesanan:</p>
                        <ul className="space-y-2 list-disc list-inside">
                            {selectedOrder.items.map((item, idx) => (
                                // key menggunakan id_detail_order dari item
                                <li key={item.id_detail_order || idx} className="ml-2"> 
                                    <span className="font-medium">{item.name}</span> (Qty: {item.qty})<br />
                                    {item.note && <span className="text-gray-600 text-xs italic">Catatan: {item.note}</span>}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6 flex gap-3 justify-center">
                            {selectedOrder.status === "Baru" && (
                                <>
                                    <Button
                                        type="primary"
                                        // 👈 PERUBAHAN: Kirim ID Transaksi dan Status UI
                                        onClick={() => updateStatus(selectedOrder.id, "ON PROSES")}
                                        loading={isUpdating}
                                    >
                                        Terima Order
                                    </Button>
                                    <Button
                                        danger
                                        onClick={() => message.info("Fitur Batalkan Order belum diimplementasikan")}
                                    >
                                        Batalkan
                                    </Button>
                                </>
                            )}
                            {selectedOrder.status === "Diproses" && (
                                <Button
                                    type="primary"
                                    style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                                    // 👈 PERUBAHAN: Kirim ID Transaksi dan Status UI
                                    onClick={() => updateStatus(selectedOrder.id, "FINISH")}
                                    loading={isUpdating}
                                >
                                    Tandai Selesai
                                </Button>
                            )}
                            {selectedOrder.status === "Selesai" && (
                                <div className="text-green-600 font-bold text-lg p-2 border-2 border-green-600 rounded">✅ SELESAI</div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default DashboardTenant;