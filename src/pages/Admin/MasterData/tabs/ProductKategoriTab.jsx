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
    Select,
    message,
    Popconfirm,
    Tooltip,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    AppstoreOutlined,
    ShopOutlined,
} from "@ant-design/icons";
import {
    getKategoriTenant,
    createKategori,
    updateKategori,
    deleteKategori,
} from "../../../../services/service"; // pastikan service sudah export semua fungsi

const { Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const ProductKategoriTab = () => {
    const [open, setOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    const [merchants, setMerchants] = useState([]);
    const [data, setData] = useState([]);

    const [pageSize, setPageSize] = useState(5);


    // 🚀 Fetch data kategori
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getKategoriTenant();
            if (res.status === 200 && res.data.message === "OK") {
                const kategori = res.data.datas.map((item, index) => ({
                    key: index + 1,
                    id_kategori: item.id_kategori, // ✅ pakai nama field yang sesuai API
                    merchantId: item.id_tenant,
                    nama_merchant: item.nama_tenant,
                    nama_kategori: item.nama_kategori,
                }));

                setData(kategori);

                // ambil unique merchant untuk dropdown
                const uniqMerchants = [
                    ...new Map(
                        kategori.map((m) => [
                            m.merchantId,
                            { id: m.merchantId, name: m.nama_merchant },
                        ])
                    ).values(),
                ];
                setMerchants(uniqMerchants);
            }
        } catch (err) {
            console.error("Gagal fetch kategori:", err);
            message.error("Gagal mengambil data kategori");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 🔎 Filter pencarian
    const filteredData = data.filter(
        (item) =>
            item.nama_kategori.toLowerCase().includes(searchText.toLowerCase()) ||
            item.nama_merchant.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: "ID Kategori",
            dataIndex: "id_kategori",
            key: "id_kategori",
            width: 120,
        },
        {
            title: "Nama Merchant",
            dataIndex: "nama_merchant",
            key: "nama_merchant",
            render: (text) => (
                <Space>
                    <ShopOutlined style={{ color: "#1890ff" }} />
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: "Nama Kategori",
            dataIndex: "nama_kategori",
            key: "nama_kategori",
            render: (text) => (
                <Space>
                    <AppstoreOutlined style={{ color: "#52c41a" }} />
                    {text}
                </Space>
            ),
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
                            style={{ color: "#1890ff" }}
                        />
                    </Tooltip>
                    <Tooltip title="Delete Kategori">
                        <Popconfirm
                            title="Delete Kategori"
                            description="Yakin ingin menghapus kategori ini?"
                            onConfirm={() => handleDelete(record.id_kategori)}
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

    // ➕ Tambah / ✏️ Edit kategori (panggil API)
    const handleAddCategory = async () => {
        if (!formData.merchantId || !formData.nama_kategori) {
            message.error("Mohon lengkapi semua field!");
            return;
        }

        setLoading(true);
        try {
            if (editingCategory) {
                // Update kategori
                const res = await updateKategori(editingCategory.id_kategori, {
                    nama_kategori: formData.nama_kategori,
                    id_tenant: formData.merchantId,
                });

                if (res.status === 200) {
                    message.success("Kategori berhasil diperbarui!");
                }
            } else {
                // Tambah kategori
                const res = await createKategori({
                    id_tenant: formData.merchantId,
                    nama_kategori: formData.nama_kategori,
                });
                if (res.status === 201) {
                    message.success("Kategori baru berhasil ditambahkan!");
                }
            }

            // Refresh tabel
            await fetchData();
            handleCancel();
        } catch (err) {
            console.error("Error save kategori:", err);
            message.error("Gagal menyimpan kategori");
        } finally {
            setLoading(false);
        }
    };

    // ❌ Delete kategori (panggil API)
    const handleDelete = async (id_kategori) => {
        setLoading(true);
        try {
            const res = await deleteKategori(id_kategori);
            if (res.status === 200) {
                message.success("Kategori berhasil dihapus!");
                await fetchData();
            } else {
                message.error("Gagal menghapus kategori");
            }
        } catch (err) {
            console.error("Error delete kategori:", err);
            message.error("Gagal menghapus kategori");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            merchantId: category.merchantId,
            nama_kategori: category.nama_kategori,
        });
        setOpen(true);
    };


    const handleCancel = () => {
        setOpen(false);
        setFormData({});
        setEditingCategory(null);
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
                        placeholder="Cari kategori..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        onSearch={setSearchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="rounded-lg"
                    />
                </Col>

                <Col flex="none">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setOpen(true)}
                        size="large"
                        style={{
                            background: "white",
                            color: "#667eea",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "600",
                        }}
                    >
                        Add New Category
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
                        showQuickJumper: true,
                        pageSizeOptions: ["5", "10", "50", "100"],
                        onChange: (page, newPageSize) => {
                            setPageSize(newPageSize); // ✅ update state saat ganti
                        },
                    }}
                    loading={loading}
                />
            </Card>

            {/* Modal */}
            <Modal
                title={
                    <Space>
                        {editingCategory ? <EditOutlined /> : <PlusOutlined />}
                        {editingCategory ? "Edit Category" : "Add New Category"}
                    </Space>
                }
                open={open}
                onCancel={handleCancel}
                onOk={handleAddCategory}
                confirmLoading={loading}
                okText={editingCategory ? "Update" : "Add"}
                width={600}
            >
                <Row gutter={[20, 20]}>
                    <Col span={12}>
                        <div className="space-y-2">
                            <Text strong>
                                Merchant <span className="text-red-500">*</span>
                            </Text>
                            <Select
                                placeholder="Pilih merchant"
                                value={formData.merchantId}
                                onChange={(value) => handleChange("merchantId", value)}
                                style={{ width: "100%" }}
                            >
                                {merchants.map((m) => (
                                    <Option key={m.id} value={m.id}>
                                        {m.name}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                    </Col>

                    <Col span={12}>
                        <div className="space-y-2">
                            <Text strong>
                                Nama Kategori <span className="text-red-500">*</span>
                            </Text>
                            <Input
                                placeholder="Masukkan nama kategori"
                                value={formData.nama_kategori || ""}
                                onChange={(e) => handleChange("nama_kategori", e.target.value)}
                            />
                        </div>
                    </Col>
                </Row>
            </Modal>
        </div>
    );
};

export default ProductKategoriTab;