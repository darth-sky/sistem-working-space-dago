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
import { getRiwayatTransaksi } from "../../../services/service";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Hook sederhana untuk deteksi ukuran layar
const useWindowSize = () => {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useEffect(() => {
    const handleResize = () => setSize([window.innerWidth, window.innerHeight]);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
};

const RiwayatTransaksi = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const [width] = useWindowSize();
  const isMobile = width < 768;

  // === PERUBAHAN 1: MAPPING DATA DARI API ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getRiwayatTransaksi();
        if (res?.data) {
          const mapped = res.data.map((trx) => {
            // Membuat array ringkasan untuk tampilan daftar utama
            const summaryItems = [
              ...(trx.bookings?.map(b => `Booking Ruangan - ${b.nama_ruangan}`) || []),
              ...(trx.memberships?.map(m => `Membership - ${m.nama_paket}`) || []),
              ...(trx.virtual_offices?.map(v => `Virtual Office - ${v.nama_paket}`) || []),
              ...(trx.events?.map(e => `Event - ${e.nama_event || e.nama_space}`) || []),
            ];

            return {
              id: trx.id_transaksi,
              tanggal: trx.tanggal_transaksi,
              total: trx.total_harga_final,
              status: trx.status_pembayaran === "Lunas" ? "Sukses" :
                trx.status_pembayaran === "Belum Lunas" ? "Pending" : "Gagal",

              // Menyimpan detail terstruktur untuk digunakan di dalam modal
              details: {
                bookings: trx.bookings || [],
                memberships: trx.memberships || [],
                virtual_offices: trx.virtual_offices || [],
                events: trx.events || [],
              },

              // Menyimpan ringkasan teks untuk tampilan daftar
              items: summaryItems,
            };
          });

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

  const handleFilter = (dates) => {
    if (!dates || dates.length === 0) {
      setFilteredTransactions(transactions);
      return;
    }
    const [start, end] = dates;
    const filtered = transactions.filter((trx) => {
      const trxDate = dayjs(trx.tanggal);
      return (
        trxDate.isAfter(start.startOf('day')) &&
        trxDate.isBefore(end.endOf('day'))
      );
    });
    setFilteredTransactions(filtered);
  };

  const showDetail = (transaction) => {
    setSelectedTransaction(transaction);
    setIsModalVisible(true);
  };

  const getStatusTag = (status) => {
    switch (status) {
      case "Sukses":
        return <Tag icon={<CheckCircleOutlined />} color="success">Sukses</Tag>;
      case "Pending":
        return <Tag icon={<LoadingOutlined />} color="processing">Pending</Tag>;
      case "Gagal":
        return <Tag icon={<CloseCircleOutlined />} color="error">Gagal</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <Spin size="large" />
        <p style={{ marginTop: '16px' }}>Sedang memuat data transaksi...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? "16px" : "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div style={{ textAlign: "center" }}>
          <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
            Riwayat Transaksi
          </Title>
          <Text type="secondary">
            Pantau semua riwayat pemesanan Anda di satu tempat.
          </Text>
        </div>

        <Row gutter={[12, 12]} justify="start" align="middle">
          <Col xs={24} sm={18}>
            <RangePicker
              onChange={handleFilter}
              style={{ width: "100%", borderRadius: "8px" }}
              placeholder={["Tanggal mulai", "Tanggal akhir"]}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Button
              block
              onClick={() => handleFilter([])}
              style={{ borderRadius: "8px" }}
            >
              Reset Filter
            </Button>
          </Col>
        </Row>

        {filteredTransactions.length === 0 ? (
          <Empty
            description={<span>Tidak ada transaksi pada periode ini.</span>}
            style={{ marginTop: "40px", background: '#fff', padding: '40px', borderRadius: '12px' }}
          />
        ) : (
          <List
            dataSource={filteredTransactions}
            renderItem={(item) => (
              <List.Item
                actions={[
                  !isMobile && (
                    <Button type="link" onClick={() => showDetail(item)}>Detail</Button>
                  )
                ]}
                style={{
                  border: "1px solid #f0f0f0",
                  borderRadius: "12px",
                  padding: isMobile ? "12px" : "16px",
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
                    <div style={{ backgroundColor: "#e6f7ff", padding: "12px", borderRadius: "50%" }}>
                      <FileTextOutlined style={{ color: "#1890ff", fontSize: '20px' }} />
                    </div>
                  }
                  title={
                    <div style={{
                      display: "flex",
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      justifyContent: "space-between",
                      gap: isMobile ? '8px' : '0'
                    }}>
                      <Text strong style={{ fontSize: "16px" }}>
                        {dayjs(item.tanggal).format("DD MMMM YYYY")}
                      </Text>
                      {getStatusTag(item.status)}
                    </div>
                  }
                  description={
                    <>
                      <Text
                        type="secondary"
                        ellipsis
                        style={{ fontSize: "14px", display: 'block', marginTop: '8px' }}
                      >
                        {item.items.join(", ")}
                      </Text>
                      <Text
                        strong
                        style={{ fontSize: "15px", color: "#1890ff", display: 'block', marginTop: '4px' }}
                      >
                        <DollarCircleOutlined style={{ marginRight: "4px" }} />
                        Total: Rp {item.total.toLocaleString("id-ID")}
                      </Text>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Space>

      {/* === PERUBAHAN 2: TAMPILAN MODAL YANG LEBIH DETAIL === */}
      <Modal
        title="Detail Transaksi"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsModalVisible(false)} style={{ borderRadius: "8px" }}>
            Tutup
          </Button>,
        ]}
        width={isMobile ? '95%' : 520}
        centered
        bodyStyle={{ padding: "24px", background: "#f9fafb", borderRadius: "10px" }}
      >
        {selectedTransaction && (
          <Card bordered={false} style={{ background: "transparent", padding: 0 }} bodyStyle={{ padding: 0 }}>
            <Row justify="space-between"><Col><Text strong>ID Transaksi:</Text></Col><Col><Text>#{selectedTransaction.id}</Text></Col></Row>
            <Divider style={{ margin: "12px 0" }} />
            <Row justify="space-between"><Col><Text strong>Tgl. Transaksi:</Text></Col><Col><Text>{dayjs(selectedTransaction.tanggal).utc().format("DD MMM YYYY, HH:mm")}</Text></Col></Row>
            <Divider style={{ margin: "12px 0" }} />
            <Row justify="space-between"><Col><Text strong>Total:</Text></Col><Col><Text>Rp {selectedTransaction.total.toLocaleString("id-ID")}</Text></Col></Row>
            <Divider style={{ margin: "12px 0" }} />
            <Row justify="space-between" align="middle"><Col><Text strong>Status:</Text></Col><Col>{getStatusTag(selectedTransaction.status)}</Col></Row>
            <Divider style={{ margin: "12px 0" }} />

            <Title level={5} style={{ marginBottom: "16px" }}>Detail Item</Title>

            {/* Bagian Booking Ruangan */}
            {selectedTransaction.details.bookings.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Booking Ruangan</Text>
                <List
                  itemLayout="horizontal"
                  dataSource={selectedTransaction.details.bookings}
                  renderItem={(item, index) => (
                    <List.Item style={{ padding: "8px", background: "#fff", borderRadius: "8px", borderBottom: index === selectedTransaction.details.bookings.length - 1 ? "none" : "1px solid #f0f0f0" }}>
                      <List.Item.Meta
                        title={<Text>{item.nama_ruangan}</Text>}
                        description={
                          <Text type="secondary">
                            <CalendarOutlined style={{ marginRight: '6px' }} />
                            {dayjs(item.waktu_mulai).format('DD MMM YYYY, HH:mm')} - {dayjs(item.waktu_selesai).format('HH:mm')}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* Bagian Membership */}
            {selectedTransaction.details.memberships.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Paket Membership</Text>
                <List
                  itemLayout="horizontal"
                  dataSource={selectedTransaction.details.memberships}
                  renderItem={(item, index) => (
                    <List.Item style={{ padding: "8px", background: "#fff", borderRadius: "8px", borderBottom: index === selectedTransaction.details.memberships.length - 1 ? "none" : "1px solid #f0f0f0" }}>
                      <List.Item.Meta
                        title={<Text>{item.nama_paket}</Text>}
                        description={
                          <Text type="secondary">
                            <CalendarOutlined style={{ marginRight: '6px' }} />
                            Aktif: {dayjs(item.tanggal_mulai).format('DD MMM YYYY')} - {dayjs(item.tanggal_berakhir).format('DD MMM YYYY')}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* Bagian Virtual Office */}
            {selectedTransaction.details.virtual_offices.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Paket Virtual Office</Text>
                <List
                  itemLayout="horizontal"
                  dataSource={selectedTransaction.details.virtual_offices}
                  renderItem={(item, index) => (
                    <List.Item style={{ padding: "8px", background: "#fff", borderRadius: "8px", borderBottom: index === selectedTransaction.details.virtual_offices.length - 1 ? "none" : "1px solid #f0f0f0" }}>
                      <List.Item.Meta
                        title={<Text>{item.nama_paket} ({item.nama_perusahaan})</Text>}
                        description={
                          <Text type="secondary">
                            <CalendarOutlined style={{ marginRight: '6px' }} />
                            Aktif: {dayjs(item.tanggal_mulai).format('DD MMM YYYY')} - {dayjs(item.tanggal_berakhir).format('DD MMM YYYY')}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* Bagian Event Spaces */}
            {/* Bagian Event Spaces */}
            {selectedTransaction.details.events.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Booking Event</Text>
                <List
                  itemLayout="horizontal"
                  dataSource={selectedTransaction.details.events}
                  renderItem={(item, index) => (
                    <List.Item style={{ padding: "8px", background: "#fff", borderRadius: "8px", borderBottom: index === selectedTransaction.details.events.length - 1 ? "none" : "1px solid #f0f0f0" }}>
                      <List.Item.Meta
                        title={<Text>{item.nama_event || "Booking Event"}</Text>}
                        description={
                          <Text type="secondary">
                            <CalendarOutlined style={{ marginRight: '6px' }} />
                            {/* --- PERUBAHAN DI SINI --- */}
                            {item.nama_space} | {dayjs(item.waktu_mulai).format('DD MMM YYYY, HH:mm')} - {dayjs(item.waktu_selesai).format('HH:mm')}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

          </Card>
        )}
      </Modal>
    </div>
  );
};

export default RiwayatTransaksi;