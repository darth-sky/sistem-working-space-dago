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
    Tag,
    Switch,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import {
    getPaketMembership,
    createPaketMembership,
    updatePaketMembership,
    deletePaketMembership,
    getKategoriRuangan,
} from "../../../../services/service";

const { Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

const PaketMembershipTab = () => {
    const [open, setOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [formData, setFormData] = useState({ status_paket: "Active" });
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [pageSize, setPageSize] = useState(5);
    const [kategoriRuanganList, setKategoriRuanganList] = useState([]);

    // --- TAMBAHAN: State untuk validasi ---
    const [validationErrors, setValidationErrors] = useState({});

    const getKategoriName = (id) => {
        const kategori = kategoriRuanganList.find(
            (k) => k.id_kategori_ruangan === id
        );
        return kategori ? kategori.nama_kategori : `ID: ${id}`;
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
                    // --- PERBAIKAN: Gunakan ID asli untuk key ---
                    key: item.id_paket_membership || index + 1, 
                    id_paket_membership: item.id_paket_membership,
                    id_kategori_ruangan: item.id_kategori_ruangan,
                    nama_paket: item.nama_paket,
                    harga: item.harga,
                    durasi: item.durasi,
                    kuota: item.kuota,
                    deskripsi_benefit: item.deskripsi_benefit,
                    fitur_membership: item.fitur_membership,
                    status_paket: item.status_paket,
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

    // Data hasil pencarian global
    const filteredData = data.filter(
        (item) =>
            item.nama_paket.toLowerCase().includes(searchText.toLowerCase()) ||
            (item.deskripsi_benefit &&
                item.deskripsi_benefit
                    .toLowerCase()
                    .includes(searchText.toLowerCase()))
    );

    // Ambil filter unik dari data
    const kategoriFilters = kategoriRuanganList.map((k) => ({
        text: k.nama_kategori,
        value: k.id_kategori_ruangan,
    }));
    const statusFilters = [
        { text: "Active", value: "Active" },
        { text: "Inactive", value: "Inactive" },
    ];
    const durasiFilters = [
        ...new Set(data.map((d) => d.durasi)),
    ].map((d) => ({ text: `${d} Hari`, value: d }));
    const kuotaFilters = [
        ...new Set(data.map((d) => d.kuota)),
    ].map((d) => ({ text: `${d}`, value: d }));

    const columns = [
        {
            title: "ID",
            dataIndex: "id_paket_membership",
            key: "id_paket_membership",
            width: 70,
            sorter: (a, b) => a.id_paket_membership - b.id_paket_membership,
        },
        {
            title: "Nama Paket",
            dataIndex: "nama_paket",
            key: "nama_paket",
            sorter: (a, b) => a.nama_paket.localeCompare(b.nama_paket),
        },
        {
            title: "Status",
            dataIndex: "status_paket",
            key: "status_paket",
            width: 100,
            align: "center",
            filters: statusFilters,
            onFilter: (value, record) => record.status_paket === value,
            render: (status) => (
                <Tag color={status === "Active" ? "green" : "volcano"}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Kategori Ruangan",
            dataIndex: "id_kategori_ruangan",
            key: "id_kategori_ruangan",
            filters: kategoriFilters,
            onFilter: (value, record) =>
                record.id_kategori_ruangan === value,
            render: (id) => getKategoriName(id),
        },
        {
            title: "Harga (Rp)",
            dataIndex: "harga",
            key: "harga",
            align: "right",
            sorter: (a, b) => a.harga - b.harga,
            render: (text) =>
                new Intl.NumberFormat("id-ID").format(text),
        },
        {
            title: "Durasi (Hari)",
            dataIndex: "durasi",
            key: "durasi",
            align: "center",
            filters: durasiFilters,
            onFilter: (value, record) => record.durasi === value,
            sorter: (a, b) => a.durasi - b.durasi,
        },
        {
            title: "Kuota",
            dataIndex: "kuota",
            key: "kuota",
            align: "center",
            filters: kuotaFilters,
            onFilter: (value, record) => record.kuota === value,
            sorter: (a, b) => a.kuota - b.kuota,
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
                    <Tooltip title="Hapus Paket">
                        <Popconfirm
                            title="Hapus Paket Permanen"
                            description="Yakin ingin menghapus paket ini? Tindakan ini tidak bisa dibatalkan."
                            onConfirm={() =>
                                handleDelete(record.id_paket_membership)
                            }
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
        // --- PERBAIKAN: Hapus error spesifik saat user mulai mengisi ---
        if (validationErrors[field]) {
            setValidationErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSave = async () => {
        // --- PERBAIKAN: Validasi Penuh ---
        const errors = {};
        if (!formData.nama_paket || formData.nama_paket.trim() === "") errors.nama_paket = true;
        if (!formData.id_kategori_ruangan) errors.id_kategori_ruangan = true;
        if (formData.durasi === null || formData.durasi === undefined || formData.durasi <= 0) errors.durasi = true;
        if (formData.kuota === null || formData.kuota === undefined || formData.kuota < 0) errors.kuota = true;
        if (formData.harga === null || formData.harga === undefined || formData.harga < 0) errors.harga = true;
        // status_paket selalu memiliki nilai

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            message.warning("Harap isi semua bidang yang wajib diisi (ditandai *).");
            return;
        }
        setValidationErrors({}); // Lolos validasi, bersihkan error
        // --- AKHIR PERBAIKAN VALIDASI ---

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
                status_paket: formData.status_paket,
            };

            let res;
            if (editingPackage) {
                res = await updatePaketMembership(
                    editingPackage.id_paket_membership,
                    payload
                );
                if (res.status === 200) message.success("Paket berhasil diperbarui!");
            } else {
                res = await createPaketMembership(payload);
                if (res.status === 201) message.success("Paket baru berhasil ditambahkan!");
            }

            if (res.status === 200 || res.status === 201) {
                await fetchData();
                handleCancel();
            } else {
                // Tampilkan error dari server jika ada
                message.error(res.data?.error || "Gagal menyimpan paket!");
            }
        } catch (err) {
            console.error("Error save paket:", err);
            const errorMsg = err.response?.data?.error || `Gagal menyimpan. Error: ${err.message}`;
            message.error(errorMsg);
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
                message.error(res.data?.error || "Gagal menghapus paket");
            }
        } catch (err) {
            console.error("Error delete paket:", err);
            const errorMsg = err.response?.data?.error || "Gagal menghapus paket.";
            message.error(errorMsg);
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
            status_paket: membershipPackage.status_paket,
        });
        setValidationErrors({}); // <-- PERBAIKAN: Bersihkan error
        setOpen(true);
    };

    const handleCancel = () => {
        setOpen(false);
        setEditingPackage(null);
        setFormData({ status_paket: "Active" });
        setValidationErrors({}); // <-- PERBAIKAN: Bersihkan error
    };

    // --- PERBAIKAN: Pisahkan handler untuk tombol "Tambah Paket Baru" ---
    const handleAddClick = () => {
        setEditingPackage(null);
        setFormData({ status_paket: "Active" });
        setValidationErrors({}); // <-- PERBAIKAN: Bersihkan error
        setOpen(true);
    };

    const handleStatusChange = (checked) => {
        handleChange("status_paket", checked ? "Active" : "Inactive");
    };

    return (
        <div style={{ padding: "24px" }}>
            <Row
                gutter={[16, 16]}
                align="middle"
                justify="space-between"
                style={{ marginBottom: 24 }}
            >
                <Col xs={24} md={12}>
                    <Search
                        placeholder="Cari paket membership..."
                        allowClear
                        onSearch={setSearchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        prefix={<SearchOutlined />}
                        size="large" // <-- PERBAIKAN: Buat search bar lebih besar
                    />
                </Col>
                <Col xs={24} md={12} style={{ textAlign: "right" }}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddClick} // <-- PERBAIKAN: Gunakan handler baru
                        size="large" // <-- PERBAIKAN: Buat tombol lebih besar
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
                    scroll={{ x: "max-content" }}
                    rowKey="key" // <-- PERBAIKAN: Gunakan key unik
                />
            </Card>

            {/* MODAL FORM */}
            <Modal
                title={editingPackage ? "Edit Paket Membership" : "Tambah Paket Membership"}
                open={open}
                onCancel={handleCancel}
                onOk={handleSave}
                confirmLoading={loading}
                okText={editingPackage ? "Update" : "Simpan"}
                cancelText="Batal"
                bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
                destroyOnClose // Reset state internal AntD
            >
                <Row justify="space-between" align="middle" style={{ margin: "20px 0 16px 0" }}>
                    <Col>
                        <Text strong>Status Paket</Text>
                    </Col>
                    <Col>
                        <Switch
                            checkedChildren="Active"
                            unCheckedChildren="Inactive"
                            checked={formData.status_paket === "Active"}
                            onChange={handleStatusChange}
                        />
                    </Col>
                </Row>

                <div style={{ marginBottom: 16 }}>
                    <Text strong>Nama Paket <span style={{ color: "red" }}>*</span></Text>
                    <Input
                        placeholder="Contoh: Basic Open Space"
                        value={formData.nama_paket || ""}
                        onChange={(e) => handleChange("nama_paket", e.target.value)}
                        style={{ marginTop: 8 }}
                        status={validationErrors.nama_paket ? 'error' : ''}
                    />
                    {validationErrors.nama_paket && (
                        <Text type="danger" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>
                            Nama paket wajib diisi.
                        </Text>
                    )}
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Text strong>Kategori Ruangan <span style={{ color: "red" }}>*</span></Text>
                    <Select
                        style={{ width: "100%", marginTop: 8 }}
                        placeholder="Pilih Kategori Ruangan"
                        value={formData.id_kategori_ruangan || undefined}
                        onChange={(value) => handleChange("id_kategori_ruangan", value)}
                        status={validationErrors.id_kategori_ruangan ? 'error' : ''}
                    >
                        {kategoriRuanganList.map((kategori) => (
                            <Select.Option
                                key={kategori.id_kategori_ruangan}
                                value={kategori.id_kategori_ruangan}
                            >
                                {kategori.nama_kategori}
                            </Select.Option>
                        ))}
                    </Select>
                    {validationErrors.id_kategori_ruangan && (
                        <Text type="danger" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>
                            Kategori wajib dipilih.
                        </Text>
                    )}
                </div>

                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <div style={{ marginBottom: 16 }}>
                            <Text strong>Durasi (Hari) <span style={{ color: "red" }}>*</span></Text>
                            <InputNumber
                                style={{ width: "100%", marginTop: 8 }}
                                placeholder="Contoh: 30"
                                min={1}
                                value={formData.durasi}
                                onChange={(v) => handleChange("durasi", v)}
                                status={validationErrors.durasi ? 'error' : ''}
                            />
                            {validationErrors.durasi && (
                                <Text type="danger" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>
                                    Durasi wajib diisi (minimal 1 hari).
                                </Text>
                            )}
                        </div>
                    </Col>
                    <Col xs={24} md={12}>
                         <div style={{ marginBottom: 16 }}>
                            <Text strong>Kuota/Kredit <span style={{ color: "red" }}>*</span></Text>
                            <InputNumber
                                style={{ width: "100%", marginTop: 8 }}
                                placeholder="Jumlah kredit"
                                min={0}
                                value={formData.kuota}
                                onChange={(v) => handleChange("kuota", v)}
                                status={validationErrors.kuota ? 'error' : ''}
                            />
                            {validationErrors.kuota && (
                                <Text type="danger" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>
                                    Kuota wajib diisi (minimal 0).
                                </Text>
                            )}
                        </div>
                    </Col>
                </Row>

                <div style={{ marginBottom: 16 }}>
                    <Text strong>Harga (Rp) <span style={{ color: "red" }}>*</span></Text>
                    <InputNumber
                        style={{ width: "100%", marginTop: 8 }}
                        placeholder="Contoh: 500000"
                        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
                        min={0}
                        value={formData.harga}
                        onChange={(v) => handleChange("harga", v)}
                        status={validationErrors.harga ? 'error' : ''}
                    />
                    {validationErrors.harga && (
                        <Text type="danger" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>
                            Harga wajib diisi (minimal 0).
                        </Text>
                    )}
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Text strong>Deskripsi Benefit</Text>
                    <TextArea
                        rows={3}
                        placeholder="Penjelasan benefit (opsional)"
                        value={formData.deskripsi_benefit || ""}
                        onChange={(e) => handleChange("deskripsi_benefit", e.target.value)}
                        style={{ marginTop: 8 }}
                    />
                </div>

                <div>
                    <Text strong>Fitur Membership</Text>
                    <TextArea
                        rows={2}
                        placeholder="Fitur tambahan (opsional)"
                        value={formData.fitur_membership || ""}
                        onChange={(e) => handleChange("fitur_membership", e.target.value)}
                        style={{ marginTop: 8 }}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default PaketMembershipTab;