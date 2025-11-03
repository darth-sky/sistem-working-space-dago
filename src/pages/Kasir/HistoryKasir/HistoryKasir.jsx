// src/pages/Kasir/HistoryKasir/HistoryKasir.jsx
import React, { useState, useEffect } from 'react';
import { Table, Spin, Card, Input, Typography, Tag, message, Row, Col } from 'antd';
import { 
    SearchOutlined, 
    ClockCircleOutlined, 
    CheckCircleOutlined, 
    SyncOutlined, 
    CloseCircleOutlined 
} from '@ant-design/icons';
import { useAuth } from '../../../providers/AuthProvider'; // 1. Import useAuth
import { apiGetSessionHistory } from '../../../services/service'; // 2. Import service baru
import dayjs from 'dayjs';
import { formatRupiah } from '../../../utils/formatRupiah'; // Asumsi path ini benar

const { Title, Text } = Typography;

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
            return <Tag>{status}</Tag>;
    }
};

const HistoryKasir = () => {
    // 3. Dapatkan info sesi dari AuthProvider
    const { activeSession, isSessionLoading } = useAuth(); 
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    // 4. Modifikasi useEffect untuk fetch data berdasarkan sesi
    useEffect(() => {
        // Jangan fetch jika sesi masih loading
        if (isSessionLoading) {
            setLoading(true); // Tampilkan loading spinner
            return;
        }
        
        // Jika sesi sudah dicek dan TIDAK ADA sesi aktif
        if (!activeSession) {
            message.info("Tidak ada sesi kasir yang aktif.", 5);
            setLoading(false);
            setData([]); // Pastikan data kosong
            return;
        }

        // Jika ada sesi aktif, fetch history untuk sesi tsb
        const fetchDataForSession = async () => {
            setLoading(true);
            try {
                // Panggil service API baru
                const res = await apiGetSessionHistory(); 
                if (res.message === "OK") {
                    setData(res.transactions.map((item, index) => ({
                        key: item.id_transaksi || index,
                        ...item
                    })));
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
        
    }, [activeSession, isSessionLoading]); // 5. Jalankan ulang jika sesi (atau loading-nya) berubah

    // 6. Filter data secara lokal (pencarian)
    const filteredData = data.filter(item => {
        const customer = item.nama_pelanggan?.toLowerCase() || '';
        const fnb = item.fnb_items?.toLowerCase() || '';
        const rooms = item.room_items?.toLowerCase() || '';
        const search = searchText.toLowerCase();
        
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
                </div>
            )
        },
        {
            title: 'Metode Bayar',
            dataIndex: 'metode_pembayaran',
            key: 'metode_pembayaran',
            width: 150,
        },
        {
            title: 'Total',
            dataIndex: 'total_harga_final',
            key: 'total_harga_final',
            render: (text) => formatRupiah(text || 0),
            sorter: (a, b) => a.total_harga_final - b.total_harga_final,
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

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <Card className="shadow-lg rounded-lg">
                <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col>
                        <Title level={4}>Riwayat Transaksi Sesi Ini</Title>
                        <Text type="secondary">
                            Hanya menampilkan transaksi yang dibuat dalam sesi kasir Anda saat ini.
                        </Text>
                        {activeSession && (
                            <Text strong style={{ display: 'block', marginTop: 8 }}>
                                Sesi Aktif: {activeSession.nama_sesi || `ID ${activeSession.id_sesi}`}
                            </Text>
                        )}
                    </Col>
                    <Col style={{ minWidth: '300px' }}>
                        <Input
                            placeholder="Cari pelanggan atau item..."
                            prefix={<SearchOutlined />}
                            size="large"
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                    </Col>
                </Row>

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