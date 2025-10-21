import React, { useState, useEffect, useContext, useCallback } from "react";
import {
    Card, Progress, Button, Typography, Row, Col, Space, List, Tag,
    Alert, Empty, Spin, Statistic, Divider, Grid, message, Modal, Image // Tambahkan Image
} from "antd";
import {
    CrownOutlined, SafetyCertificateOutlined, HistoryOutlined, CalendarOutlined,
    InfoCircleOutlined, SendOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
    BankOutlined, QrcodeOutlined, CloseCircleOutlined // Tambahkan CloseCircleOutlined
} from "@ant-design/icons";
import { AuthContext } from "../../../providers/AuthProvider";
import { getVirtualOfficeDetail, submitVOPaymentProof } from "../../../services/service"; // Pastikan path import benar
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { Countdown } = Statistic;
const { useBreakpoint } = Grid;

// --- Komponen Modal Pembayaran dengan QR ---
const PaymentInfoModal = ({ visible, onClose, transactionId, harga, onPaymentSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const res = await submitVOPaymentProof(transactionId);
            if (res.message === "OK") {
                message.success("Konfirmasi berhasil! Layanan Anda kini aktif. 🎉");
                onPaymentSuccess(); // Menutup modal dan me-refresh data
            } else {
                message.error(res.error || "Gagal mengkonfirmasi pembayaran.");
            }
        } catch (error) {
            message.error(error.message || "Terjadi kesalahan server.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            title="Instruksi Pembayaran Virtual Office"
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="back" onClick={onClose} disabled={isSubmitting}>
                    Tutup
                </Button>,
                <Button key="submit" type="primary" loading={isSubmitting} onClick={handleSubmit}>
                    Saya Sudah Bayar & Aktifkan
                </Button>,
            ]}
            maskClosable={!isSubmitting}
            closable={!isSubmitting}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Paragraph>
                    Silakan lakukan pembayaran sejumlah <Text strong style={{ color: '#d46b08', fontSize: 16 }}>Rp {new Intl.NumberFormat('id-ID').format(harga)}</Text> menggunakan salah satu metode di bawah ini:
                </Paragraph>

                {/* Opsi 1: QRIS */}
                <Card size="small">
                    <Space align="center">
                         <QrcodeOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                         <Text strong>Scan QRIS</Text>
                    </Space>
                    <Divider style={{margin: '12px 0'}} />
                    <div style={{ textAlign: 'center' }}>
                        {/* --- GANTI DENGAN PATH QR CODE ANDA --- */}
                        <Image
                            width={200}
                            // Ganti src dengan URL atau path ke gambar QRIS Anda di folder public
                            src="../../../../public/img/WhatsApp Image 2025-10-08 at 09.02.45.jpeg"
                            alt="Kode QRIS Pembayaran"
                            preview={false}
                            fallback="/images/image-error.png" // Gambar placeholder jika error
                        />
                        <Paragraph type="secondary" style={{ marginTop: '8px', fontSize: '12px' }}>
                            Scan menggunakan aplikasi E-Wallet atau Mobile Banking Anda yang mendukung QRIS.
                        </Paragraph>
                    </div>
                </Card>

                <Alert
                    message="Penting"
                    description="Setelah melakukan pembayaran, klik tombol 'Saya Sudah Bayar & Aktifkan' di bawah untuk mengaktifkan layanan Anda secara otomatis."
                    type="warning"
                    showIcon
                />
            </Space>
        </Modal>
    );
};


// --- Komponen Utama CekMasaVO ---
const CekMasaVO = () => {
    const { userProfile } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isActivating, setIsActivating] = useState(false); // Untuk tombol aktivasi di modal
    const [error, setError] = useState(null);
    const [isPaymentInfoModalOpen, setIsPaymentInfoModalOpen] = useState(false);
    const navigate = useNavigate();
    const screens = useBreakpoint();

    const fetchData = useCallback(async () => {
        if (!userProfile?.id_user) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const result = await getVirtualOfficeDetail(userProfile.id_user);
            if (result.message === "OK") {
                setData(result.data);
                setError(null);
            } else {
                // Backend return error (misal 404)
                setError(result.error || "Data langganan tidak ditemukan.");
                setData(null);
            }
        } catch (err) {
            // Error dari fetch (network, 500, atau parse error)
             if (err.message && (err.message.includes("404") || err.message.toLowerCase().includes("tidak ditemukan"))) {
                setError("Anda belum memiliki langganan Virtual Office.");
            } else {
                setError(err.message || "Terjadi kesalahan saat memuat data.");
            }
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [userProfile]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePerpanjang = () => {
        if (data?.id_paket_vo) {
            navigate(`/virtual-office/paket/${data.id_paket_vo}`);
        } else {
            navigate('/virtual-office');
        }
    };

    const handleShowPaymentInfo = () => {
        if (data && data.id_transaksi) {
            setIsPaymentInfoModalOpen(true);
        } else {
            message.error("ID Transaksi tidak ditemukan, hubungi admin.");
        }
    };

    const containerStyle = {
        padding: screens.xs ? "16px" : "24px",
        backgroundColor: "#f5f5f7",
        minHeight: "100vh",
    };

    const titleStyle = {
        fontSize: screens.xs ? "24px" : "30px",
        color: "#1a1a1a",
        marginBottom: "8px",
    };

    // ===== Render Logic =====

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><Spin size="large" tip="Memuat status langganan..." /></div>;
    }

    // 1. Error atau tidak ada data
    if (error || !data) {
        return (
            <div style={containerStyle}>
                <Empty
                    description={
                        error ? `Gagal memuat data: ${error}` : "Anda belum memiliki langganan Virtual Office."
                    }
                    style={{ padding: '40px 0' }}
                >
                    <Button type="primary" onClick={() => navigate('/virtual-office')}>Lihat Paket & Daftar</Button>
                </Empty>
            </div>
        );
    }

    // 2. Menunggu Persetujuan Admin
    if (data.status_client_vo === 'Menunggu Persetujuan') {
        return (
            <div style={containerStyle}>
                <Card style={{ maxWidth: 800, margin: "24px auto", textAlign: "center", padding: "16px" }}>
                    <Spin tip="Menunggu persetujuan..." />
                    <Title level={4} style={{ marginTop: 16 }}>Langganan Anda Sedang Ditinjau</Title>
                    <Text type="secondary">Permintaan Anda untuk paket "{data.nama_paket}" sedang menunggu persetujuan dari admin. Mohon tunggu sebentar ya.</Text>
                </Card>
            </div>
        );
    }

    // 3. Pendaftaran ditolak
    if (data.status_client_vo === 'Ditolak') {
        return (
            <div style={containerStyle}>
                <Card style={{ maxWidth: 800, margin: "24px auto", textAlign: "center" }}>
                    <CloseCircleOutlined style={{ fontSize: 48, color: '#cf1322', marginBottom: 16 }} />
                    <Title level={4} style={{ color: '#cf1322' }}>Permintaan Ditolak</Title>
                    <Text type="secondary">Maaf, permintaan Anda untuk paket "{data.nama_paket}" tidak dapat kami setujui saat ini. Silakan hubungi admin untuk informasi lebih lanjut atau coba daftar kembali.</Text>
                    <Divider />
                    <Button type="primary" onClick={() => navigate('/virtual-office')}>Lihat Paket Lain</Button>
                </Card>
            </div>
        );
    }

    // 4. Menunggu Pembayaran
    if (data.status_client_vo === 'Menunggu Pembayaran') {
        return (
            <div style={containerStyle}>
                <Card style={{ maxWidth: 800, margin: "24px auto" }}>
                    <Alert
                        type="success"
                        showIcon
                        message={<Title level={4} style={{ margin: 0 }}>Pendaftaran Disetujui!</Title>}
                        description={
                            <div>
                                <Text>Permintaan Anda untuk paket <Text strong>"{data.nama_paket}"</Text> telah disetujui. Silakan selesaikan pembayaran untuk mengaktifkan layanan.</Text>
                                <Divider style={{ margin: "16px 0" }} />
                                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                                    <Col xs={24} sm={12}>
                                        <Text strong>Total Tagihan:</Text>
                                        <Title level={5} style={{ margin: 0 }}>Rp {new Intl.NumberFormat('id-ID').format(data.harga)}</Title>
                                    </Col>
                                    <Col xs={24} sm={12} style={{ textAlign: screens.xs ? 'center' : 'right' }}>
                                        <Button
                                            type="primary"
                                            size="large"
                                            onClick={handleShowPaymentInfo}
                                            block={screens.xs}
                                            icon={<BankOutlined />}
                                        >
                                            Lihat Instruksi Pembayaran
                                        </Button>
                                    </Col>
                                </Row>
                            </div>
                        }
                    />
                </Card>

                <PaymentInfoModal
                    visible={isPaymentInfoModalOpen}
                    onClose={() => setIsPaymentInfoModalOpen(false)}
                    transactionId={data.id_transaksi}
                    harga={data.harga}
                    onPaymentSuccess={() => {
                        setIsPaymentInfoModalOpen(false);
                        fetchData(); // Refresh data setelah aktivasi
                    }}
                />
            </div>
        );
    }

    // --- 5. Kasus: Langganan Aktif atau Kadaluarsa ---
    // Pastikan tanggal_mulai dan tanggal_berakhir ada
    if (!data.tanggal_mulai || !data.tanggal_berakhir) {
         return (
             <div style={containerStyle}>
                 <Alert
                    message="Data Tidak Lengkap"
                    description="Tanggal mulai atau berakhir langganan tidak valid. Hubungi admin."
                    type="warning"
                    showIcon
                 />
             </div>
         );
    }

    const formatDate = (dateString) => dayjs(dateString).format("DD MMMM YYYY");
    const today = dayjs();
    const endDate = dayjs(data.tanggal_berakhir);
    const startDate = dayjs(data.tanggal_mulai);
    const isExpired = endDate.isBefore(today, 'day') || data.status_client_vo === 'Kadaluarsa'; // Cek 'day' agar hari terakhir masih aktif

    const totalDuration = endDate.diff(startDate, 'day');
    const elapsedDuration = Math.max(0, today.diff(startDate, 'day')); // Pastikan tidak negatif
    const progressPercentage = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100)) : (isExpired ? 100 : 0);
    const daysRemaining = isExpired ? 0 : Math.max(0, endDate.diff(today, 'day'));

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
                                    {isExpired ? "Kedaluwarsa" : "Aktif"}
                                </Tag>
                            </div>
                            <Divider style={{ margin: "16px 0" }} />
                            <Row gutter={[16, 24]}>
                                <Col xs={24} sm={12}><Space direction="vertical" size={0}><Text strong><CalendarOutlined /> Tanggal Mulai</Text><Text>{formatDate(data.tanggal_mulai)}</Text></Space></Col>
                                <Col xs={24} sm={12}><Space direction="vertical" size={0}><Text strong><CalendarOutlined /> Tanggal Berakhir</Text><Text>{formatDate(data.tanggal_berakhir)}</Text></Space></Col>
                                <Col xs={24} sm={12}><Space direction="vertical" size={0}><Text strong>Harga Paket</Text><Text>Rp {new Intl.NumberFormat('id-ID').format(data.harga)}</Text></Space></Col>
                                <Col xs={24} sm={12}>
                                    <Space direction="vertical" size={0}>
                                        <Text strong><SafetyCertificateOutlined /> Status Pembayaran</Text>
                                        {/* Ambil status pembayaran dari data transaksi jika ada */}
                                        <Tag color={data.status_pembayaran === 'Lunas' ? 'success' : 'warning'}>
                                            {data.status_pembayaran || 'Lunas'} {/* Default ke Lunas jika aktif */}
                                        </Tag>
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
                                type="warning"
                                showIcon
                                message="Langganan Virtual Office Telah Berakhir"
                                description={`Langganan Anda berakhir pada ${formatDate(data.tanggal_berakhir)}. Silakan perpanjang untuk terus menikmati layanan.`}
                                style={{ marginTop: "24px", borderRadius: "8px" }}
                                action={
                                    <Button size="small" type="primary" onClick={handlePerpanjang}>
                                        Perpanjang Sekarang
                                    </Button>
                                }
                            />
                        )}
                    </Col>

                    <Col xs={24} md={8}>
                        {/* Tampilkan info benefit jika ada */}
                        {(data.benefit_jam_meeting_room_per_bulan > 0 || data.benefit_jam_working_space_per_bulan > 0) && (
                            <Card title={<Space><InfoCircleOutlined /> Benefit Paket Anda</Space>} style={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                                <List size="small">
                                    {data.benefit_jam_meeting_room_per_bulan > 0 && (
                                        <List.Item style={{ border: 'none', padding: '4px 0' }}>• {data.benefit_jam_meeting_room_per_bulan} Jam Meeting Room / Bulan</List.Item>
                                    )}
                                    {data.benefit_jam_working_space_per_bulan > 0 && (
                                        <List.Item style={{ border: 'none', padding: '4px 0' }}>• {data.benefit_jam_working_space_per_bulan} Jam Working Space / Bulan</List.Item>
                                    )}
                                </List>
                            </Card>
                        )}
                        <Card title={<Space><InfoCircleOutlined /> Informasi Umum</Space>} style={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                            <List size="small"
                                dataSource={[
                                    'Benefit hanya bisa digunakan jika status Aktif.',
                                    'Notifikasi akan dikirim 7 hari sebelum masa aktif berakhir.',
                                    'Perpanjangan dapat dilakukan kapan saja melalui tombol di bawah.'
                                ]}
                                renderItem={item => <List.Item style={{ border: 'none', padding: '4px 0' }}><Text style={{ fontSize: '13px' }}>• {item}</Text></List.Item>}
                            />
                        </Card>
                        {!isExpired && (
                            <Card title={<Space><HistoryOutlined /> Hitung Mundur</Space>} style={{ marginTop: "16px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                                <div style={{ textAlign: "center" }}>
                                    <Countdown title="Berakhir dalam" value={endDate.valueOf()} format="D [hari] H [jam] m [menit]" valueStyle={{ color: daysRemaining <= 7 ? '#faad14' : '#52c41a' }} />
                                </div>
                            </Card>
                        )}
                    </Col>
                </Row>

                {/* Riwayat Pemakaian Benefit */}
                <Row style={{ marginTop: "24px" }}>
                    <Col span={24}>
                        <Card title={<Space><HistoryOutlined /> Riwayat Pemakaian Benefit</Space>} style={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                            {data && data.riwayat_pemakaian && data.riwayat_pemakaian.length > 0 ? (
                                <List
                                    itemLayout="horizontal"
                                    dataSource={data.riwayat_pemakaian}
                                    renderItem={(item, index) => ( // Tambahkan index untuk key
                                        <List.Item key={index}> {/* Tambahkan key */}
                                            <List.Item.Meta
                                                avatar={<div style={{ backgroundColor: '#e6f7ff', borderRadius: '50%', padding: '10px', display: 'flex' }}><CheckCircleOutlined style={{ color: '#1890ff', fontSize: '20px' }} /></div>}
                                                title={<Text strong>Penggunaan {item.jenis_benefit === 'meeting_room' ? 'Meeting Room' : 'Working Space'}</Text>}
                                                description={
                                                    <>
                                                        <Text>{item.nama_ruangan} - Durasi: {item.durasi_terpakai_menit} menit</Text>
                                                        <br />
                                                        <Text type="secondary">{dayjs(item.tanggal_penggunaan).format("DD MMMM YYYY, HH:mm")}</Text>
                                                    </>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Empty description={<Text type="secondary">Belum ada riwayat pemakaian benefit tercatat.</Text>} />
                            )}
                        </Card>
                    </Col>
                </Row>

                {/* Tombol Aksi Cepat (Perpanjang/Daftar Baru) */}
                {(data.status_client_vo === 'Aktif' || data.status_client_vo === 'Kadaluarsa') && (
                    <Row style={{ marginTop: "24px" }}>
                        <Col span={24}>
                            <Card title="Aksi Cepat" style={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                                <Space direction={screens.xs ? "vertical" : "horizontal"} style={{ width: screens.xs ? '100%' : 'auto' }}>
                                    <Button type="primary" icon={<SendOutlined />} onClick={handlePerpanjang} block={screens.xs}>
                                        {isExpired ? 'Daftar Paket Baru' : 'Perpanjang Langganan'}
                                    </Button>
                                </Space>
                                {isExpired && <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>Masa aktif telah berakhir. Klik tombol untuk mendaftar paket baru.</Text>}
                            </Card>
                        </Col>
                    </Row>
                )}
            </div>
        </div>
    );
};

export default CekMasaVO;