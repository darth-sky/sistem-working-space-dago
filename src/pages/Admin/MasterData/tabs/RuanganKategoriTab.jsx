import React, { useState, useEffect } from "react";
import {
    Table, Button, Modal, Input, Typography, Row, Col, Card, Space, message, Popconfirm, Tooltip,
    Switch, Tag,
    Upload, Image // PERBAIKAN: Impor Upload dan Image
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
    UploadOutlined, AppstoreOutlined // PERBAIKAN: Impor Ikon Upload
} from "@ant-design/icons";
import {
    getKategoriRuangan, createKategoriRuangan, updateKategoriRuangan, deleteKategoriRuangan
} from "../../../../services/service"; // pastikan path import benar

const { Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

// PERBAIKAN: Definisikan base URL untuk folder 'uploads' di backend Anda
const UPLOAD_URL = `${import.meta.env.VITE_BASE_URL}/static/`;

const RuanganKategoriTab = () => {
    const [open, setOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [formData, setFormData] = useState({ status: 'Active' });
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [pageSize, setPageSize] = useState(5);
    const [fileList, setFileList] = useState([]); // State baru untuk mengelola file gambar

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getKategoriRuangan();
            if (res.status === 200 && res.data.message === "OK") {
                const kategori = res.data.datas.map((item) => ({
                    key: item.id_kategori_ruangan, // Gunakan ID unik dari DB sebagai key
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

    const filteredData = data.filter(
        (item) =>
            item.nama_kategori.toLowerCase().includes(searchText.toLowerCase()) ||
            (item.deskripsi &&
                item.deskripsi.toLowerCase().includes(searchText.toLowerCase()))
    );

    const columns = [
        // PERBAIKAN: Tambah kolom untuk menampilkan gambar
        {
            title: "Gambar",
            dataIndex: "gambar_kategori_ruangan",
            key: "gambar_kategori_ruangan",
            width: 120,
            render: (filename) => filename 
                ? <Image width={80} src={`${UPLOAD_URL}${filename}`} /> 
                : <Text type="secondary">No Image</Text>
        },
        { title: "ID", dataIndex: "id_kategori_ruangan", key: "id_kategori_ruangan", width: 80 },
        { title: "Nama Kategori", dataIndex: "nama_kategori", key: "nama_kategori", render: (text) => (<Space><AppstoreOutlined style={{ color: "#1890ff" }} /><Text strong>{text}</Text></Space>) },
        { title: "Deskripsi", dataIndex: "deskripsi", key: "deskripsi", ellipsis: true },
        {
            title: "Status", dataIndex: "status", key: "status", width: 120,
            render: (status) => (<Tag color={status === 'Active' ? 'green' : 'red'}>{status?.toUpperCase()}</Tag>),
            filters: [{ text: 'Active', value: 'Active' }, { text: 'Inactive', value: 'Inactive' }],
            onFilter: (value, record) => record.status.indexOf(value) === 0,
        },
        {
            title: "Actions", key: "actions", width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit Kategori"><Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} /></Tooltip>
                    <Tooltip title="Delete Kategori"><Popconfirm title="Yakin ingin menghapus kategori ini?" onConfirm={() => handleDelete(record.id_kategori_ruangan)}><Button type="link" danger icon={<DeleteOutlined />} /></Popconfirm></Tooltip>
                </Space>
            ),
        },
    ];

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    // PERBAIKAN: Logika handleSave diubah total untuk mengirim FormData
    const handleSave = async () => {
        if (!formData.nama_kategori) {
            message.error("Nama Kategori wajib diisi!");
            return;
        }
        setLoading(true);

        const formDataToSend = new FormData();
        // Tambahkan semua data teks dari state `formData` ke `formDataToSend`
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                formDataToSend.append(key, formData[key]);
            }
        });
        
        // Tambahkan file gambar jika ada yang baru dipilih
        if (fileList.length > 0 && fileList[0].originFileObj) {
            formDataToSend.append('gambar_kategori_ruangan', fileList[0].originFileObj);
        }

        try {
            if (editingCategory) {
                const res = await updateKategoriRuangan(editingCategory.id_kategori_ruangan, formDataToSend);
                if (res.status === 200) message.success("Kategori berhasil diperbarui!");
            } else {
                const res = await createKategoriRuangan(formDataToSend);
                if (res.status === 201) message.success("Kategori baru berhasil ditambahkan!");
            }
            await fetchData();
            handleCancel();
        } catch (err) {
            console.error("Error save kategori ruangan:", err);
            message.error(err.data?.error || "Gagal menyimpan kategori");
        } finally {
            setLoading(false);
        }
    };
    
    const handleDelete = async (id_kategori) => { /* ... (fungsi ini sudah benar) ... */ };
    
    const handleAdd = () => {
        setEditingCategory(null);
        setFormData({ status: 'Active' });
        setFileList([]); // Kosongkan file list
        setOpen(true);
    };

    const handleEdit = (record) => {
        setEditingCategory(record);
        setFormData(record);
        // Tampilkan gambar yang sudah ada di komponen Upload
        if (record.gambar_kategori_ruangan) {
            setFileList([{
                uid: '-1',
                name: record.gambar_kategori_ruangan,
                status: 'done',
                url: `${UPLOAD_URL}${record.gambar_kategori_ruangan}`,
            }]);
        } else {
            setFileList([]);
        }
        setOpen(true);
    };

    const handleCancel = () => {
        setOpen(false);
        setFormData({ status: 'Active' });
        setEditingCategory(null);
        setFileList([]); // Selalu reset file list saat modal ditutup
    };

    return (
        <div style={{ padding: "24px" }}>
            <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
                <Col flex="1"><Search placeholder="Cari kategori ruangan..." onChange={(e) => setSearchText(e.target.value)} allowClear size="large" /></Col>
                <Col flex="none"><Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">Tambah Kategori</Button></Col>
            </Row>

            <Card style={{ borderRadius: "12px" }}>
                <Table columns={columns} dataSource={filteredData} loading={loading} pagination={{ pageSize, showSizeChanger: true, pageSizeOptions: ["5", "10", "20"] , onShowSizeChange: (c, size) => setPageSize(size)}}/>
            </Card>

            <Modal
                title={editingCategory ? "Edit Kategori Ruangan" : "Tambah Kategori Ruangan"}
                open={open}
                onCancel={handleCancel}
                onOk={handleSave}
                confirmLoading={loading}
            >
                <div style={{ marginTop: 24 }}>
                    <Text strong>Nama Kategori <span style={{ color: "red" }}>*</span></Text>
                    <Input value={formData.nama_kategori || ""} onChange={(e) => handleChange("nama_kategori", e.target.value)} style={{ marginTop: 8 }} />
                </div>
                <div style={{ marginTop: 16 }}>
                    <Text strong>Deskripsi</Text>
                    <TextArea rows={3} value={formData.deskripsi || ""} onChange={(e) => handleChange("deskripsi", e.target.value)} style={{ marginTop: 8 }} />
                </div>
                
                {/* PERBAIKAN: Tambahkan komponen Upload */}
                <div style={{ marginTop: 16 }}>
                    <Text strong>Gambar Kategori</Text>
                    <Upload
                        listType="picture-card"
                        fileList={fileList}
                        onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                        beforeUpload={() => false}
                        maxCount={1}
                        style={{ marginTop: 8 }}
                    >
                        <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                    </Upload>
                </div>
                
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Text strong>Status</Text>
                    <Switch
                        checkedChildren="Active"
                        unCheckedChildren="Inactive"
                        checked={formData.status === 'Active'}
                        onChange={(checked) => handleChange("status", checked ? "Active" : "Inactive")}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default RuanganKategoriTab;