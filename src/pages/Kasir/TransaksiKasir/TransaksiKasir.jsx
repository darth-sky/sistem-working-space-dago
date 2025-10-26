import React, { useState, useEffect, useRef, useCallback } from "react"; // 💎 1. Impor useCallback
import {
  Button,
  Table,
  Tag,
  Select,
  Input,
  Modal,
  Radio,
  message,
} from "antd";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
// 💎 2. Impor service baru Anda
import {
  getDataTransaksiKasir,
  updatePaymentStatus,
} from "../../../services/service.js";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

// 💎 3. Perbarui props OrderCard: Hapus 'transaksi' dan 'index'
const OrderCard = ({ order, getStatusColor, getDisplayStatus, onClick }) => (
  <div
    className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer"
    onClick={() => onClick(order)}
  >
    <div className="flex-1">
      <div className="flex justify-between items-center">
        <div className="font-semibold text-base text-gray-800 tracking-wide">
          {order.name}
        </div>
        <div className="flex items-center space-x-2">
          <Tag
            color={getStatusColor(order.status)}
            className="font-medium rounded-md px-2 py-1 text-sm"
          >
            {getDisplayStatus(order.status).toUpperCase()}
          </Tag>
          {/* 💎 4. Dapatkan payment_status langsung dari 'order' */}
          <Tag
            color={order.payment_status === "Lunas" ? "green" : "red"}
            className="font-medium rounded-md px-2 py-1 text-sm"
          >
            {order.payment_status.toUpperCase()}
          </Tag>
          <Tag
            color="cyan"
            className="font-medium rounded-md px-2 py-1 text-sm bg-cyan-50 text-cyan-700 border-none"
          >
            {order.type}
          </Tag>
        </div>
      </div>
    </div>
  </div>
);

const TransaksiKasir = () => {
  const [orders, setOrders] = useState([]);
  // 💎 5. Hapus state 'transaksi' yang duplikat
  // const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [orderType, setOrderType] = useState("Takeout");
  const [customerName, setCustomerName] = useState("");
  const [room, setRoom] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  // 💎 6. Tambahkan state loading untuk tombol update
  const [isUpdating, setIsUpdating] = useState(false);

  const notificationSound = useRef(null);
  const knownTransactionIds = useRef(new Set());

  // 💎 7. Inisialisasi audio (path lebih baik menggunakan root-relative)
  useEffect(() => {
    notificationSound.current = new Audio("/sounds/notification.mp3");
  }, []);

  // 💎 8. Pindahkan fungsi fetch data ke luar 'useEffect' dan bungkus dengan 'useCallback'
  const fetchAndCheckOrders = useCallback(async () => {
    try {
      const result = await getDataTransaksiKasir();
      const fetchedOrders = result.datas.map((o) => ({
        id: o.id,
        name: o.customer || "Guest",
        location: o.location || "-",
        status: o.status_pesanan,
        price: o.total,
        items: o.items || [],
        time: o.time,
        type: o.type,
        room:
          o.bookings && o.bookings.length > 0 ? o.bookings[0].room_name : null,
        // 💎 9. Tambahkan status pembayaran ke state 'orders'
        payment_status: o.payment_status,
        payment_method: o.payment_method,
      }));

      // Cek apakah ada transaksi baru yang belum pernah dilihat
      const hasNewOrder = fetchedOrders.some(
        (order) => !knownTransactionIds.current.has(order.id)
      );

      // Hanya putar suara jika ini bukan fetch pertama kali
      if (hasNewOrder && knownTransactionIds.current.size > 0) {
        notificationSound.current
          .play()
          .catch((e) => console.error("Audio play failed:", e));
      }

      // Perbarui daftar ID transaksi yang sudah diketahui
      fetchedOrders.forEach((order) => knownTransactionIds.current.add(order.id));

      setOrders(fetchedOrders);
    } catch (err) {
      console.error("Polling error:", err);
      // Hanya tampilkan pesan error saat load awal, bukan saat polling
      if (loading) {
        message.error("Gagal memuat data transaksi");
      }
    } finally {
      // Matikan loading utama hanya sekali (saat load awal)
      if (loading) {
        setLoading(false);
      }
    }
  }, [loading]); // 💎 useCallback akan membuat fungsi baru jika 'loading' berubah

  // 💎 10. Perbarui 'useEffect' polling untuk menggunakan 'fetchAndCheckOrders' dari useCallback
  useEffect(() => {
    // Panggil sekali saat komponen dimuat
    fetchAndCheckOrders();

    // Atur interval polling (setiap 15 detik)
    const intervalId = setInterval(fetchAndCheckOrders, 15000);

    // Hentikan interval saat komponen dibongkar (pindah halaman)
    return () => clearInterval(intervalId);
  }, [fetchAndCheckOrders]); // 💎 Daftarkan 'fetchAndCheckOrders' sebagai dependensi

  const cashierName = "Rossa";

  const getStatusColor = (status) => {
    const frontendStatus = status;
    switch (frontendStatus) {
      case "Baru":
        return "blue";
      case "Diproses":
        return "orange";
      case "Sebagian Diproses": // Warna baru
        return "orange";
      case "Selesai":
        return "green";
      case "Batal":
        return "red";
      default:
        return "default";
    }
  };

  const getDisplayStatus = (status) => {
    console.log(status);
    return status;
  };

  // 💎 11. HAPUS 'useEffect' dan 'fetchOrders' yang duplikat dan buggy
  // useEffect(() => {
  //   fetchOrders();
  // }, []);
  // const fetchOrders = async () => { ... };

  // 💎 12. HAPUS console.log yang tidak perlu
  // console.log({transaksinya: transaksi});

  const filteredOrders = orders
    .filter((o) => o.type !== "Booking")
    .filter((order) => {
      // ... (Logika filter Anda di sini tetap sama) ...
      if (filterStatus !== "all") {
        if (filterStatus === "Diproses") {
          // Jika filter 'In Progress', tampilkan 'Diproses' dan 'Sebagian Diproses'
          if (
            order.status !== "Diproses" &&
            order.status !== "Sebagian Diproses"
          )
            return false;
        } else if (order.status !== filterStatus) {
          return false;
        }
      }

      if (filterType !== "all") {
        const typeMatch =
          filterType === "dinein"
            ? "Dine In"
            : filterType === "takeaway"
              ? "Takeaway"
              : filterType === "pickup"
                ? "Pick Up"
                : "";
        if (order.type !== typeMatch) return false;
      }

      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          order.name.toLowerCase().includes(searchLower) ||
          order.location.toLowerCase().includes(searchLower) ||
          order.items.some((item) =>
            item.product.toLowerCase().includes(searchLower)
          )
        );
      }

      return true;
    });

  const totalSales = filteredOrders.reduce((sum, order) => sum + order.price, 0);

  const productSummary = filteredOrders.reduce((acc, order) => {
    order.items.forEach((item) => {
      if (!acc[item.product]) acc[item.product] = { qty: 0, total: 0 };
      acc[item.product].qty += item.qty;
      acc[item.product].total += item.price * item.qty;
    });
    return acc;
  }, {});

  const topProducts = Object.entries(productSummary)
    .map(([product, data], index) => ({
      key: index + 1,
      item: product,
      qty: data.qty,
      total: `Rp ${data.total.toLocaleString("id-ID")}`,
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  const handleCreateOrder = () => {
    // ... (fungsi ini tetap sama)
    message.info("Fitur create order akan segera diimplementasikan");
    setCustomerName("");
    setRoom("");
    setOrderType("Takeout");
    setIsModalVisible(false);
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseDetail = () => {
    setSelectedOrder(null);
  };

  // 💎 13. Tambahkan handler untuk menandai lunas
  const handleMarkAsPaid = async () => {
    if (!selectedOrder) return;

    setIsUpdating(true);
    try {
      await updatePaymentStatus(selectedOrder.id);
      message.success(
        `Transaksi #${selectedOrder.id} telah ditandai Lunas.`
      );
      handleCloseDetail(); // Tutup modal
      await fetchAndCheckOrders(); // Refresh data list
    } catch (error) {
      console.error("Error updating payment status:", error);
      message.error("Gagal memperbarui status.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT */}
      <div className="flex-1 bg-white p-5 overflow-y-auto rounded-r-3xl shadow-inner">
        {/* ... (Header, Search, Filter, Tombol Order Baru tetap sama) ... */}
        {/* ... (Welcome, Search, Filters) ... */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Welcome</h2>
            <p className="text-sm text-gray-500">
              Dago Creative Hub & Coffee Lab
            </p>
          </div>
        </div>

        <div className="pb-3">
          <Input.Search
            placeholder="Cari nama customer, lokasi, atau produk..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="rounded-lg"
          />
        </div>

        <div className="flex justify-between items-center mb-5">
          <div className="flex space-x-3">
            <Select value={filterStatus} onChange={setFilterStatus} className="w-36">
              <Option value="all">All Status</Option>
              <Option value="Baru">Waiting</Option>
              <Option value="Diproses">In Progress</Option>
              <Option value="Selesai">Finish</Option>
            </Select>

            <Select value={filterType} onChange={setFilterType} className="w-36">
              <Option value="all">Semua Tipe</Option>
              <Option value="dinein">Dine In</Option>
              <Option value="takeaway">Takeaway</Option>
              <Option value="pickup">Pick Up</Option>
            </Select>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/buatorderkasir")}
            className="rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            Order Baru
          </Button>
        </div>


        <div className="space-y-3">
          <h3 className="font-semibold mb-2 text-gray-700">
            Transaksi F&B ({filteredOrders.length})
          </h3>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Memuat data...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Tidak ada transaksi F&B yang cocok
            </div>
          ) : (
            // 💎 14. Perbarui props & key untuk OrderCard
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                getStatusColor={getStatusColor}
                getDisplayStatus={getDisplayStatus}
                onClick={handleOrderClick}
              />
            ))
          )}
        </div>
      </div>

      {/* RIGHT */}
      {/* ... (Bagian Kanan / Ringkasan tetap sama) ... */}
      <div className="w-80 bg-gray-50 p-5 space-y-6">
        <div className="flex justify-between bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600">
            Total Penjualan
          </h3>
          <p className="text-xl font-bold text-blue-600">
            Rp {totalSales.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="flex justify-center">
          <img src="/img/logo_dago.png" alt="Logo Dago" className="h-16 opacity-80" />
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Top 10 Produk
          </h3>
          <Table
            size="small"
            pagination={false}
            columns={[
              { title: "Produk", dataIndex: "item", key: "item" },
              { title: "Qty", dataIndex: "qty", key: "qty" },
              {
                title: "Total",
                dataIndex: "total",
                key: "total",
                render: (text) => <span className="font-medium">{text}</span>,
              },
            ]}
            dataSource={topProducts}
            scroll={{ y: 240 }}
          />
        </div>
      </div>


      {/* 💎 15. Perbarui Modal untuk menyertakan footer dan status pembayaran */}
      <Modal
        title={
          <span className="text-lg font-semibold text-gray-800">
            Detail Order - {selectedOrder?.name || ""}
          </span>
        }
        open={!!selectedOrder}
        onCancel={handleCloseDetail}
        width={500}
        className="rounded-xl"
        // Tambahkan footer kustom
        footer={[
          <Button key="back" onClick={handleCloseDetail}>
            Tutup
          </Button>,
          // Tampilkan tombol ini HANYA jika status BUKAN 'Lunas'
          selectedOrder?.payment_status !== "Lunas" && (
            <Button
              key="submit"
              type="primary"
              loading={isUpdating}
              onClick={handleMarkAsPaid}
              // Styling opsional agar tombolnya hijau
              className="bg-green-600 hover:bg-green-700 border-green-600 text-white"
            >
              Tandai Lunas
            </Button>
          ),
        ]}
      >
        {selectedOrder && (
          <div className="space-y-3 text-gray-700">
            <div className="flex justify-between">
              <span>Status Pesanan:</span>
              <Tag color={getStatusColor(selectedOrder.status)}>
                {getDisplayStatus(selectedOrder.status)}
              </Tag>
            </div>
            {/* Tambahkan tampilan Status Pembayaran */}
            <div className="flex justify-between">
              <span>Status Bayar:</span>
              <Tag
                color={
                  selectedOrder.payment_status === "Lunas" ? "green" : "red"
                }
              >
                {selectedOrder.payment_status.toUpperCase()}
              </Tag>
            </div>
            <div className="flex justify-between">
              <span>Tipe:</span>
              <span>{selectedOrder.type}</span>
            </div>
            <div className="flex justify-between">
              <span>Lokasi:</span>
              <span>{selectedOrder.location}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal:</span>
              <span>{dayjs(selectedOrder.time).format("DD/MM/YYYY HH:mm")}</span>
            </div>

            <div className="mt-4 border-t pt-3">
              <h4 className="font-semibold mb-2 text-gray-800">Item Pesanan:</h4>
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm mb-1">
                  <span>
                    {item.product} x{item.qty}
                  </span>
                  <span>
                    Rp{(item.price * item.qty).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold mt-4 border-t pt-2 text-blue-700 text-lg">
              <span>Total:</span>
              <span>Rp{selectedOrder.price.toLocaleString("id-ID")}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransaksiKasir;