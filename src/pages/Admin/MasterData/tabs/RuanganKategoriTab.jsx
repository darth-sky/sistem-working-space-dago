import React, { useState, useEffect } from "react";
import {
    Table, Button, Modal, Input, Typography, Row, Col, Card, Space, message, Popconfirm, Tooltip,
    Switch, Tag, Upload, Image
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
    UploadOutlined, AppstoreOutlined
} from "@ant-design/icons";
import {
    getKategoriRuangan, createKategoriRuangan, updateKategoriRuangan, deleteKategoriRuangan
} from "../../../../services/service";

const { Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

// --- PERBAIKAN: Gunakan import.meta.env.VITE_BASE_URL dinamis ---
// Hapus /api/v1 jika ada, karena static file biasanya di root
const UPLOAD_URL = `${import.meta.env.VITE_BASE_URL.replace('/api/v1', '')}/static/`;

const RuanganKategoriTab = () => {
    const [open, setOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [formData, setFormData] = useState({ status: 'Active' });
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [pageSize, setPageSize] = useState(5);
    const [fileList, setFileList] = useState([]);
    
    // --- TAMBAHAN: State untuk validasi ---
    const [validationError, setValidationError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getKategoriRuangan();
            if (res.status === 200 && res.data.message === "OK") {
                const kategori = res.data.datas.map((item) => ({
                    key: item.id_kategori_ruangan,
                    ...item,
                }));
                setData(kategori);
            }
        } catch (err) {
            console.error("Gagal fetch kategori ruangan:", err);
            message.error("Gagal mengambil data kategori ruangan");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 🔍 Filter global
    const filteredData = data.filter(
        (item) =>
            item.nama_kategori.toLowerCase().includes(searchText.toLowerCase()) ||
            (item.deskripsi && item.deskripsi.toLowerCase().includes(searchText.toLowerCase()))
    );

    // 🔽 Membuat opsi filter unik untuk tiap kolom
    const uniqueFilters = (field) =>
        [...new Set(data.map((item) => item[field]).filter(Boolean))].map((value) => ({
            text: value,
            value,
        }));

    const columns = [
        {
            title: "Gambar",
            dataIndex: "gambar_kategori_ruangan",
            key: "gambar_kategori_ruangan",
            width: 120,
            render: (filename) =>
                filename ? (
                    <Image 
                      width={80} 
                      src={`${UPLOAD_URL}${filename}`} 
                      // Fallback jika gambar error
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/80?text=Error" }}
                    />
                ) : (
                    <Text type="secondary">No Image</Text>
                ),
        },
        {
            title: "ID",
            dataIndex: "id_kategori_ruangan",
            key: "id_kategori_ruangan",
            width: 80,
            sorter: (a, b) => a.id_kategori_ruangan - b.id_kategori_ruangan,
        },
        {
            title: "Nama Kategori",
            dataIndex: "nama_kategori",
            key: "nama_kategori",
            filters: uniqueFilters("nama_kategori"),
            onFilter: (value, record) =>
                record.nama_kategori && record.nama_kategori.indexOf(value) === 0,
            render: (text) => (
                <Space>
                    <AppstoreOutlined style={{ color: "#1890ff" }} />
                    <Text strong>{text}</Text>
                </Space>
            ),
            sorter: (a, b) => a.nama_kategori.localeCompare(b.nama_kategori),
        },
        {
            title: "Deskripsi",
            dataIndex: "deskripsi",
            key: "deskripsi",
            // Hapus filter deskripsi karena terlalu banyak variasi
            // filters: uniqueFilters("deskripsi"), 
            // onFilter: (value, record) =>
            //     record.deskripsi && record.deskripsi.indexOf(value) === 0,
            ellipsis: true,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status) => (
                <Tag color={status === 'Active' ? 'green' : 'red'}>
                    {status?.toUpperCase()}
                </Tag>
            ),
            filters: [
                { text: 'Active', value: 'Active' },
                { text: 'Inactive', value: 'Inactive' },
            ],
            onFilter: (value, record) => record.status.indexOf(value) === 0,
        },
        {
            title: "Actions",
            key: "actions",
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit Kategori">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete Kategori">
                        <Popconfirm
                            title="Yakin ingin menghapus kategori ini?"
                            description="Menghapus kategori dapat mempengaruhi ruangan terkait."
                            onConfirm={() => handleDelete(record.id_kategori_ruangan)}
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
        // --- PERBAIKAN: Hapus error saat user mulai mengetik ---
        if (field === 'nama_kategori' && value.trim() !== "") {
            setValidationError(null);
        }
    };

    const handleSave = async () => {
        // --- PERBAIKAN: Validasi Penuh ---
        if (!formData.nama_kategori || formData.nama_kategori.trim() === "") {
            setValidationError("Nama Kategori wajib diisi."); // Set error
            message.warning("Harap isi semua bidang yang wajib diisi.");
            return;
        }
        
        setValidationError(null); // Lolos validasi, bersihkan error
        setLoading(true);

        const formDataToSend = new FormData();
        Object.keys(formData).forEach((key) => {
            if (formData[key] !== null && formData[key] !== undefined) {
                formDataToSend.append(key, formData[key]);
            }
        });

        if (fileList.length > 0 && fileList[0].originFileObj) {
            formDataToSend.append(
                "gambar_kategori_ruangan",
                fileList[0].originFileObj
            );
        }

        try {
            if (editingCategory) {
                const res = await updateKategoriRuangan(
                    editingCategory.id_kategori_ruangan,
                    formDataToSend
                );
                if (res.status === 200) message.success("Kategori berhasil diperbarui!");
            } else {
                const res = await createKategoriRuangan(formDataToSend);
                if (res.status === 201) message.success("Kategori baru berhasil ditambahkan!");
            }
            await fetchData();
            handleCancel();
        } catch (err) {
            console.error("Error save kategori ruangan:", err);
            // Cek error dari response server
            const errorMsg = err.response?.data?.error || "Gagal menyimpan kategori";
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id_kategori) => {
        try {
            const res = await deleteKategoriRuangan(id_kategori);
            if (res.status === 200) {
                message.success("Kategori berhasil dihapus!");
                fetchData();
            }
        } catch (err) {
            console.error("Gagal menghapus kategori:", err);
            // --- PERBAIKAN: Tampilkan pesan error dari server ---
            const errorMsg = err.response?.data?.error || "Gagal menghapus kategori";
            message.error(errorMsg);
        }
    };

    const handleAdd = () => {
        setEditingCategory(null);
        setFormData({ status: "Active" });
        setFileList([]);
        setValidationError(null); // Bersihkan error
        setOpen(true);
    };

    const handleEdit = (record) => {
        setEditingCategory(record);
        setFormData(record);
        if (record.gambar_kategori_ruangan) {
            setFileList([
                {
                    uid: "-1",
                    name: record.gambar_kategori_ruangan,
                    status: "done",
                    url: `${UPLOAD_URL}${record.gambar_kategori_ruangan}`,
                },
            ]);
        } else {
            setFileList([]);
        }
        setValidationError(null); // Bersihkan error
        setOpen(true);
    };

    const handleCancel = () => {
        setOpen(false);
        setFormData({ status: "Active" });
        setEditingCategory(null);
        setFileList([]);
        setValidationError(null); // Bersihkan error
    };

    return (
        <div style={{ padding: "24px" }}>
            <Row
                gutter={[16, 16]}
                align="middle"
                justify="space-between"
                style={{ marginBottom: 24 }}
            >
                <Col flex="1">
                    <Search
                        placeholder="Cari kategori ruangan..."
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                        size="large"
                    />
                </Col>
                <Col flex="none">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                        size="large"
                    >
                        Tambah Kategori
                    </Button>
                </Col>
            </Row>

            <Card style={{ borderRadius: "12px", overflowX: 'auto' }}>
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    pagination={{
                        pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ["5", "10", "20"],
                        onShowSizeChange: (c, size) => setPageSize(size),
                    }}
                    scroll={{ x: 900 }} // Tambahkan scroll horizontal
                />
            </Card>

            <Modal
                title={editingCategory ? "Edit Kategori Ruangan" : "Tambah Kategori Ruangan"}
                open={open}
                onCancel={handleCancel}
                onOk={handleSave}
                confirmLoading={loading}
                destroyOnClose // Reset state internal AntD saat modal ditutup
            >
                <div style={{ marginTop: 24 }}>
                    <Text strong>
                        Nama Kategori <span style={{ color: "red" }}>*</span>
                    </Text>
                    <Input
                        value={formData.nama_kategori || ""}
                        onChange={(e) => handleChange("nama_kategori", e.target.value)}
                        style={{ marginTop: 8 }}
                        status={validationError ? 'error' : ''} // <-- PERBAIKAN VALIDASI
                    />
                    {/* --- PESAN ERROR SPESIFIK --- */}
                    {validationError && (
                        <Text type="danger" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>
                            {validationError}
                        </Text>
                    )}
                </div>
                <div style={{ marginTop: 16 }}>
                    <Text strong>Deskripsi</Text>
                    <TextArea
                        rows={3}
                        value={formData.deskripsi || ""}
                        onChange={(e) => handleChange("deskripsi", e.target.value)}
                        style={{ marginTop: 8 }}
                    />
                </div>

                <div style={{ marginTop: 16 }}>
                    <Text strong>Gambar Kategori</Text>
                    <Upload
                        listType="picture-card"
                        fileList={fileList}
                        onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                        beforeUpload={() => false} // Selalu return false untuk handle manual
                        maxCount={1}
                        style={{ marginTop: 8 }}
                        accept="image/png, image/jpeg" // Batasi tipe file
                    >
                        {fileList.length < 1 && ( // Hanya tampilkan jika belum ada file
                            <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Upload</div>
                            </div>
                        )}
                    </Upload>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                        (JPG/PNG, Max 2MB).
                    </Text>
                </div>

                <div
                    style={{
                        marginTop: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                    }}
                >
                    <Text strong>Status</Text>
                    <Switch
                        checkedChildren="Active"
                        unCheckedChildren="Inactive"
                        checked={formData.status === "Active"}
                        onChange={(checked) =>
                            handleChange("status", checked ? "Active" : "Inactive")
                        }
                    />
                </div>
            </Modal>
        </div>
    );
};

export default RuanganKategoriTab;