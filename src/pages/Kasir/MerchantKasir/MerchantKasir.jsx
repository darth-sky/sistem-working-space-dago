import React, { useState, useEffect } from "react";
import { Button, Tag, Spin, Alert } from "antd";
import { getMerchantOrders } from "../../../services/service"; // pastikan path benar

const MerchantKasir = () => {
  const [filter, setFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data dari backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getMerchantOrders();
        setOrders(data);
      } catch (err) {
        setError(err.message || "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Filter sesuai status_order
  const filteredOrders =
    filter === "All" ? orders : orders.filter((o) => o.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert message="Error" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <div className="p-4 bg-white min-h-screen">
      {/* Detail View */}
      {selectedOrder ? (
        <div>
          {/* Header */}
          <div>
            <h2 className="text-lg font-bold">Detail Order</h2>
            <p className="text-sm text-gray-500">
              {selectedOrder.code /* kode_invoice */}
            </p>
          </div>
          <div className="flex justify-between items-center mb-4">
            {/* Kiri */}
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold">
                {selectedOrder.name /* customer_name */}
              </h3>
              <Tag color="blue">{selectedOrder.type /* tipe_order */}</Tag>
              <Tag
                color={
                  selectedOrder.status === "Selesai"
                    ? "green"
                    : selectedOrder.status === "Baru"
                    ? "yellow"
                    : selectedOrder.status === "Diproses"
                    ? "blue"
                    : "red"
                }
              >
                {selectedOrder.status}
              </Tag>
            </div>

            {/* Back Button */}
            <Button onClick={() => setSelectedOrder(null)}>⬅ Back</Button>
          </div>

          {/* List Items */}
          <div className="space-y-3">
            {selectedOrder.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center bg-gray-200 rounded-lg px-4 py-3 shadow-sm"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm">x{item.qty}</p>
                  {item.note && (
                    <p className="text-xs text-gray-500">Note: {item.note}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    Rp {item.price.toLocaleString("id-ID")}
                  </p>
                  <Tag color="green">DONE</Tag>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // List View
        <div>
          <h3 className="text-base font-semibold mb-2">
            Active Order ({filteredOrders.length})
          </h3>

          {/* Tabs Filter */}
          <div className="flex space-x-2 mb-4">
            {["All", "Baru", "Diproses", "Selesai", "Batal"].map((tab) => (
              <Button
                key={tab}
                type={filter === tab ? "primary" : "default"}
                onClick={() => setFilter(tab)}
                className="rounded-full"
              >
                {tab}
              </Button>
            ))}
          </div>

          {/* Orders List */}
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="flex justify-between items-center bg-gray-200 rounded-lg px-4 py-3 shadow-sm cursor-pointer hover:bg-gray-300"
              >
                <div>
                  <p className="font-bold">{order.name}</p>
                  <div className="flex space-x-2 text-xs mt-1">
                    <Tag color="blue">{order.type}</Tag>
                    <Tag color="geekblue">{order.code}</Tag>
                  </div>
                </div>
                <Button
                  type="primary"
                  className={
                    order.status === "Selesai"
                      ? "bg-green-500"
                      : order.status === "Baru"
                      ? "bg-yellow-500 border-none"
                      : order.status === "Diproses"
                      ? "bg-blue-500"
                      : "bg-red-500"
                  }
                >
                  {order.status.toUpperCase()}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantKasir;
