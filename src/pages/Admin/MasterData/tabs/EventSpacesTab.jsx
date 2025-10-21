import React, { useState, useEffect } from "react";
import {
    Table, Button, Modal, Input, Typography, Row, Col, Card, Space, message, Popconfirm, Tooltip, InputNumber, Tag,
    Upload, Image,
    Switch // PERBAIKAN: Impor komponen Switch
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, 
    UploadOutlined
} from "@ant-design/icons";
import {
    getEventSpacesAdmin, createEventSpace, updateEventSpace, deleteEventSpace
} from "../../../../services/service"; // Pastikan path service sudah benar

const { Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

// Definisikan base URL untuk menampilkan gambar dari folder 'uploads'
const UPLOAD_URL = `${import.meta.env.VITE_BASE_URL}/static/`;

const EventSpacesTab = () => {
    const [open, setOpen] = useState(false);
    const [editingEventSpace, setEditingEventSpace] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [formData, setFormData] = useState({ status_ketersediaan: 'Active' }); // Default status Active
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [pageSize, setPageSize] = useState(5);
    const [fileList, setFileList] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getEventSpacesAdmin();
            if (res.status === 200 && res.data.message === "OK") {
                const eventSpaces = res.data.datas.map((item) => ({
                    ...item,
                    key: item.id_event_space,
                }));
                setData(eventSpaces);
            }
        } catch (err) {
            console.error("Gagal fetch event spaces:", err);
            message.error("Gagal mengambil data event spaces");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = data.filter(
        (item) =>
        item.nama_event_space.toLowerCase().includes(searchText.toLowerCase())
    );
    
    const formatRupiah = (number) => {
        if (number === null || number === undefined) return "-";
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    const columns = [
        {
            title: "Gambar",
            dataIndex: "gambar_ruangan",
            key: "gambar_ruangan",
            width: 120,
            render: (filename) => filename 
                ? <Image width={80} src={`${UPLOAD_URL}${filename}`} /> 
                : <Text type="secondary">No Image</Text>
        },
        { title: "ID", dataIndex: "id_event_space", key: "id_event_space", width: 80 },
        { title: "Nama Event Space", dataIndex: "nama_event_space", key: "nama_event_space", render: (text) => <Text strong>{text}</Text> },
        { title: "Harga Paket", dataIndex: "harga_paket", key: "harga_paket", render: (text) => formatRupiah(text) },
        { title: "Kapasitas", dataIndex: "kapasitas", key: "kapasitas", render: (text) => text ? `${text} orang` : '-' },
        // PERBAIKAN: Sesuaikan render dan filter untuk status 'Active'/'Inactive'
        {
            title: "Status",
            dataIndex: "status_ketersediaan",
            key: "status_ketersediaan",
            render: (status) => (
                <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag>
            ),
            filters: [
                { text: 'Active', value: 'Active' },
                { text: 'Inactive', value: 'Inactive' },
            ],
            onFilter: (value, record) => record.status_ketersediaan.indexOf(value) === 0,
        },
        {
            title: "Actions",
            key: "actions",
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit Event Space"><Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} /></Tooltip>
                    <Tooltip title="Delete Event Space">
                        <Popconfirm
                            title="Hapus Event Space"
                            description="Yakin ingin menghapus data ini?"
                            onConfirm={() => handleDelete(record.id_event_space)}
                            okText="Ya" cancelText="Tidak"
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
    
    const handleFileChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    const handleSave = async () => {
        if (!formData.nama_event_space || !formData.harga_paket || !formData.status_ketersediaan) {
            message.error("Nama, Harga, dan Status wajib diisi!");
            return;
        }
        setLoading(true);
        
        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                formDataToSend.append(key, formData[key]);
            }
        });

        if (fileList.length > 0 && fileList[0].originFileObj) {
            formDataToSend.append("gambar_ruangan", fileList[0].originFileObj);
        } else if (editingEventSpace && editingEventSpace.gambar_ruangan) {
            formDataToSend.append("gambar_ruangan_existing", editingEventSpace.gambar_ruangan);
        }

        try {
            if (editingEventSpace) {
                const res = await updateEventSpace(editingEventSpace.id_event_space, formDataToSend);
                if (res.status === 200) message.success("Event Space berhasil diperbarui!");
            } else {
                const res = await createEventSpace(formDataToSend);
                if (res.status === 201) message.success("Event Space baru berhasil ditambahkan!");
            }
            await fetchData();
            handleCancel();
        } catch (err) {
            console.error("Error save event space:", err);
            message.error(err.data?.error || "Gagal menyimpan data");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id_event_space) => {
        setLoading(true);
        try {
            const res = await deleteEventSpace(id_event_space);
            if (res.status === 200) {
                message.success("Event Space berhasil dihapus!");
                // Panggil fetchData untuk memperbarui data di tabel setelah penghapusan
                await fetchData();
            } else {
                // Tampilkan pesan error dari backend jika ada
                message.error(res.data?.error || "Gagal menghapus data");
            }
        } catch (err) {
            console.error("Error delete event space:", err);
            message.error("Terjadi kesalahan saat mencoba menghapus data.");
        } finally {
            setLoading(false);
        }
    };
    const handleEdit = (record) => {
        setEditingEventSpace(record);
        setFormData(record);
        if (record.gambar_ruangan) {
            setFileList([{
                uid: '-1', name: record.gambar_ruangan, status: 'done',
                url: `${UPLOAD_URL}${record.gambar_ruangan}`,
            }]);
        } else {
            setFileList([]);
        }
        setOpen(true);
    };

    const handleAdd = () => {
        setEditingEventSpace(null);
        setFormData({ status_ketersediaan: 'Active' }); // Default 'Active' untuk item baru
        setFileList([]);
        setOpen(true);
    };

    const handleCancel = () => {
        setOpen(false);
        setFormData({ status_ketersediaan: 'Active' });
        setEditingEventSpace(null);
        setFileList([]);
    };

    return (
        <div style={{ padding: "24px" }}>
            <Row gutter={[16, 16]} justify="space-between" style={{ marginBottom: 24 }}>
                <Col flex="1"> <Search placeholder="Cari event space..." allowClear enterButton={<SearchOutlined />} size="large" onSearch={setSearchText} onChange={(e) => setSearchText(e.target.value)} /> </Col>
                <Col flex="none"> <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large"> Add New Event Space </Button> </Col>
            </Row>
            <Card style={{ borderRadius: "12px" }}>
                <Table columns={columns} dataSource={filteredData} pagination={{ pageSize, showSizeChanger: true, pageSizeOptions: ["5", "10", "50", "100"], onShowSizeChange: (current, size) => setPageSize(size), }} loading={loading} />
            </Card>

            <Modal
                title={ <Space>{editingEventSpace ? <EditOutlined /> : <PlusOutlined />}{editingEventSpace ? "Edit Event Space" : "Add Event Space"}</Space> }
                open={open} onCancel={handleCancel} onOk={handleSave} confirmLoading={loading} okText={editingEventSpace ? "Update" : "Add"} width={600}
            >
                <div style={{ marginTop: '24px' }}> <Text strong>Nama Event Space <span style={{ color: "red" }}>*</span></Text> <Input placeholder="Cth: Aula Serbaguna" value={formData.nama_event_space || ""} onChange={(e) => handleChange("nama_event_space", e.target.value)} style={{ marginTop: '8px' }} /> </div>
                <div style={{ marginTop: '16px' }}> <Text strong>Deskripsi</Text> <TextArea rows={3} placeholder="Masukkan deskripsi singkat" value={formData.deskripsi_event_space || ""} onChange={(e) => handleChange("deskripsi_event_space", e.target.value)} style={{ marginTop: '8px' }} /> </div>
                <Row gutter={16}>
                    <Col span={12}> <div style={{ marginTop: '16px' }}> <Text strong>Harga Paket (Rp) <span style={{ color: "red" }}>*</span></Text> <InputNumber style={{ width: '100%', marginTop: '8px' }} placeholder="Cth: 1500000" value={formData.harga_paket} onChange={(value) => handleChange("harga_paket", value)} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/\$\s?|(,*)/g, '')} /> </div> </Col>
                    <Col span={12}> <div style={{ marginTop: '16px' }}> <Text strong>Kapasitas (Orang)</Text> <InputNumber style={{ width: '100%', marginTop: '8px' }} placeholder="Cth: 50" value={formData.kapasitas} onChange={(value) => handleChange("kapasitas", value)} /> </div> </Col>
                </Row>
                <div style={{ marginTop: '16px' }}> <Text strong>Gambar Ruangan</Text> <Upload listType="picture" fileList={fileList} onChange={handleFileChange} beforeUpload={() => false} maxCount={1} style={{ marginTop: '8px' }}> <Button icon={<UploadOutlined />}>Pilih Gambar</Button> </Upload> </div>
                
                {/* PERBAIKAN: Mengganti Select dengan Switch */}
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Text strong>Status Ketersediaan <span style={{ color: "red" }}>*</span></Text>
                    <Switch
                        checkedChildren="Active"
                        unCheckedChildren="Inactive"
                        checked={formData.status_ketersediaan === 'Active'}
                        onChange={(checked) => handleChange("status_ketersediaan", checked ? "Active" : "Inactive")}
                    />
                </div>

                <div style={{ marginTop: '16px' }}> <Text strong>Fitur Ruangan</Text> <TextArea rows={3} placeholder="Cth: free wifi, proyektor, sound system" value={formData.fitur_ruangan || ""} onChange={(e) => handleChange("fitur_ruangan", e.target.value)} style={{ marginTop: '8px' }} /> </div>
            </Modal>
        </div>
    );
};

export default EventSpacesTab;
