import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Tag,
  Select,
  Dropdown,
  Menu,
  Input,
  Modal,
  Radio,
  message,
} from "antd";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import { getDataTransaksiKasir } from "../../../services/service.js";
import dayjs from "dayjs";

const { Option } = Select;

// Komponen kecil untuk menampilkan satu order
const OrderCard = ({ order, getStatusColor, getDisplayStatus }) => (
  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 shadow-sm border">
    <div className="flex-1">
      {/* Nama Customer */}
      <div className="font-semibold">{order.name}</div>

      {/* Room / kode booking */}
      {order.room && (
        <div className="text-sm text-gray-500">{order.room}</div>
      )}

      {/* Items / produk F&B */}
      {order.items.length > 0 && (
        <div className="text-sm text-gray-600 mt-1">
          {order.items.map((item, index) => (
            <span key={index}>
              {item.product} x{item.qty}
              {index < order.items.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
      )}

      {/* Waktu transaksi */}
      <div className="text-xs text-gray-500 mt-1">
        {dayjs(order.time).format("DD/MM/YYYY HH:mm")}
      </div>
    </div>

    {/* Tag Type, Status, dan Price */}
    <div className="flex space-x-2 items-center">
      <Tag
        color={
          order.type === "Dine In"
            ? "purple"
            : order.type === "Takeout"
            ? "green"
            : order.type === "Pick Up"
            ? "orange"
            : "default"
        }
      >
        {order.type}
      </Tag>

      <Tag
        color={getStatusColor(order.status)}
        className="px-3 py-1 rounded-md font-medium"
      >
        {getDisplayStatus(order.status)}
      </Tag>

      <span className="font-semibold text-blue-600 min-w-[100px] text-right">
        Rp {order.price.toLocaleString("id-ID")}
      </span>
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

  const cashierName = "Rossa";

  const statusMap = {
    Baru: "WAITING",
    Diproses: "PROCESSING",
    Selesai: "COMPLETED",
    Batal: "CANCELLED",
  };

  const getStatusColor = (status) => {
    const frontendStatus = statusMap[status] || status;
    switch (frontendStatus) {
      case "WAITING":
        return "warning";
      case "COMPLETED":
        return "success";
      case "PROCESSING":
        return "processing";
      case "CANCELLED":
        return "error";
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

  // Filter order (hanya F&B, tanpa Booking)
  const filteredOrders = orders
    .filter((o) => o.type !== "Booking")
    .filter((order) => {
      if (filterStatus !== "all") {
        const statusMatch =
          filterStatus === "waiting"
            ? "WAITING"
            : filterStatus === "processing"
            ? "PROCESSING"
            : filterStatus === "completed"
            ? "COMPLETED"
            : filterStatus === "cancelled"
            ? "CANCELLED"
            : "";
        if (getDisplayStatus(order.status) !== statusMatch) return false;
      }

      if (filterType !== "all") {
        const typeMatch =
          filterType === "dinein"
            ? "Dine In"
            : filterType === "takeaway"
            ? "Takeout"
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

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Section */}
      <div className="flex-1 bg-white p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold">Welcome</h2>
            <p className="text-sm text-gray-500">
              Dago Creative Hub & Coffee Lab
            </p>
          </div>
        </div>

        <div className="pb-2">
          <Input.Search
            placeholder="Cari nama customer, lokasi, atau produk..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Filter + New Order */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              className="w-32"
            >
              <Option value="all">Semua Status</Option>
              <Option value="waiting">Menunggu</Option>
              <Option value="processing">Diproses</Option>
              <Option value="completed">Selesai</Option>
              <Option value="cancelled">Dibatalkan</Option>
            </Select>

            <Select
              value={filterType}
              onChange={setFilterType}
              className="w-32"
            >
              <Option value="all">Semua Tipe</Option>
              <Option value="dinein">Dine In</Option>
              <Option value="takeaway">Takeout</Option>
              <Option value="pickup">Pick Up</Option>
            </Select>

            <Dropdown overlay={Menu}>
              <Button>Terbaru</Button>
            </Dropdown>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Order Baru
          </Button>
        </div>

        {/* Orders List (Hanya F&B) */}
        <div className="space-y-3">
          <h3 className="font-semibold mb-2">
            Transaksi F&B ({filteredOrders.length})
          </h3>
          {loading ? (
            <div className="text-center py-8">Memuat data...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada transaksi F&B
            </div>
          ) : (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                getStatusColor={getStatusColor}
                getDisplayStatus={getDisplayStatus}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="w-80 bg-gray-100 p-4 space-y-6">
        <div className="flex justify-between bg-white rounded-lg p-4 shadow">
          <h3 className="text-sm font-semibold text-gray-700">
            Total Penjualan
          </h3>
          <p className="text-xl font-bold text-blue-600">
            Rp {totalSales.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="flex justify-center">
          <img src="/img/logo_dago.png" alt="Logo Dago" className="h-16" />
        </div>

        <div className="bg-white rounded-lg p-4 shadow">
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

      {/* Modal New Order */}
      <Modal
        title="Buat Order Baru"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={400}
      >
        <p className="text-gray-600 mb-4">
          {dayjs().format("DD MMMM YYYY HH:mm:ss")}
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Tipe Order</label>
          <Radio.Group
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            className="w-full"
          >
            <Radio.Button value="Dine In" className="w-1/3 text-center">
              Dine In
            </Radio.Button>
            <Radio.Button value="Takeout" className="w-1/3 text-center">
              Takeout
            </Radio.Button>
            <Radio.Button value="Pick Up" className="w-1/3 text-center">
              Pick Up
            </Radio.Button>
          </Radio.Group>
        </div>

        <Input
          placeholder="Nama Customer (opsional)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="mb-4"
        />

        {orderType === "Dine In" && (
          <Input
            placeholder="Nomor Meja/Ruangan (contoh: Meja 1, RM1)"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="mb-4"
          />
        )}

        <p className="text-gray-600">
          <UserOutlined className="mr-2" />
          Kasir: {cashierName}
        </p>

        <Button
          type="primary"
          block
          icon={<PlusOutlined />}
          onClick={handleCreateOrder}
          className="mt-4"
          size="large"
        >
          Buat Order
        </Button>
      </Modal>
    </div>
  );
};

export default TransaksiKasir;
