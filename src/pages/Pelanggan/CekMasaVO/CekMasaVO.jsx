import React, { useState, useEffect, useContext } from "react";
import { Card, Progress, Button, Typography, Row, Col, Space, List, Tag, Alert, Empty, Spin, Statistic, Divider } from "antd";
import { CalendarOutlined, ClockCircleOutlined, DashboardOutlined, UserOutlined, SendOutlined, InfoCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CrownOutlined, SafetyCertificateOutlined, HistoryOutlined } from "@ant-design/icons";
import { AuthContext } from "../../../providers/AuthProvider";
import { getVirtualOfficeDetail } from "../../../services/service";

const { Title, Text } = Typography;
const { Countdown } = Statistic;

const CekMasaVO = () => {
  const { userProfile } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.id_user) return;
    const fetchData = async () => {
      try {
        const result = await getVirtualOfficeDetail(userProfile.id_user);
        if (result.message === "OK") {
          setData(result.data);
        } else {
          setData(null);
        }
      } catch (err) {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userProfile]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Memuat data Virtual Office..." />
      </div>
    );
  }

  if (!data) {
    return (
      <Empty 
        description="Data Virtual Office tidak ditemukan" 
        imageStyle={{ height: 120 }}
        style={{ padding: '40px 0' }}
      >
        <Button type="primary">Daftar Virtual Office</Button>
      </Empty>
    );
  }

  // Format tanggal
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const today = new Date();
  const startDate = new Date(data.tanggal_mulai);
  const endDate = new Date(data.tanggal_berakhir);
  const isExpired = endDate < today;
  const totalDuration = endDate - startDate;
  const elapsedDuration = today - startDate;
  const progressPercentage = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
  
  // Hitung sisa hari
  const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

  return (
    <div style={{ padding: "24px", backgroundColor: "#f5f5f7", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Title level={2} style={{ color: "#1a1a1a", marginBottom: "8px" }}>
            <CrownOutlined style={{ marginRight: "12px", color: "#ffc53d" }} />
            Virtual Office Subscription
          </Title>
          <Text type="secondary" style={{ fontSize: "16px" }}>
            Pantau status dan masa aktif layanan Virtual Office Anda
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card 
              style={{ 
                borderRadius: "12px", 
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                border: isExpired ? "1px solid #ffccc7" : "1px solid #d9d9d9"
              }}
              bodyStyle={{ padding: "24px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <Title level={3} style={{ margin: 0, color: isExpired ? "#d9363e" : "#1a1a1a" }}>
                    {data.nama_paket}
                  </Title>
                  <Text type="secondary">Paket Virtual Office</Text>
                </div>
                <Tag 
                  color={isExpired ? "red" : "green"} 
                  style={{ 
                    borderRadius: "20px", 
                    padding: "4px 12px", 
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    fontSize: "12px"
                  }}
                >
                  {isExpired ? "Kedaluwarsa" : data.status_client_vo}
                </Tag>
              </div>

              <Divider style={{ margin: "16px 0" }} />

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: "12px" }}>
                    <Text strong>Tanggal Mulai</Text>
                    <div style={{ display: "flex", alignItems: "center", marginTop: "4px" }}>
                      <CalendarOutlined style={{ marginRight: "8px", color: "#1890ff" }} />
                      <Text>{formatDate(data.tanggal_mulai)}</Text>
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: "12px" }}>
                    <Text strong>Tanggal Berakhir</Text>
                    <div style={{ display: "flex", alignItems: "center", marginTop: "4px" }}>
                      <CalendarOutlined style={{ marginRight: "8px", color: "#1890ff" }} />
                      <Text>{formatDate(data.tanggal_berakhir)}</Text>
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: "12px" }}>
                    <Text strong>Harga Paket</Text>
                    <div style={{ display: "flex", alignItems: "center", marginTop: "4px" }}>
                      <DashboardOutlined style={{ marginRight: "8px", color: "#52c41a" }} />
                      <Text>Rp {new Intl.NumberFormat('id-ID').format(data.harga)}</Text>
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: "12px" }}>
                    <Text strong>Status Pembayaran</Text>
                    <div style={{ display: "flex", alignItems: "center", marginTop: "4px" }}>
                      <SafetyCertificateOutlined style={{ marginRight: "8px", color: "#faad14" }} />
                      <Text>Lunas</Text>
                    </div>
                  </div>
                </Col>
              </Row>

              {!isExpired && (
                <>
                  <Divider style={{ margin: "16px 0" }} />
                  
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <Text strong>Progress Masa Aktif</Text>
                      <Text>{Math.round(progressPercentage)}%</Text>
                    </div>
                    <Progress 
                      percent={Math.round(progressPercentage)} 
                      status={daysRemaining <= 7 ? "exception" : "active"}
                      strokeColor={daysRemaining <= 7 ? "#faad14" : "#52c41a"}
                      showInfo={false}
                    />
                  </div>

                  <div style={{ 
                    backgroundColor: daysRemaining <= 7 ? "#fffbe6" : "#f6ffed", 
                    padding: "12px 16px", 
                    borderRadius: "8px",
                    border: daysRemaining <= 7 ? "1px solid #ffe58f" : "1px solid #b7eb8f"
                  }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {daysRemaining <= 7 ? (
                        <ExclamationCircleOutlined style={{ color: "#faad14", fontSize: "18px", marginRight: "8px" }} />
                      ) : (
                        <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "18px", marginRight: "8px" }} />
                      )}
                      <Text>
                        {daysRemaining > 0 
                          ? `Sisa masa aktif: ${daysRemaining} hari` 
                          : "Masa aktif berakhir hari ini"}
                      </Text>
                    </div>
                  </div>
                </>
              )}
            </Card>

            {isExpired && (
              <Alert
                type="error"
                showIcon
                message="Langganan Virtual Office Telah Berakhir"
                description={`Langganan Anda berakhir pada ${formatDate(data.tanggal_berakhir)}. Silakan perpanjang untuk terus menikmati layanan.`}
                style={{ marginTop: "24px", borderRadius: "8px" }}
                action={
                  <Button size="small" type="primary">
                    Perpanjang Sekarang
                  </Button>
                }
              />
            )}
          </Col>

          <Col xs={24} lg={8}>
            <Card 
              title={
                <span>
                  <InfoCircleOutlined style={{ marginRight: "8px" }} />
                  Informasi
                </span>
              } 
              style={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            >
              <List
                size="small"
                dataSource={[
                  'Virtual Office dapat digunakan selama masa aktif',
                  'Notifikasi akan dikirim 7 hari sebelum berakhir',
                  'Perpanjangan dapat dilakukan maksimal H-7',
                  'Fasilitas akses meeting room sesuai paket'
                ]}
                renderItem={item => (
                  <List.Item>
                    <Text style={{ fontSize: '13px' }}>• {item}</Text>
                  </List.Item>
                )}
              />
            </Card>

            {!isExpired && (
              <Card 
                title={
                  <span>
                    <HistoryOutlined style={{ marginRight: "8px" }} />
                    Hitung Mundur
                  </span>
                } 
                style={{ marginTop: "16px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
              >
                <div style={{ textAlign: "center" }}>
                  <Countdown
                    title="Berakhir dalam"
                    value={endDate}
                    format="D [hari] H [jam] m [menit]"
                    valueStyle={{ fontSize: '16px', color: daysRemaining <= 7 ? '#faad14' : '#52c41a' }}
                  />
                </div>
              </Card>
            )}
          </Col>
        </Row>

        {!isExpired && (
          <Row gutter={[24, 24]} style={{ marginTop: "24px" }}>
            <Col span={24}>
              <Card 
                title="Aksi" 
                style={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
              >
                <Space>
                  <Button type="primary" icon={<SendOutlined />}>
                    Perpanjang Sekarang
                  </Button>
                  <Button icon={<UserOutlined />}>
                    Hubungi Support
                  </Button>
                  <Button>
                    Detail Penggunaan
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        )}
      </div>
    </div>
  );
};

export default CekMasaVO;