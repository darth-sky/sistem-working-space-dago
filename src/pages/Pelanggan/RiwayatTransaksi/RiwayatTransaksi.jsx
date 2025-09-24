import React, { useState, useEffect } from "react";
import {
  Card,
  List,
  Typography,
  Button,
  DatePicker,
  Modal,
  Row,
  Col,
  Empty,
  Tag,
  Divider,
  Space,
  Spin,
} from "antd";
import {
  CalendarOutlined,
  FileTextOutlined,
  DollarCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getRiwayatTransaksi } from "../../../services/service"; // ⬅️ import service

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const RiwayatTransaksi = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 Ambil data dari API saat pertama kali load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getRiwayatTransaksi();
        if (res?.data) {
          // mapping agar sesuai dengan UI kamu
          const mapped = res.data.map((trx) => ({
            id: trx.id_transaksi,
            tanggal: trx.tanggal_transaksi,
            total: trx.total_harga_final,
            status: trx.status_pembayaran === "Lunas" ? "Sukses" :
              trx.status_pembayaran === "Belum Lunas" ? "Pending" : "Gagal",
            items: [
              ...(trx.booking_items ? trx.booking_items.split(", ") : []),
              ...(trx.membership_items ? trx.membership_items.split(", ") : []),
              ...(trx.vo_items ? trx.vo_items.split(", ") : []),
              ...(trx.event_space_items ? trx.event_space_items.split(", ") : []), // ⬅️ tambahan baru
            ],
          }));

          setTransactions(mapped);
          setFilteredTransactions(mapped);
        }
      } catch (error) {
        console.error("Gagal ambil riwayat transaksi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🔹 Filter transaksi berdasarkan tanggal
  const handleFilter = (dates) => {
    if (!dates || dates.length === 0) {
      setFilteredTransactions(transactions);
      return;
    }
    const [start, end] = dates;
    const filtered = transactions.filter((trx) => {
      const trxDate = dayjs(trx.tanggal);
      return (
        trxDate.isAfter(start.subtract(1, "day")) &&
        trxDate.isBefore(end.add(1, "day"))
      );
    });
    setFilteredTransactions(filtered);
  };

  // 🔹 Menampilkan detail transaksi
  const showDetail = (transaction) => {
    setSelectedTransaction(transaction);
    setIsModalVisible(true);
  };

  // 🔹 Badge status
  const getStatusTag = (status) => {
    switch (status) {
      case "Sukses":
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Sukses
          </Tag>
        );
      case "Pending":
        return (
          <Tag icon={<LoadingOutlined />} color="processing">
            Pending
          </Tag>
        );
      case "Gagal":
        return (
          <Tag icon={<CloseCircleOutlined />} color="error">
            Gagal
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "80px" }}>
        <Spin size="large" />
        <p>Sedang memuat data transaksi...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Title level={3} style={{ margin: 0, textAlign: "center" }}>
          Riwayat Transaksi
        </Title>
        <Text type="secondary" style={{ display: "block", textAlign: "center" }}>
          Pantau semua riwayat pemesanan Anda di satu tempat.
        </Text>

        {/* Filter */}
        <Row gutter={[12, 12]} justify="start">
          <Col xs={24} sm={18} md={18}>
            <RangePicker
              onChange={handleFilter}
              style={{ width: "100%", borderRadius: "8px" }}
              placeholder={["Tanggal mulai", "Tanggal akhir"]}
            />
          </Col>
          <Col xs={24} sm={6} md={6}>
            <Button
              type="primary"
              ghost
              block
              icon={<CalendarOutlined />}
              style={{ borderRadius: "8px" }}
              onClick={() => handleFilter([])}
            >
              Reset
            </Button>
          </Col>
        </Row>

        {/* List transaksi */}
        {filteredTransactions.length === 0 ? (
          <Empty
            description={<span>Tidak ada transaksi pada periode ini.</span>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: "40px" }}
          />
        ) : (
          <List
            dataSource={filteredTransactions}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    icon={<FileTextOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      showDetail(item);
                    }}
                  >
                    Detail
                  </Button>,
                ]}
                style={{
                  border: "1px solid #f0f0f0",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "16px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  background: "#fff",
                }}
                onClick={() => showDetail(item)}
              >
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        backgroundColor: "#e6f7ff",
                        padding: "12px",
                        borderRadius: "50%",
                      }}
                    >
                      <FileTextOutlined style={{ color: "#1890ff" }} />
                    </div>
                  }
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text strong style={{ fontSize: "16px" }}>
                        {dayjs(item.tanggal).format("DD MMMM YYYY")}
                      </Text>
                      {getStatusTag(item.status)}
                    </div>
                  }
                  description={
                    <Space direction="vertical" size={4} style={{ marginTop: "8px" }}>
                      <Text type="secondary" style={{ fontSize: "14px" }}>
                        {item.items.join(", ")}
                      </Text>
                      <Text strong style={{ fontSize: "15px", color: "#1890ff" }}>
                        <DollarCircleOutlined style={{ marginRight: "4px" }} />
                        Total: Rp {item.total.toLocaleString("id-ID")}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Space>

      {/* Modal Detail Transaksi */}
      <Modal
        title="Detail Transaksi"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setIsModalVisible(false)}
            style={{ borderRadius: "8px" }}
          >
            Tutup
          </Button>,
        ]}
        width={480}
        centered
        bodyStyle={{
          padding: "24px",
          background: "#f9fafb",
          borderRadius: "10px",
        }}
      >
        {selectedTransaction && (
          <Card bordered={false} style={{ background: "transparent" }}>
            <Text strong>Tanggal:</Text>
            <Text style={{ float: "right" }}>
              {dayjs(selectedTransaction.tanggal).format("DD MMMM YYYY")}
            </Text>
            <Divider style={{ margin: "12px 0" }} />

            <Text strong>Total:</Text>
            <Text style={{ float: "right" }}>
              Rp {selectedTransaction.total.toLocaleString("id-ID")}
            </Text>
            <Divider style={{ margin: "12px 0" }} />

            <Text strong>Status:</Text>
            <span style={{ float: "right" }}>
              {getStatusTag(selectedTransaction.status)}
            </span>
            <Divider style={{ margin: "12px 0" }} />

            <Text strong>Item Transaksi:</Text>
            <List
              dataSource={selectedTransaction.items}
              renderItem={(item) => (
                <List.Item style={{ padding: "0", borderBottom: "none" }}>
                  {item}
                </List.Item>
              )}
              style={{ marginTop: "8px" }}
            />
          </Card>
        )}
      </Modal>
    </div>
  );
};

export default RiwayatTransaksi;
