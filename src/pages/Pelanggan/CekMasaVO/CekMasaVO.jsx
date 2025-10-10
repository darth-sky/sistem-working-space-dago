import React, { useState, useEffect, useContext } from "react";
import { Card, Progress, Button, Typography, Row, Col, Space, List, Tag, Alert, Empty, Spin, Statistic, Divider, Grid } from "antd";
import { CrownOutlined, SafetyCertificateOutlined, HistoryOutlined, CalendarOutlined, InfoCircleOutlined, SendOutlined, UserOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { AuthContext } from "../../../providers/AuthProvider";
import { getVirtualOfficeDetail } from "../../../services/service";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { Countdown } = Statistic;
const { useBreakpoint } = Grid; // ✅ Import hook untuk mendeteksi ukuran layar

const CekMasaVO = () => {
    const { userProfile } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const screens = useBreakpoint(); // ✅ Gunakan hook di sini

    useEffect(() => {
        if (!userProfile?.id_user) return;
        const fetchData = async () => {
            try {
                const result = await getVirtualOfficeDetail(userProfile.id_user);
                setData(result.message === "OK" ? result.data : null);
            } catch (err) {
                setData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userProfile]);
    
    const handlePerpanjang = () => {
        if (data?.id_paket_vo) {
            navigate(`/detail-paket/${data.id_paket_vo}`);
        }
    };
    
    // ✅ Gaya dinamis berdasarkan ukuran layar
    const containerStyle = {
        padding: screens.xs ? "16px" : "24px", // Padding lebih kecil di mobile
        backgroundColor: "#f5f5f7",
        minHeight: "100vh",
    };

    const titleStyle = {
        fontSize: screens.xs ? "24px" : "30px", // Font lebih kecil di mobile
        color: "#1a1a1a",
        marginBottom: "8px",
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><Spin size="large" tip="Memuat data..." /></div>;
    }

    if (!data) {
        return <Empty description="Data Virtual Office tidak ditemukan" style={{ padding: '40px 0' }}><Button type="primary">Daftar Sekarang</Button></Empty>;
    }

    // Kalkulasi
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
    const today = new Date();
    const startDate = new Date(data.tanggal_mulai);
    const endDate = new Date(data.tanggal_berakhir);
    const isExpired = endDate < today;
    const totalDuration = endDate - startDate;
    const elapsedDuration = today - startDate;
    const progressPercentage = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    return (
        <div style={containerStyle}>
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <Title level={2} style={titleStyle}>
                        <CrownOutlined style={{ marginRight: "12px", color: "#ffc53d" }} />
                        Virtual Office Subscription
                    </Title>
                    <Text type="secondary" style={{ fontSize: "16px" }}>Pantau status dan masa aktif layanan Anda</Text>
                </div>

                <Row gutter={[24, 24]}>
                    {/* ✅ Ganti `lg` menjadi `md` agar layout 2 kolom aktif lebih cepat di tablet */}
                    <Col xs={24} md={16}>
                        <Card
                            style={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: isExpired ? "1px solid #ffccc7" : "1px solid #d9d9d9" }}
                            bodyStyle={{ padding: "24px" }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                                <div>
                                    <Title level={3} style={{ margin: 0, color: isExpired ? "#d9363e" : "#1a1a1a" }}>{data.nama_paket}</Title>
                                    <Text type="secondary">Paket Virtual Office</Text>
                                </div>
                                <Tag color={isExpired ? "red" : "green"} style={{ borderRadius: "20px", padding: "4px 12px", fontWeight: "bold", textTransform: "uppercase", fontSize: "12px" }}>
                                    {isExpired ? "Kedaluwarsa" : data.status_client_vo}
                                </Tag>
                            </div>

                            <Divider style={{ margin: "16px 0" }} />

                            {/* ✅ Grid internal ini sudah responsif (sm={12}) */}
                            <Row gutter={[16, 24]}>
                                <Col xs={24} sm={12}>
                                    <Space direction="vertical" size={0}>
                                        <Text strong><CalendarOutlined /> Tanggal Mulai</Text>
                                        <Text>{formatDate(data.tanggal_mulai)}</Text>
                                    </Space>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Space direction="vertical" size={0}>
                                        <Text strong><CalendarOutlined /> Tanggal Berakhir</Text>
                                        <Text>{formatDate(data.tanggal_berakhir)}</Text>
                                    </Space>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Space direction="vertical" size={0}>
                                        <Text strong>Harga Paket</Text>
                                        <Text>Rp {new Intl.NumberFormat('id-ID').format(data.harga)}</Text>
                                    </Space>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Space direction="vertical" size={0}>
                                        <Text strong><SafetyCertificateOutlined /> Status Pembayaran</Text>
                                        <Text>Lunas</Text>
                                    </Space>
                                </Col>
                            </Row>

                            {!isExpired && (
                                <>
                                    <Divider style={{ margin: "24px 0 16px" }} />
                                    <div style={{ marginBottom: "16px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><Text strong>Progress Masa Aktif</Text><Text>{Math.round(progressPercentage)}%</Text></div>
                                        <Progress percent={Math.round(progressPercentage)} status={daysRemaining <= 7 ? "exception" : "active"} strokeColor={daysRemaining <= 7 ? "#faad14" : "#52c41a"} showInfo={false} />
                                    </div>
                                    <div style={{ backgroundColor: daysRemaining <= 7 ? "#fffbe6" : "#f6ffed", padding: "12px 16px", borderRadius: "8px", border: daysRemaining <= 7 ? "1px solid #ffe58f" : "1px solid #b7eb8f" }}>
                                        <Space>
                                            {daysRemaining <= 7 ? <ExclamationCircleOutlined style={{ color: "#faad14", fontSize: "18px" }} /> : <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "18px" }} />}
                                            <Text>{daysRemaining > 0 ? `Sisa masa aktif: ${daysRemaining} hari` : "Masa aktif berakhir hari ini"}</Text>
                                        </Space>
                                    </div>
                                </>
                            )}
                        </Card>

                        {isExpired && (
                            <Alert
                                type="error" showIcon
                                message="Langganan Virtual Office Telah Berakhir"
                                description={`Langganan Anda berakhir pada ${formatDate(data.tanggal_berakhir)}. Silakan perpanjang untuk terus menikmati layanan.`}
                                style={{ marginTop: "24px", borderRadius: "8px" }}
                                action={<Button size="small" type="primary" onClick={handlePerpanjang}>Perpanjang Sekarang</Button>}
                            />
                        )}
                    </Col>

                    <Col xs={24} md={8}>
                        <Card title={<Space><InfoCircleOutlined /> Informasi</Space>} style={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                            <List
                                size="small"
                                dataSource={['Dapat digunakan selama masa aktif', 'Notifikasi dikirim 7 hari sebelum berakhir', 'Perpanjangan dapat dilakukan kapan saja', 'Fasilitas meeting room sesuai paket']}
                                renderItem={item => <List.Item style={{ border: 'none', padding: '4px 0' }}><Text style={{ fontSize: '13px' }}>• {item}</Text></List.Item>}
                            />
                        </Card>

                        {!isExpired && (
                            <Card title={<Space><HistoryOutlined /> Hitung Mundur</Space>} style={{ marginTop: "16px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                                <div style={{ textAlign: "center" }}>
                                    <Countdown title="Berakhir dalam" value={endDate} format="D [hari] H [jam] m [menit]" valueStyle={{ color: daysRemaining <= 7 ? '#faad14' : '#52c41a' }} />
                                </div>
                            </Card>
                        )}
                    </Col>
                </Row>

                {!isExpired && (
                    <Row style={{ marginTop: "24px" }}>
                        <Col span={24}>
                            <Card title="Aksi Cepat" style={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                                {/* ✅ Tombol Aksi dibuat responsif */}
                                <Space direction={screens.xs ? "vertical" : "horizontal"} style={{ width: screens.xs ? '100%' : 'auto' }}>
                                    <Button type="primary" icon={<SendOutlined />} onClick={handlePerpanjang} block={screens.xs}>Perpanjang Sekarang</Button>
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