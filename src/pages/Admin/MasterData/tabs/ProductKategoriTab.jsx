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
    Form,
    Input as AntInput, // <-- Impor Input dari antd sebagai AntInput
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined, // <-- Impor SearchOutlined
    AppstoreOutlined,
    ShopOutlined,
} from "@ant-design/icons";
import {
    getKategoriTenant,
    createKategori,
    updateKategori,
    deleteKategori,
    getTenantsForDropdown
} from "../../../../services/service"; // pastikan service sudah export semua fungsi

const { Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const ProductKategoriTab = () => {
    const [open, setOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    // Hapus state searchText jika hanya mengandalkan filter kolom
    // const [searchText, setSearchText] = useState("");
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [tenantsForDropdown, setTenantsForDropdown] = useState([]);
    const [data, setData] = useState([]);
    const [pageSize, setPageSize] = useState(5);

    // --- State untuk filter (opsional, jika ingin mengontrol value filter dari luar) ---
    const [searchTextInternal, setSearchTextInternal] = useState(''); // Ganti nama agar tidak bentrok
    const [searchedColumn, setSearchedColumn] = useState('');

    // --- Fungsi untuk mendapatkan props filter kolom teks ---
    const getColumnSearchProps = (dataIndex, placeholder) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
            <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                <AntInput
                    placeholder={`Cari ${placeholder || dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Cari
                    </Button>
                    <Button
                        onClick={() => clearFilters && handleReset(clearFilters)}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Reset
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => { close(); }}
                    >
                        Tutup
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered) => (
            <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        ),
        onFilter: (value, record) =>
            record[dataIndex]
                ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
                : '',
        render: (text) => text, // Render teks biasa
    });

    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchTextInternal(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const handleReset = (clearFilters) => {
        clearFilters();
        setSearchTextInternal('');
    };

    // 🚀 Fetch data kategori
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getKategoriTenant();
            if (res.status === 200 && res.data.message === "OK") {
                // Map data untuk menambahkan key unik jika belum ada
                const kategori = res.data.datas.map((item, index) => ({
                    key: item.id_kategori || index + 1, // Gunakan id_kategori jika ada, fallback ke index
                    id_kategori: item.id_kategori,
                    merchantId: item.id_tenant,
                    nama_merchant: item.nama_tenant,
                    nama_kategori: item.nama_kategori,
                }));
                setData(kategori);
            } else {
                 message.error(res.data?.error || "Gagal mengambil data kategori");
            }
        } catch (err) {
            console.error("Gagal fetch kategori:", err);
            message.error("Gagal mengambil data kategori: " + (err.message || "Error tidak diketahui"));
        } finally {
            setLoading(false);
        }
    };

    // Fungsi untuk fetch data tenant untuk modal
    const fetchTenants = async () => {
        try {
            const res = await getTenantsForDropdown();
            if (res.status === 200) {
                setTenantsForDropdown(res.data.datas);
            }
        } catch (err) {
            console.error("Gagal fetch tenants for dropdown:", err);
        }
    };

    useEffect(() => {
        fetchData();
        fetchTenants();
    }, []);

    // Hapus filter pencarian global, karena sudah diganti filter per kolom
    // const filteredData = data.filter(...)

    const columns = [
        {
            title: "ID Kategori",
            dataIndex: "id_kategori",
            key: "id_kategori",
            width: 120,
            sorter: (a, b) => a.id_kategori - b.id_kategori,
            ...getColumnSearchProps('id_kategori', 'ID'), // <-- Tambah filter
        },
        {
            title: "Nama Merchant",
            dataIndex: "nama_merchant",
            key: "nama_merchant",
            sorter: (a, b) => (a.nama_merchant || '').localeCompare(b.nama_merchant || ''),
            ...getColumnSearchProps('nama_merchant', 'Merchant'), // <-- Tambah filter
            render: (text) => (
                <Space>
                    <ShopOutlined style={{ color: "#1890ff" }} />
                    <Text strong>{text}</Text>
                </Space>
            ),
             // Filter dropdown statis jika daftar tenant tidak terlalu banyak
             filters: tenantsForDropdown.map(tenant => ({ text: tenant.nama_tenant, value: tenant.nama_tenant })),
             onFilter: (value, record) => record.nama_merchant === value,
        },
        {
            title: "Nama Kategori",
            dataIndex: "nama_kategori",
            key: "nama_kategori",
            sorter: (a, b) => (a.nama_kategori || '').localeCompare(b.nama_kategori || ''),
            ...getColumnSearchProps('nama_kategori', 'Kategori'), // <-- Tambah filter
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
            fixed: 'right', // Opsi: buat kolom aksi tetap
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
                            okText="Ya"
                            cancelText="Tidak"
                            disabled={loading} // Disable saat loading
                        >
                            <Button type="link" danger icon={<DeleteOutlined />} disabled={loading} />
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
    const handleAddCategory = async () => { /* ... (fungsi tetap sama) ... */
      if (!formData.merchantId || !formData.nama_kategori) {
           message.error("Mohon lengkapi semua field!");
           return;
       }

       setLoading(true);
       try {
           let res;
           if (editingCategory) {
               // Update kategori
               res = await updateKategori(editingCategory.id_kategori, {
                   nama_kategori: formData.nama_kategori,
                   id_tenant: formData.merchantId, // pastikan key sesuai API backend
               });
           } else {
               // Tambah kategori
               res = await createKategori({
                   id_tenant: formData.merchantId, // pastikan key sesuai API backend
                   nama_kategori: formData.nama_kategori,
               });
           }

           // Cek status respon
           if (res.status === 200 || res.status === 201) {
               message.success(res.data.message || `Kategori berhasil ${editingCategory ? 'diperbarui' : 'ditambahkan'}!`);
               await fetchData(); // Refresh tabel
               handleCancel(); // Tutup modal
           } else {
               // Tampilkan error dari backend jika ada
               message.error(res.data?.error || "Gagal menyimpan kategori.");
           }

       } catch (err) {
           console.error("Error save kategori:", err);
           message.error("Gagal menyimpan kategori: " + (err.message || "Error tidak diketahui"));
       } finally {
           setLoading(false);
       }
    };

    // ❌ Delete kategori (panggil API)
    const handleDelete = async (id_kategori) => { /* ... (fungsi tetap sama) ... */
       setLoading(true);
       try {
           const res = await deleteKategori(id_kategori);
           if (res.status === 200) {
               message.success("Kategori berhasil dihapus!");
               await fetchData();
           } else {
                message.error(res.data?.error || "Gagal menghapus kategori");
           }
       } catch (err) {
           console.error("Error delete kategori:", err);
            // Cek jika error karena constraint
           if (err.response?.data?.error && err.response.data.error.includes("foreign key constraint fails")) {
                message.error("Gagal menghapus: Kategori masih digunakan oleh produk.");
           } else {
                message.error("Gagal menghapus kategori: " + (err.message || "Error tidak diketahui"));
           }
       } finally {
           setLoading(false);
       }
    };

    const handleEdit = (category) => { /* ... (fungsi tetap sama) ... */
       setEditingCategory(category);
       setFormData({
           merchantId: category.merchantId,
           nama_kategori: category.nama_kategori,
       });
       setOpen(true);
    };

    const handleCancel = () => { /* ... (fungsi tetap sama) ... */
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
                {/* Hapus Search global karena sudah ada filter per kolom */}
                {/* <Col flex="1"> ... Search ... </Col> */}
                <Col flex="1" /> {/* Spacer */}

                <Col flex="none">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setOpen(true)}
                        size="large"
                        // Style bisa disesuaikan lagi jika perlu
                    >
                        Tambah Kategori Baru
                    </Button>
                </Col>
            </Row>

            <Card style={{ borderRadius: "12px" }}>
                <Table
                    columns={columns}
                    // Gunakan 'data' langsung, Ant Design akan handle filter
                    dataSource={data}
                    rowKey="key" // Gunakan key yang sudah kita buat
                    pagination={{
                        pageSize: pageSize,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        pageSizeOptions: ["5", "10", "50", "100"],
                        onChange: (page, newPageSize) => {
                            setPageSize(newPageSize);
                        },
                         showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} item`, // Tampilkan total item
                    }}
                    loading={loading}
                    scroll={{ x: 800 }} // Sesuaikan scroll jika perlu
                />
            </Card>

            {/* Modal */}
            <Modal
                title={ /* ... (Modal title tetap sama) ... */
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
                {/* Gunakan Form Ant Design untuk validasi otomatis */}
                <Form
                    layout="vertical"
                    initialValues={formData} // Set nilai awal form saat edit
                    onValuesChange={(changedValues, allValues) => setFormData(allValues)} // Update state saat form berubah
                >
                    <Form.Item
                        label={<Text strong>Merchant <span style={{color: 'red'}}>*</span></Text>}
                        name="merchantId"
                        rules={[{ required: true, message: 'Silakan pilih merchant!' }]}
                    >
                        <Select
                            placeholder="Pilih merchant"
                            style={{ width: "100%" }}
                            showSearch // Aktifkan pencarian
                            optionFilterProp="children" // Cari berdasarkan teks di dalam Option
                            filterOption={(input, option) =>
                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {tenantsForDropdown.map((tenant) => (
                                <Option key={tenant.id_tenant} value={tenant.id_tenant}>
                                    {tenant.nama_tenant}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label={<Text strong>Nama Kategori <span style={{color: 'red'}}>*</span></Text>}
                        name="nama_kategori"
                        rules={[{ required: true, message: 'Silakan masukkan nama kategori!' }]}
                    >
                        <Input
                            placeholder="Masukkan nama kategori"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ProductKategoriTab;