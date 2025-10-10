import React, { useState, useEffect } from "react";
import {
    Table,
    Button,
    Modal,
    Input,
    Typography,
    Row,
    Col,
    Card,
    Space,
    message,
    Popconfirm,
    Tooltip,
    InputNumber,
    Select,
    Tag,        // ✅ PERUBAHAN: Import komponen Tag
    Switch      // ✅ PERUBAHAN: Import komponen Switch
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    CreditCardOutlined,
    TagOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";

// ASUMSI: Import service sudah benar
import {
    getPaketMembership,
    createPaketMembership,
    updatePaketMembership,
    deletePaketMembership,
    getKategoriRuangan,
} from "../../../../services/service"; // Ganti dengan path service yang benar

const { Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

const PaketMembershipTab = () => {
    const [open, setOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [formData, setFormData] = useState({ status_paket: 'Active' }); // ✅ PERUBAHAN: Set default status
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [pageSize, setPageSize] = useState(5);
    const [kategoriRuanganList, setKategoriRuanganList] = useState([]);

    const getKategoriName = (id) => {
        const kategori = kategoriRuanganList.find(k => k.id_kategori_ruangan === id);
        return kategori ? kategori.nama_kategori : `ID: ${id} (Tidak Dikenal)`;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const resKategori = await getKategoriRuangan();
            if (resKategori.status === 200) {
                setKategoriRuanganList(resKategori.data.datas);
            }

            const resPaket = await getPaketMembership();
            if (resPaket.status === 200) {
                const paket = resPaket.data.datas.map((item, index) => ({
                    key: index + 1,
                    id_paket_membership: item.id_paket_membership,
                    id_kategori_ruangan: item.id_kategori_ruangan,
                    nama_paket: item.nama_paket,
                    harga: item.harga,
                    durasi: item.durasi,
                    kuota: item.kuota,
                    deskripsi_benefit: item.deskripsi_benefit,
                    fitur_membership: item.fitur_membership,
                    status_paket: item.status_paket, // ✅ PERUBAHAN: Ambil status_paket dari API
                }));
                setData(paket);
            }
        } catch (err) {
            console.error("Gagal fetch data:", err);
            message.error("Gagal mengambil data dari server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = data.filter(
        (item) =>
            item.nama_paket.toLowerCase().includes(searchText.toLowerCase()) ||
            (item.deskripsi_benefit &&
                item.deskripsi_benefit.toLowerCase().includes(searchText.toLowerCase()))
    );

    const columns = [
        {
            title: "ID",
            dataIndex: "id_paket_membership",
            key: "id_paket_membership",
            width: 60,
            responsive: ['md'],
        },
        {
            title: "Nama Paket",
            dataIndex: "nama_paket",
            key: "nama_paket",
        },
        // ✅ PERUBAHAN: Menambahkan Kolom Status
        {
            title: "Status",
            dataIndex: "status_paket",
            key: "status_paket",
            width: 100,
            align: 'center',
            render: (status) => (
                <Tag color={status === 'Active' ? 'green' : 'volcano'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Kategori Ruangan",
            dataIndex: "id_kategori_ruangan",
            key: "id_kategori_ruangan",
            render: (id) => getKategoriName(id),
        },
        {
            title: "Harga (Rp)",
            dataIndex: "harga",
            key: "harga",
            align: "right",
            render: (text) => new Intl.NumberFormat("id-ID").format(text),
        },
        {
            title: "Durasi (Hari)",
            dataIndex: "durasi",
            key: "durasi",
            align: "center",
            responsive: ['md'],
        },
        {
            title: "Kuota",
            dataIndex: "kuota",
            key: "kuota",
            align: "center",
            responsive: ['md'],
        },
        {
            title: "Actions",
            key: "actions",
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit Paket">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete Paket">
                        <Popconfirm
                            title="Hapus Paket Permanen"
                            description="Yakin ingin menghapus paket ini? Tindakan ini tidak bisa dibatalkan."
                            onConfirm={() => handleDelete(record.id_paket_membership)}
                            okText="Ya, Hapus"
                            cancelText="Batal"
                        >
                            <Button type="link" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSave = async () => {
        // ✅ PERUBAHAN: Menambahkan validasi untuk status_paket
        if (!formData.nama_paket || !formData.harga || !formData.kuota || !formData.id_kategori_ruangan || !formData.durasi || !formData.status_paket) {
            message.error("Semua field bertanda * dan status wajib diisi!");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                id_kategori_ruangan: formData.id_kategori_ruangan,
                nama_paket: formData.nama_paket,
                harga: formData.harga,
                durasi: formData.durasi,
                kuota: formData.kuota,
                deskripsi_benefit: formData.deskripsi_benefit || null,
                fitur_membership: formData.fitur_membership || null,
                status_paket: formData.status_paket, // ✅ PERUBAHAN: Kirim status_paket ke API
            };

            let res;
            if (editingPackage) {
                res = await updatePaketMembership(editingPackage.id_paket_membership, payload);
                if (res.status === 200) {
                    message.success("Paket berhasil diperbarui!");
                }
            } else {
                res = await createPaketMembership(payload);
                if (res.status === 201) {
                    message.success("Paket baru berhasil ditambahkan!");
                }
            }

            if (res.status === 200 || res.status === 201) {
                await fetchData();
                handleCancel();
            } else {
                const errorMessage = res.data.detail || res.data.error || "Gagal menyimpan paket";
                message.error(`Gagal menyimpan: ${errorMessage}`);
            }
        } catch (err) {
            console.error("Error save paket:", err);
            message.error(`Gagal menyimpan. Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id_paket) => {
        setLoading(true);
        try {
            const res = await deletePaketMembership(id_paket);
            if (res.status === 200) {
                message.success("Paket berhasil dihapus permanen!");
                await fetchData();
            } else {
                // Menangani error dari backend, misal foreign key constraint
                const errorMessage = res.data.error || "Gagal menghapus paket";
                message.error(errorMessage);
            }
        } catch (err) {
            console.error("Error delete paket:", err);
            message.error("Gagal menghapus paket.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (membershipPackage) => {
        setEditingPackage(membershipPackage);
        setFormData({
            id_kategori_ruangan: membershipPackage.id_kategori_ruangan,
            nama_paket: membershipPackage.nama_paket,
            harga: membershipPackage.harga,
            durasi: membershipPackage.durasi,
            kuota: membershipPackage.kuota,
            deskripsi_benefit: membershipPackage.deskripsi_benefit,
            fitur_membership: membershipPackage.fitur_membership,
            status_paket: membershipPackage.status_paket, // ✅ PERUBAHAN: Set status saat edit
        });
        setOpen(true);
    };

    const handleCancel = () => {
        setOpen(false);
        setEditingPackage(null);
        setFormData({ status_paket: 'Active' }); // ✅ PERUBAHAN: Reset form ke default
    };
    
    // ✅ PERUBAHAN: Handler untuk komponen Switch
    const handleStatusChange = (checked) => {
        handleChange("status_paket", checked ? 'Active' : 'Inactive');
    };

    return (
        <div style={{ padding: "24px" }}>
            <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
                <Col xs={24} md={12}>
                    <Search
                        placeholder="Cari paket membership..."
                        allowClear
                        onSearch={setSearchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </Col>
                <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => { setOpen(true); setEditingPackage(null); setFormData({ status_paket: 'Active' }); }}
                    >
                        Tambah Paket Baru
                    </Button>
                </Col>
            </Row>

            <Card>
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    pagination={{
                        pageSize: pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ["5", "10", "50"],
                        onShowSizeChange: (current, size) => setPageSize(size),
                    }}
                    loading={loading}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            <Modal
                title={editingPackage ? "Edit Paket Membership" : "Tambah Paket Membership"}
                open={open}
                onCancel={handleCancel}
                onOk={handleSave}
                confirmLoading={loading}
                okText={editingPackage ? "Update" : "Simpan"}
                cancelText="Batal"
                bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
            >
                {/* ✅ PERUBAHAN: Menambahkan Form Item untuk Status */}
                <div style={{ marginTop: '16px' }}>
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Text strong>Status Paket</Text>
                        </Col>
                        <Col>
                            <Switch
                                checkedChildren="Active"
                                unCheckedChildren="Inactive"
                                checked={formData.status_paket === 'Active'}
                                onChange={handleStatusChange}
                            />
                        </Col>
                    </Row>
                </div>
                
                <div style={{ marginTop: '16px' }}>
                    <Text strong>Nama Paket <span style={{ color: "red" }}>*</span></Text>
                    <Input
                        placeholder="Contoh: Basic Open Space"
                        value={formData.nama_paket || ""}
                        onChange={(e) => handleChange("nama_paket", e.target.value)}
                        style={{ marginTop: '8px' }}
                    />
                </div>

                <div style={{ marginTop: '16px' }}>
                    <Text strong>Kategori Ruangan <span style={{ color: "red" }}>*</span></Text>
                    <Select
                        style={{ width: '100%', marginTop: '8px' }}
                        placeholder="Pilih Kategori Ruangan"
                        value={formData.id_kategori_ruangan || undefined}
                        onChange={(value) => handleChange("id_kategori_ruangan", value)}
                    >
                        {kategoriRuanganList.map(kategori => (
                            <Select.Option key={kategori.id_kategori_ruangan} value={kategori.id_kategori_ruangan}>
                                {kategori.nama_kategori}
                            </Select.Option>
                        ))}
                    </Select>
                </div>

                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <div style={{ marginTop: '16px' }}>
                            <Text strong>Durasi (Hari) <span style={{ color: "red" }}>*</span></Text>
                            <InputNumber
                                style={{ width: '100%', marginTop: '8px' }}
                                placeholder="Contoh: 30"
                                min={1}
                                value={formData.durasi}
                                onChange={(value) => handleChange("durasi", value)}
                            />
                        </div>
                    </Col>
                    <Col xs={24} md={12}>
                        <div style={{ marginTop: '16px' }}>
                            <Text strong>Kuota/Kredit <span style={{ color: "red" }}>*</span></Text>
                            <InputNumber
                                style={{ width: '100%', marginTop: '8px' }}
                                placeholder="Jumlah kredit"
                                min={0}
                                value={formData.kuota}
                                onChange={(value) => handleChange("kuota", value)}
                            />
                        </div>
                    </Col>
                </Row>

                <div style={{ marginTop: '16px' }}>
                    <Text strong>Harga (Rp) <span style={{ color: "red" }}>*</span></Text>
                    <InputNumber
                        style={{ width: '100%', marginTop: '8px' }}
                        placeholder="Contoh: 500000"
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                        min={0}
                        value={formData.harga}
                        onChange={(value) => handleChange("harga", value)}
                    />
                </div>

                <div style={{ marginTop: '16px' }}>
                    <Text strong>Deskripsi Benefit</Text>
                    <TextArea
                        rows={3}
                        placeholder="Penjelasan benefit (opsional)"
                        value={formData.deskripsi_benefit || ""}
                        onChange={(e) => handleChange("deskripsi_benefit", e.target.value)}
                        style={{ marginTop: '8px' }}
                    />
                </div>

                <div style={{ marginTop: '16px' }}>
                    <Text strong>Fitur Membership</Text>
                    <TextArea
                        rows={2}
                        placeholder="Fitur tambahan (opsional)"
                        value={formData.fitur_membership || ""}
                        onChange={(e) => handleChange("fitur_membership", e.target.value)}
                        style={{ marginTop: '8px' }}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default PaketMembershipTab;