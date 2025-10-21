import React, { useState, useEffect } from "react";
import {
    Table, Button, Modal, Input, Typography, Row, Col, Card, Space,
    Select, message, Popconfirm, Tooltip, Upload, InputNumber, Switch,
    Tag, List, Divider, Image
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import {
    getRuangan, createRuangan, updateRuangan, deleteRuangan, getKategoriRuangan,
    getPaketHargaByRuangan, addPaketHarga, deletePaketHarga, updatePaketHarga
} from "../../../../services/service";

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Definisikan base URL untuk gambar di satu tempat agar mudah diubah

// State awal untuk form, memastikan reset form selalu konsisten
const initialFormData = {
    nama_ruangan: "",
    id_kategori_ruangan: null,
    harga_per_jam: 0,
    kapasitas: 1,
    deskripsi_ruangan: "",
    fitur_ruangan: "",
    status_ketersediaan: "Active",
};

const RuanganTab = () => {
    const [data, setData] = useState([]);
    const [kategoriRuanganList, setKategoriRuanganList] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingRuangan, setEditingRuangan] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [fileGambar, setFileGambar] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [pageSize, setPageSize] = useState(5);



    // State untuk paket harga di dalam modal
    const [paketHargaList, setPaketHargaList] = useState([]);
    const [newPaket, setNewPaket] = useState({ durasi_jam: "", harga_paket: "" });
    const [editingPaket, setEditingPaket] = useState(null); // Untuk menyimpan data paket yg diedit

    const handleEditPaket = (paket) => {
        // Set paket yang akan diedit
        setEditingPaket(paket);
        // Isi form dengan data dari paket yang dipilih
        setNewPaket({ durasi_jam: paket.durasi_jam, harga_paket: paket.harga_paket });
    };

    const handleCancelEditPaket = () => {
        // Reset state ke kondisi awal
        setEditingPaket(null);
        setNewPaket({ durasi_jam: "", harga_paket: "" });
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Ambil data ruangan dan kategori secara paralel untuk efisiensi
            const [resRuangan, resKategori] = await Promise.all([getRuangan(), getKategoriRuangan()]);

            if (resRuangan.status === 200) {
                const ruanganData = resRuangan.data.datas.map((item) => ({ ...item, key: item.id_ruangan }));
                setData(ruanganData);
            }
            if (resKategori.status === 200) {
                setKategoriRuanganList(resKategori.data.datas);
            }
        } catch (err) {
            console.error("Gagal fetch data:", err);
            message.error("Gagal mengambil data dari server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchPaketHarga = async (id_ruangan) => {
        try {
            const res = await getPaketHargaByRuangan(id_ruangan);
            setPaketHargaList(res.data.datas || []);
        } catch (error) {
            message.error("Gagal mengambil data paket harga");
        }
    };

    const handleOpenModal = (ruangan = null) => {
        if (ruangan) { // Mode Edit
            setEditingRuangan(ruangan);
            setFormData(ruangan);
            fetchPaketHarga(ruangan.id_ruangan);
        } else { // Mode Tambah Baru
            setEditingRuangan(null);
            setFormData(initialFormData);
        }
        setOpen(true);
    };

    const handleCancel = () => {
        setOpen(false);
        setEditingRuangan(null);
        setFormData(initialFormData);
        setFileGambar(null);
        setPaketHargaList([]);
        setNewPaket({ durasi_jam: "", harga_paket: "" });
    };

    const handleChange = (field, value) => setFormData({ ...formData, [field]: value });

    const handleAddOrUpdateRuangan = async () => {
        const formPayload = new FormData();
        // Append semua data dari state formData ke payload
        for (const key in formData) {
            if (formData[key] !== null) { // Pastikan tidak mengirim nilai null
                formPayload.append(key, formData[key]);
            }
        }
        if (fileGambar) {
            formPayload.append("gambar_ruangan", fileGambar);
        }

        setLoading(true);
        try {
            if (editingRuangan) {
                await updateRuangan(editingRuangan.id_ruangan, formPayload);
                message.success("Ruangan berhasil diperbarui!");
            } else {
                await createRuangan(formPayload);
                message.success("Ruangan baru berhasil ditambahkan!");
            }
            fetchData();
            handleCancel();
        } catch (err) {
            message.error("Gagal menyimpan data. Pastikan semua field wajib terisi.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id_ruangan) => {
        try {
            await deleteRuangan(id_ruangan);
            message.success("Ruangan berhasil dihapus!");
            fetchData();
        } catch (error) {
            message.error("Gagal menghapus ruangan");
        }
    };

    // --- LOGIKA PAKET HARGA ---
    const handleSavePaket = async () => {
        if (!newPaket.durasi_jam || !newPaket.harga_paket) {
            return message.warning("Durasi dan Harga paket harus diisi.");
        }

        try {
            if (editingPaket) {
                // --- MODE UPDATE ---
                await updatePaketHarga(editingPaket.id_paket, {
                    durasi_jam: newPaket.durasi_jam,
                    harga_paket: newPaket.harga_paket,
                });
                message.success("Paket berhasil diperbarui!");
            } else {
                // --- MODE TAMBAH BARU ---
                await addPaketHarga({ ...newPaket, id_ruangan: editingRuangan.id_ruangan });
                message.success("Paket baru ditambahkan!");
            }

            // Refresh daftar paket dan reset form
            fetchPaketHarga(editingRuangan.id_ruangan);
            handleCancelEditPaket(); // Gunakan fungsi cancel edit yang baru
        } catch (error) {
            message.error(editingPaket ? "Gagal memperbarui paket." : "Gagal menambah paket.");
        }
    };

    const handleDeletePaket = async (id_paket) => {
        try {
            await deletePaketHarga(id_paket);
            message.success("Paket berhasil dihapus!");
            fetchPaketHarga(editingRuangan.id_ruangan);
        } catch (error) {
            message.error("Gagal menghapus paket.");
        }
    };

    const filteredData = data.filter(item =>
        item.nama_ruangan.toLowerCase().includes(searchText.toLowerCase()) ||
        item.nama_kategori.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: "Gambar",
            dataIndex: "gambar_ruangan",
            key: "gambar_ruangan",
            width: 100,
            render: (gambar) => (
                <Image
                    width={60}
                    src={gambar ? `${import.meta.env.VITE_BASE_URL}/static/${gambar}` : "https://via.placeholder.com/150?text=No+Image"}
                    fallback="https://via.placeholder.com/150?text=Error"
                    style={{ borderRadius: "4px", objectFit: "cover" }}
                />
            ),
        },
        { title: "Nama Ruangan", dataIndex: "nama_ruangan", key: "nama_ruangan", render: (text) => <Text strong>{text}</Text> },
        { title: "Kategori", dataIndex: "nama_kategori", key: "nama_kategori" },
        { title: "Kapasitas", dataIndex: "kapasitas", key: "kapasitas", render: (kap) => `${kap} org` },
        {
            title: "Harga per Jam",
            dataIndex: "harga_per_jam",
            key: "harga_per_jam",
            render: (harga) => harga > 0 ? `Rp ${harga.toLocaleString('id-ID')}` : <Tag>Gratis</Tag>
        },
        {
            title: "Status",
            dataIndex: "status_ketersediaan",
            key: "status_ketersediaan",
            render: (status) => <Tag color={status === "Active" ? "green" : "red"}>{status}</Tag>,
        },
        {
            title: "Actions",
            key: "actions",
            width: 120,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit Ruangan & Paket"><Button type="link" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} /></Tooltip>
                    <Popconfirm title="Yakin hapus ruangan ini?" onConfirm={() => handleDelete(record.id_ruangan)} okText="Ya, Hapus" cancelText="Batal">
                        <Button type="link" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: "24px" }}>
            <Row gutter={[16, 16]} justify="space-between" style={{ marginBottom: 24 }}>
                <Col flex="1"><Input.Search placeholder="Cari nama atau kategori ruangan..." size="large" onChange={(e) => setSearchText(e.target.value)} allowClear /></Col>
                <Col flex="none"><Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()} size="large">Tambah Ruangan Baru</Button></Col>
            </Row>

            <Card style={{ borderRadius: "12px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    pagination={{
                        pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ["5", "10", "20", "50", "100"],
                        // ✅ TAMBAHKAN BARIS INI
                        onShowSizeChange: (current, size) => setPageSize(size),
                    }}
                    loading={loading}
                    scroll={{ x: 800 }}
                />
            </Card>

            <Modal
                title={<Title level={4}>{editingRuangan ? "Edit Ruangan" : "Tambah Ruangan Baru"}</Title>}
                open={open}
                onCancel={handleCancel}
                width={850}
                destroyOnClose // Membersihkan state internal komponen saat modal ditutup
                footer={[
                    <Button key="back" onClick={handleCancel}>Batal</Button>,
                    <Button key="submit" type="primary" loading={loading} onClick={handleAddOrUpdateRuangan}>Simpan</Button>,
                ]}
            >
                <Row gutter={24}>
                    {/* KOLOM KIRI: FORM DATA UTAMA */}
                    <Col span={12}>
                        <Divider>Informasi Ruangan</Divider>
                        <Text strong>Nama Ruangan *</Text>
                        <Input placeholder="Cth: Ruang Meeting Merapi" value={formData.nama_ruangan} onChange={(e) => handleChange("nama_ruangan", e.target.value)} style={{ marginBottom: 16 }} />

                        <Text strong>Kategori *</Text>
                        <Select placeholder="Pilih kategori" value={formData.id_kategori_ruangan} onChange={(val) => handleChange("id_kategori_ruangan", val)} style={{ width: "100%", marginBottom: 16 }}>
                            {kategoriRuanganList.map((k) => <Option key={k.id_kategori_ruangan} value={k.id_kategori_ruangan}>{k.nama_kategori}</Option>)}
                        </Select>

                        <Text strong>Kapasitas (Orang) *</Text>
                        <InputNumber min={1} value={formData.kapasitas} onChange={(val) => handleChange("kapasitas", val)} style={{ width: "100%", marginBottom: 16 }} />

                        <Text strong>Start From</Text>
                        <InputNumber prefix="Rp " value={formData.harga_per_jam} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v.replace(/\$\s?|(,*)/g, '')} onChange={(val) => handleChange("harga_per_jam", val)} style={{ width: "100%", marginBottom: 16 }} />

                        <Text strong>Deskripsi</Text>
                        <TextArea rows={3} placeholder="Jelaskan tentang ruangan ini" value={formData.deskripsi_ruangan} onChange={(e) => handleChange("deskripsi_ruangan", e.target.value)} style={{ marginBottom: 16 }} />

                        <Text strong>Fitur Ruangan</Text>
                        <TextArea rows={3} placeholder="Cth: Free Wifi, Proyektor, Papan Tulis" value={formData.fitur_ruangan} onChange={(e) => handleChange("fitur_ruangan", e.target.value)} style={{ marginBottom: 16 }} />

                        <Space align="center" style={{ marginBottom: 16 }}>
                            <Text strong>Status Ketersediaan:</Text>
                            <Switch checkedChildren="Active" unCheckedChildren="Inactive" checked={formData.status_ketersediaan === "Active"} onChange={(checked) => handleChange("status_ketersediaan", checked ? "Active" : "Inactive")} />
                        </Space>


                    </Col>

                    {/* KOLOM KANAN: KELOLA PAKET HARGA */}
                    <Col span={12}>
                        <Divider>Kelola Paket Harga</Divider>
                        {editingRuangan ? (
                            <>
                                <List
                                    size="small" bordered dataSource={paketHargaList}
                                    renderItem={(item) => (
                                        <List.Item actions={[
                                            <Tooltip title="Edit Paket">
                                                <Button type="link" icon={<EditOutlined />} onClick={() => handleEditPaket(item)} />
                                            </Tooltip>,
                                            <Popconfirm title="Yakin hapus paket ini?" onConfirm={() => handleDeletePaket(item.id_paket)} okText="Ya" cancelText="Tidak">
                                                <Button type="link" danger icon={<DeleteOutlined />} />
                                            </Popconfirm>
                                        ]}>
                                            <List.Item.Meta title={`${item.durasi_jam} Jam`} description={`Rp ${item.harga_paket.toLocaleString('id-ID')}`} />
                                        </List.Item>
                                    )}
                                    style={{ marginBottom: 16, maxHeight: 250, overflowY: 'auto' }}
                                />
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Space.Compact style={{ width: '100%' }}>
                                        <InputNumber placeholder="Jam" min={1} value={newPaket.durasi_jam} onChange={(val) => setNewPaket({ ...newPaket, durasi_jam: val })} style={{ width: '35%' }} />
                                        <InputNumber placeholder="Harga Paket" min={0} value={newPaket.harga_paket} onChange={(val) => setNewPaket({ ...newPaket, harga_paket: val })} style={{ width: '45%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v.replace(/\$\s?|(,*)/g, '')} />
                                        <Button type="primary" onClick={handleSavePaket} style={{ width: '20%' }}>
                                            {editingPaket ? 'Update' : 'Add'}
                                        </Button>
                                    </Space.Compact>

                                    {/* Tombol Batal hanya muncul saat mode edit */}
                                    {editingPaket && (
                                        <Button onClick={handleCancelEditPaket} style={{ width: '100%' }}>
                                            Batal Edit
                                        </Button>
                                    )}
                                </Space>
                            </>
                        ) : (
                            <Text type="secondary">Simpan data ruangan terlebih dahulu untuk bisa menambahkan paket harga.</Text>
                        )}
                        {/* --- PERBAIKAN: BLOK UPLOAD GAMBAR DENGAN TEKS DI ATAS DAN BAWAH --- */}
                        <Divider>Gambar Ruangan</Divider>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>

                            <Upload
                                listType="picture"
                                maxCount={1}
                                beforeUpload={(file) => { setFileGambar(file); return false; }}
                                onRemove={() => setFileGambar(null)}
                                style={{ marginBottom: 8 }}
                            >
                                <Button icon={<UploadOutlined />}>Pilih Gambar</Button>
                            </Upload>
                        </div>
                    </Col>
                </Row>
            </Modal>
        </div>
    );
};

export default RuanganTab;