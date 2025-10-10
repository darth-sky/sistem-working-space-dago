import React, { useState, useEffect } from "react";
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
import { getDataTransaksiKasir } from "../../../services/service.js";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

// 💎 Card tampilan halus dan modern
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

  const cashierName = "Rossa";

  const statusMap = {
    Baru: "WAITING",
    Diproses: "IN_PROGRESS",
    Selesai: "FINISH",
    Batal: "CANCELLED",
  };

  const getStatusColor = (status) => {
    const frontendStatus = statusMap[status] || status;
    switch (frontendStatus) {
      case "WAITING":
        return "blue";
      case "IN_PROGRESS":
        return "orange";
      case "FINISH":
        return "green";
      case "CANCELLED":
        return "red";
      default:
        return "default";
    }
  };

  const getDisplayStatus = (status) => {
    return statusMap[status] || status;
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const result = await getDataTransaksiKasir();
      const mappedOrders = result.datas.map((o) => ({
        id: o.id,
        name: o.customer || "Guest",
        location: o.location || "-",
        status: o.status,
        price: o.total,
        items: o.items || [],
        time: o.time,
        type: o.type,
        room:
          o.bookings && o.bookings.length > 0 ? o.bookings[0].room_name : null,
      }));
      setOrders(mappedOrders);
    } catch (err) {
      console.error("Error fetching transaksi kasir:", err);
      message.error("Gagal memuat data transaksi");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders
    .filter((o) => o.type !== "Booking")
    .filter((order) => {
      if (filterStatus !== "all" && order.status !== filterStatus) return false;

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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT */}
      <div className="flex-1 bg-white p-5 overflow-y-auto rounded-r-3xl shadow-inner">
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

      {/* DETAIL MODAL */}
      <Modal
        title={
          <span className="text-lg font-semibold text-gray-800">
            Detail Order - {selectedOrder?.name || ""}
          </span>
        }
        open={!!selectedOrder}
        onCancel={handleCloseDetail}
        footer={null}
        width={500}
        className="rounded-xl"
      >
        {selectedOrder && (
          <div className="space-y-3 text-gray-700">
            <div className="flex justify-between">
              <span>Status:</span>
              <Tag color={getStatusColor(selectedOrder.status)}>
                {getDisplayStatus(selectedOrder.status)}
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
