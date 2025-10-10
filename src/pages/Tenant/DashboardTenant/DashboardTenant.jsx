import React, { useState, useEffect, useContext } from "react";
import { Input, Modal, Button, Spin, message } from "antd";
import { getOrdersByTenant, updateOrderStatus } from "../../../services/service"; 
import { AuthContext } from "../../../providers/AuthProvider";

const { Search } = Input;
const useAuth = () => useContext(AuthContext);

const DashboardTenant = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]); // State untuk hasil pencarian
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const { userProfile, loading: authLoading } = useAuth();
    const tenantId = userProfile?.detail?.id_tenant;
    
    useEffect(() => {
        const fetchOrders = async () => {
            if (!tenantId || authLoading) return; 
            try {
                setLoading(true);
                const res = await getOrdersByTenant(tenantId);

                // FIX 1: AKSES DATA DENGAN BENAR
                let fetchedOrders = res.data.datas || [];

                // FIX 2: MAPPING STATUS DARI BACKEND KE FRONTEND
                const statusMap = {
                    "Baru": "NEW",
                    "Diproses": "ON PROSES",
                    "Selesai": "FINISH"
                };

                fetchedOrders = fetchedOrders.map(order => ({
                    ...order,
                    status: statusMap[order.status] || order.status // Ubah status ke format UI
                }));

                setOrders(fetchedOrders);
                setFilteredOrders(fetchedOrders); // Inisialisasi data filter
            } catch (err) {
                console.error(err);
                message.error("Terjadi kesalahan saat memuat data pesanan.");
            } finally {
                setLoading(false);
            }
        };
       
        if (!authLoading && tenantId) { 
            fetchOrders();
        } else if (!authLoading && !tenantId) {
            setLoading(false); 
        }
    }, [tenantId, authLoading]);

    const updateStatus = async (id, newStatus) => {
        if (selectedOrder.status === newStatus) return;

        try {
            setIsUpdating(true);
            await updateOrderStatus(id, newStatus); 
            
            // Logika update state lokal setelah sukses
            const updatedOrders = orders.map((order) =>
                order.id === id ? { ...order, status: newStatus } : order
            );
            setOrders(updatedOrders);
            setFilteredOrders(updatedOrders); // Jangan lupa update data filter juga

            setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
            
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
                            key={order.id}
                            className="bg-white shadow rounded-lg p-4 flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedOrder(order)}
                        >
                            <div>
                                <p className="font-bold uppercase">{order.name}</p>
                                <p className="text-xs text-gray-600">{order.code}</p>
                            </div>
                            <span
                                className={`font-bold py-1 px-3 rounded-full text-xs 
                                    ${order.status === "NEW"
                                        ? "bg-red-100 text-red-600"
                                        : order.status === "ON PROSES"
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
                                <li key={item.id || idx} className="ml-2">
                                    <span className="font-medium">{item.name}</span> (Qty: {item.qty})<br />
                                    {item.note && <span className="text-gray-600 text-xs italic">Catatan: {item.note}</span>}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6 flex gap-3 justify-center">
                            {selectedOrder.status === "NEW" && (
                                <>
                                    <Button
                                        type="primary"
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
                            {selectedOrder.status === "ON PROSES" && (
                                <Button
                                    type="primary"
                                    style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                                    onClick={() => updateStatus(selectedOrder.id, "FINISH")}
                                    loading={isUpdating}
                                >
                                    Tandai Selesai
                                </Button>
                            )}
                            {selectedOrder.status === "FINISH" && (
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