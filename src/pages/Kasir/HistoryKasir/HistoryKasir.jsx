// src/pages/Kasir/HistoryKasir/HistoryKasir.jsx
import React, { useState, useEffect } from 'react';
// --- PERUBAHAN 1: Import Statistic dan ikon ---
import { Table, Spin, Card, Input, Typography, Tag, message, Row, Col, Statistic } from 'antd';
import { 
    SearchOutlined, 
    ClockCircleOutlined, 
    CheckCircleOutlined, 
    SyncOutlined, 
    CloseCircleOutlined,
    WalletOutlined, // <-- Ikon baru
    DollarCircleOutlined // <-- Ikon baru
} from '@ant-design/icons';
// --- AKHIR PERUBAHAN 1 ---
import { useAuth } from '../../../providers/AuthProvider';
import { apiGetSessionHistory } from '../../../services/service';
import dayjs from 'dayjs';
import { formatRupiah } from '../../../utils/formatRupiah'; 

const { Title, Text } = Typography;

// --- KODE YANG SEBELUMNYA HILANG ---
// Fungsi untuk tag status order
const getStatusTag = (status) => {
    switch (status) {
        case 'Baru':
            return <Tag icon={<ClockCircleOutlined />} color="blue">Baru</Tag>;
        case 'Diproses':
            return <Tag icon={<SyncOutlined spin />} color="processing">Diproses</Tag>;
        case 'Selesai':
            return <Tag icon={<CheckCircleOutlined />} color="success">Selesai</Tag>;
        case 'Batal':
            return <Tag icon={<CloseCircleOutlined />} color="error">Batal</Tag>;
        default:
            return <Tag>{status || 'N/A'}</Tag>; // Fallback jika status null
    }
};
// --- AKHIR KODE YANG HILANG ---

const HistoryKasir = () => {
    const { activeSession, isSessionLoading } = useAuth(); 
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    // --- PERUBAHAN 2: State baru untuk Saldo ---
    const [openBalance, setOpenBalance] = useState(0);
    const [currentBalance, setCurrentBalance] = useState(0);
    // --- AKHIR PERUBAHAN 2 ---

    useEffect(() => {
        if (isSessionLoading) {
            setLoading(true); 
            return;
        }
        
        if (!activeSession) {
            message.info("Tidak ada sesi kasir yang aktif.", 5);
            setLoading(false);
            setData([]); 
            // --- Reset saldo jika tidak ada sesi ---
            setOpenBalance(0);
            setCurrentBalance(0);
            // ---
            return;
        }

        const fetchDataForSession = async () => {
            setLoading(true);
            try {
                const res = await apiGetSessionHistory(); 
                if (res.message === "OK") {
                    // --- PERUBAHAN 3: Ambil data transaksi DAN saldo ---
                    setData(res.transactions.map((item, index) => ({
                        key: item.id_transaksi || index,
                        ...item
                    })));
                    setOpenBalance(res.open_balance || 0);
                    setCurrentBalance(res.current_balance || 0);
                    // --- AKHIR PERUBAHAN 3 ---
                } else {
                    message.error(res.error || "Gagal mengambil data riwayat sesi");
                }
            } catch (err) {
                console.error("Error fetching session history:", err);
                message.error(err.message || "Gagal terhubung ke server");
            } finally {
                setLoading(false);
            }
        };

        fetchDataForSession();
        
    }, [activeSession, isSessionLoading]); 

    // --- KODE YANG SEBELUMNYA HILANG ---
    // (filteredData dan columns tetap sama)
    const filteredData = data.filter(item => {
        const customer = item.nama_pelanggan?.toLowerCase() || '';
        const fnb = item.fnb_items?.toLowerCase() || '';
        const rooms = item.room_items?.toLowerCase() || '';
        const search = searchText.toLowerCase(); // <-- Teks dari kotak pencarian

        // Hanya tampilkan jika salah satu dari ini mengandung teks pencarian
        return customer.includes(search) || fnb.includes(search) || rooms.includes(search);
    });
    
    const columns = [
        {
            title: 'Waktu',
            dataIndex: 'tanggal_transaksi',
            key: 'tanggal_transaksi',
            render: (text) => dayjs(text).format('HH:mm:ss'), // Tampilkan jam, menit, detik
            sorter: (a, b) => dayjs(a.tanggal_transaksi).unix() - dayjs(b.tanggal_transaksi).unix(),
            width: 120,
        },
        {
            title: 'Pelanggan',
            dataIndex: 'nama_pelanggan',
            key: 'nama_pelanggan',
        },
        {
            title: 'Detail Pesanan',
            key: 'details',
            // Lebar kolom ini dibuat lebih besar
            width: 300, 
            render: (_, record) => (
                <div>
                    {record.fnb_items && record.fnb_items !== '-' && (
                        <Text type="secondary" style={{ display: 'block', maxWidth: 300 }} ellipsis={{ tooltip: record.fnb_items }}>
                            FnB: {record.fnb_items}
                        </Text>
                    )}
                    {record.room_items && record.room_items !== '-' && (
                        <Text type="secondary" style={{ display: 'block' }}>
                            Ruangan: {record.room_items}
                        </Text>
                    )}
                    {/* Fallback jika keduanya null atau '-' */}
                    {(!record.fnb_items || record.fnb_items === '-') && (!record.room_items || record.room_items === '-') && (
                        <Text type="secondary" italic>-</Text>
                    )}
                </div>
            )
        },
        {
            title: 'Metode Bayar',
            dataIndex: 'metode_pembayaran',
            key: 'metode_pembayaran',
            render: (text) => text || 'N/A', // Fallback jika null
            width: 150,
        },
        {
            title: 'Total',
            dataIndex: 'total_harga_final',
            key: 'total_harga_final',
            render: (text) => formatRupiah(text || 0),
            sorter: (a, b) => (a.total_harga_final || 0) - (b.total_harga_final || 0),
            width: 160,
        },
        {
            title: 'Status Order',
            dataIndex: 'status_order',
            key: 'status_order',
            render: (status) => getStatusTag(status),
            width: 130,
        },
    ];
    // --- AKHIR KODE YANG HILANG ---

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <Card className="shadow-lg rounded-lg">
                {/* --- PERUBAHAN 4: Modifikasi Layout Header --- */}
                <Row justify="space-between" align="top" gutter={[16, 24]} style={{ marginBottom: 24 }}>
                    {/* Kolom Judul dan Search */}
                    <Col xs={24} lg={14}>
                        <Title level={4}>Riwayat Transaksi Sesi Ini</Title>
                        <Text type="secondary">
                            Hanya menampilkan transaksi yang dibuat dalam sesi kasir Anda saat ini.
                        </Text>
                        {activeSession && (
                            <Text strong style={{ display: 'block', marginTop: 8 }}>
                                Sesi Aktif: {activeSession.nama_sesi || `ID ${activeSession.id_sesi}`}
                            </Text>
                        )}
                        <Input
                            placeholder="Cari pelanggan atau item..."
                            prefix={<SearchOutlined />}
                            size="large"
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            style={{ marginTop: 16, maxWidth: '400px' }}
                        />
                    </Col>
                    
                    {/* Kolom Saldo */}
                    <Col xs={24} lg={10}>
                        <Row gutter={[16, 16]}>
                            <Col xs={12}>
                                <Card bordered={false} style={{ backgroundColor: '#f0f9ff' }} bodyStyle={{ padding: '16px' }}>
                                    <Statistic
                                        title="Open Balance"
                                        value={openBalance}
                                        precision={0}
                                        formatter={(val) => formatRupiah(val)}
                                        prefix={<WalletOutlined />}
                                        valueStyle={{ color: '#0369a1', fontSize: '1.25rem' }}
                                        loading={loading}
                                    />
                                </Card>
                            </Col>
                            <Col xs={12}>
                                <Card bordered={false} style={{ backgroundColor: '#f0fdf4' }} bodyStyle={{ padding: '16px' }}>
                                    <Statistic
                                        title="Current Balance (Cash)"
                                        value={currentBalance}
                                        precision={0}
                                        formatter={(val) => formatRupiah(val)}
                                        prefix={<DollarCircleOutlined />}
                                        valueStyle={{ color: '#16a34a', fontSize: '1.25rem' }}
                                        loading={loading}
                                    />
                                </Card>
                            </Col>
                        </Row>
                        <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                            *Current Balance = Open Balance + Total Tunai (Cash) Sesi Ini.
                        </Text>
                    </Col>
                </Row>
                {/* --- AKHIR PERUBAHAN 4 --- */}

                <Spin spinning={loading}>
                    <Table
                        columns={columns}
                        dataSource={filteredData}
                        rowKey="key"
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        scroll={{ x: 'max-content' }}
                    />
                </Spin>
            </Card>
        </div>
    );
};

export default HistoryKasir;