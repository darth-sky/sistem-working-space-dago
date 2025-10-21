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
    Tag,      // PERBAIKAN: Impor komponen Tag
    Switch    // PERBAIKAN: Impor komponen Switch
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    SolutionOutlined,
} from "@ant-design/icons";
import {
    getPaketVOadmin,
    createPaketVO,
    updatePaketVO,
    deletePaketVO,
} from "../../../../services/service"; // pastikan path import benar

const { Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

const VirtualOfficePackageTab = () => {
    const [open, setOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [formData, setFormData] = useState({ status: 'Active' }); // Default status Active
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [pageSize, setPageSize] = useState(5);

    // Fetch data paket virtual office
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getPaketVOadmin();
            if (res.status === 200 && res.data.message === "OK") {
                // Langsung gunakan key dari database untuk konsistensi
                const paket = res.data.datas.map(item => ({
                    key: item.id_paket_vo, 
                    ...item 
                }));
                setData(paket);
            }
        } catch (err) {
            console.error("Gagal fetch paket VO:", err);
            message.error("Gagal mengambil data paket virtual office");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter pencarian
    const filteredData = data.filter((item) =>
        item.nama_paket.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: "ID Paket",
            dataIndex: "id_paket_vo",
            key: "id_paket_vo",
            width: 100,
        },
        {
            title: "Nama Paket",
            dataIndex: "nama_paket",
            key: "nama_paket",
            render: (text) => (
                <Space>
                    <SolutionOutlined style={{ color: "#1890ff" }} />
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: "Harga",
            dataIndex: "harga",
            key: "harga",
            render: (text) => `Rp ${new Intl.NumberFormat("id-ID").format(text)}`,
        },
        {
            title: "Durasi (Hari)",
            dataIndex: "durasi",
            key: "durasi",
        },
        {
            title: "Benefit Meeting Room",
            dataIndex: "benefit_jam_meeting_room_per_bulan",
            key: "benefit_jam_meeting_room_per_bulan",
            render: (text) => `${text || 0} jam/bulan`,
        },
        // PERBAIKAN: Tambahkan kolom Status
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === 'Active' ? 'green' : 'red'}>
                    {status ? status.toUpperCase() : 'INAKTIF'}
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
                    <Tooltip title="Edit Paket">
                        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ color: "#1890ff" }} />
                    </Tooltip>
                    <Tooltip title="Delete Paket">
                        <Popconfirm
                            title="Delete Paket"
                            description="Yakin ingin menghapus paket ini?"
                            onConfirm={() => handleDelete(record.id_paket_vo)}
                            okText="Yes"
                            cancelText="No"
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

    // Tambah / Edit paket (panggil API)
    const handleSave = async () => {
        if (!formData.nama_paket || !formData.harga || !formData.durasi) {
            message.error("Nama Paket, Harga, dan Durasi wajib diisi!");
            return;
        }

        setLoading(true);
        try {
            // Payload sekarang sudah otomatis menyertakan status dari formData
            const payload = {
                nama_paket: formData.nama_paket,
                harga: formData.harga,
                durasi: formData.durasi,
                benefit_jam_meeting_room_per_bulan: formData.benefit_jam_meeting_room_per_bulan || 0,
                benefit_jam_working_space_per_bulan: formData.benefit_jam_working_space_per_bulan || 0,
                deskripsi_layanan: formData.deskripsi_layanan || null,
                status: formData.status // Mengirim status ke backend
            };

            if (editingPackage) {
                const res = await updatePaketVO(editingPackage.id_paket_vo, payload);
                if (res.status === 200) message.success("Paket berhasil diperbarui!");
            } else {
                const res = await createPaketVO(payload);
                if (res.status === 201) message.success("Paket baru berhasil ditambahkan!");
            }
            await fetchData();
            handleCancel();
        } catch (err) {
            console.error("Error save paket VO:", err);
            message.error(err.data?.error || "Gagal menyimpan paket");
        } finally {
            setLoading(false);
        }
    };

    // Delete paket (panggil API)
    const handleDelete = async (id_paket_vo) => {
        setLoading(true);
        try {
            const res = await deletePaketVO(id_paket_vo);
            if (res.status === 200) {
                message.success("Paket berhasil dihapus!");
                await fetchData();
            } else {
                message.error(res.data?.error || "Gagal menghapus paket");
            }
        } catch (err) {
            console.error("Error delete paket:", err);
            message.error("Gagal menghapus paket");
        } finally {
            setLoading(false);
        }
    };
    
    const handleAdd = () => {
        setEditingPackage(null);
        setFormData({ status: 'Active' }); // Default status 'Active' untuk paket baru
        setOpen(true);
    };

    const handleEdit = (pkg) => {
        setEditingPackage(pkg);
        setFormData({ ...pkg });
        setOpen(true);
    };

    const handleCancel = () => {
        setOpen(false);
        setFormData({ status: 'Active' }); // Selalu reset ke default
        setEditingPackage(null);
    };

    return (
        <div style={{ padding: "24px" }}>
            <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
                <Col flex="1">
                    <Search
                        placeholder="Cari nama paket..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        onSearch={setSearchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </Col>
                <Col flex="none">
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
                        Add New Package
                    </Button>
                </Col>
            </Row>

            <Card style={{ borderRadius: "12px" }}>
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    pagination={{
                        pageSize: pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ["5", "10", "50", "100"],
                        onShowSizeChange: (current, size) => setPageSize(size),
                    }}
                    loading={loading}
                    scroll={{ x: 800 }}
                />
            </Card>

            {/* Modal */}
            <Modal
                title={ <Space>{editingPackage ? <EditOutlined /> : <PlusOutlined />} {editingPackage ? "Edit Paket Virtual Office" : "Add Paket Virtual Office"}</Space> }
                open={open}
                onCancel={handleCancel}
                onOk={handleSave}
                confirmLoading={loading}
                okText={editingPackage ? "Update" : "Add"}
            >
                <div style={{ marginTop: '24px' }}> <Text strong>Nama Paket <span style={{ color: "red" }}>*</span></Text> <Input placeholder="Contoh: Paket 6 Bulan" value={formData.nama_paket || ""} onChange={(e) => handleChange("nama_paket", e.target.value)} style={{ marginTop: '8px' }} /> </div>
                <div style={{ marginTop: '16px' }}> <Text strong>Harga (Rp) <span style={{ color: "red" }}>*</span></Text> <InputNumber placeholder="Contoh: 1750000" value={formData.harga} onChange={(value) => handleChange("harga", value)} style={{ marginTop: '8px', width: '100%' }} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/\$\s?|(,*)/g, '')} /> </div>
                <div style={{ marginTop: '16px' }}> <Text strong>Durasi (Hari) <span style={{ color: "red" }}>*</span></Text> <InputNumber placeholder="Contoh: 180" value={formData.durasi} onChange={(value) => handleChange("durasi", value)} style={{ marginTop: '8px', width: '100%' }} /> </div>
                <div style={{ marginTop: '16px' }}> <Text strong>Benefit Jam Meeting Room per Bulan</Text> <InputNumber placeholder="Contoh: 4" value={formData.benefit_jam_meeting_room_per_bulan} onChange={(value) => handleChange("benefit_jam_meeting_room_per_bulan", value)} style={{ marginTop: '8px', width: '100%' }} /> </div>
                <div style={{ marginTop: '16px' }}> <Text strong>Benefit Jam Working Space per Bulan</Text> <InputNumber placeholder="Contoh: 8" value={formData.benefit_jam_working_space_per_bulan} onChange={(value) => handleChange("benefit_jam_working_space_per_bulan", value)} style={{ marginTop: '8px', width: '100%' }} /> </div>
                <div style={{ marginTop: '16px' }}> <Text strong>Deskripsi Layanan</Text> <TextArea rows={3} placeholder="Masukkan deskripsi layanan (opsional)" value={formData.deskripsi_layanan || ""} onChange={(e) => handleChange("deskripsi_layanan", e.target.value)} style={{ marginTop: '8px' }} /> </div>
                
                {/* PERBAIKAN: Menambahkan Switch untuk status */}
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Text strong>Status Paket</Text>
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

export default VirtualOfficePackageTab;
