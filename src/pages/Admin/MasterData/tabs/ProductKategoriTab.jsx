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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  ShopOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  getKategoriTenant,
  createKategori,
  updateKategori,
  deleteKategori,
  getTenantsForDropdown,
} from "../../../../services/service";

const { Text } = Typography;
const { Option } = Select;

/**
 * ProductKategoriTab.jsx
 * - Nama Merchant & Nama Kategori filters behave exactly like ProductTab.jsx:
 * filters from uniqueValues(data, key)
 * onFilter uses includes(...) case-insensitive
 * filterSearch enabled on dropdown
 */

const ProductKategoriTab = () => {
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  // const [formData, setFormData] = useState({}); // <--- HAPUS: State form akan dikelola oleh AntD
  const [loading, setLoading] = useState(false);
  const [tenantsForDropdown, setTenantsForDropdown] = useState([]);
  const [data, setData] = useState([]);
  const [pageSize, setPageSize] = useState(5);
  const [form] = Form.useForm(); // <--- TAMBAH: Buat instance form AntD

  // Ambil nilai unik dari data untuk membuat options filter (text/value)
  const uniqueValues = (arr, key) => {
    return [...new Set(arr.map((item) => item[key]).filter(Boolean))].map((val) => ({
      text: val,
      value: val,
    }));
  };

  // Fetch kategori + mapping
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getKategoriTenant();
      if (res.status === 200 && res.data.message === "OK") {
        const kategori = res.data.datas.map((item, index) => ({
          key: item.id_kategori ?? index + 1,
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

  // Fetch tenants untuk modal dropdown
  const fetchTenants = async () => {
    try {
      const res = await getTenantsForDropdown();
      if (res.status === 200 && res.data?.datas) {
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

  // Kolom tabel: (Tidak ada perubahan di sini)
  const columns = [
    {
      title: "ID Kategori",
      dataIndex: "id_kategori",
      key: "id_kategori",
      width: 120,
      sorter: (a, b) => {
        const ai = Number(a.id_kategori) || 0;
        const bi = Number(b.id_kategori) || 0;
        return ai - bi;
      },
      render: (text) => text ?? "-",
    },
    {
      title: "Nama Merchant",
      dataIndex: "nama_merchant",
      key: "nama_merchant",
      filters: uniqueValues(data, "nama_merchant"),
      filterSearch: true, 
      onFilter: (value, record) =>
        record.nama_merchant ? record.nama_merchant.toLowerCase().includes(value.toLowerCase()) : false,
      render: (text) => (
        <Space>
          <ShopOutlined style={{ color: "#1890ff" }} />
          <Text strong>{text || "N/A"}</Text>
        </Space>
      ),
    },
    {
      title: "Nama Kategori",
      dataIndex: "nama_kategori",
      key: "nama_kategori",
      filters: uniqueValues(data, "nama_kategori"),
      filterSearch: true,
      onFilter: (value, record) =>
        record.nama_kategori ? record.nama_kategori.toLowerCase().includes(value.toLowerCase()) : false,
      render: (text) => (
        <Space>
          <AppstoreOutlined style={{ color: "#52c41a" }} />
          <Text>{text || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      fixed: "right",
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
              disabled={loading}
            >
              <Button type="link" danger icon={<DeleteOutlined />} disabled={loading} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // <--- HAPUS: Fungsi handleChange tidak diperlukan lagi
  // const handleChange = (field, value) => {
  //   setFormData({ ...formData, [field]: value });
  // };

  // Add / Update kategori
  const handleAddCategory = async () => {
    try {
      // <--- UBAH: Gunakan form.validateFields() untuk validasi
      // Ini akan otomatis menampilkan pesan error di form jika gagal
      const values = await form.validateFields();

      setLoading(true);
      let res;
      if (editingCategory) {
        res = await updateKategori(editingCategory.id_kategori, {
          nama_kategori: values.nama_kategori,
          id_tenant: values.merchantId, // 'merchantId' dari name Form.Item
        });
      } else {
        res = await createKategori({
          id_tenant: values.merchantId,
          nama_kategori: values.nama_kategori,
        });
      }

      if (res.status === 200 || res.status === 201) {
        message.success(res.data?.message || `Kategori berhasil ${editingCategory ? "diperbarui" : "ditambahkan"}!`);
        await fetchData();
        handleCancel(); // handleCancel akan menutup modal & reset form
      } else {
        message.error(res.data?.error || "Gagal menyimpan kategori.");
      }
    } catch (validationError) {
      // <--- TAMBAH: Blok catch ini akan menangani jika validasi gagal
      console.log("Validation Failed:", validationError);
      message.warning("Harap isi semua bidang yang wajib diisi.");
    } finally {
      setLoading(false);
    }
  };

  // Delete kategori (Tidak ada perubahan di sini)
  const handleDelete = async (id_kategori) => {
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
      if (err.response?.data?.error && err.response.data.error.includes("foreign key constraint fails")) {
        message.error("Gagal menghapus: Kategori masih digunakan oleh produk.");
      } else {
        message.error("Gagal menghapus kategori: " + (err.message || "Error tidak diketahui"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    // <--- UBAH: Gunakan form.setFieldsValue untuk mengisi form
    form.setFieldsValue({
      merchantId: category.merchantId,
      nama_kategori: category.nama_kategori,
    });
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    // setFormData({}); // <--- HAPUS
    setEditingCategory(null);
    form.resetFields(); // <--- TAMBAH: Reset form & validasinya
  };

  return (
    <div style={{ padding: "24px" }}>
      <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
        <Col flex="1" />
        <Col flex="none">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              // <--- UBAH: Pastikan form di-reset saat menambah baru
              setEditingCategory(null); // Pastikan mode edit mati
              form.resetFields();      // Reset field
              setOpen(true);
            }}
            size="large"
          >
            Tambah Kategori Baru
          </Button>
        </Col>
      </Row>

      <Card style={{ borderRadius: "12px" }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(record) => record.id_kategori ?? record.key}
          pagination={{
            pageSize: pageSize,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ["5", "10", "50", "100"],
            onChange: (page, newPageSize) => setPageSize(newPageSize),
            showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} item`,
          }}
          loading={loading}
          scroll={{ x: 900 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            {editingCategory ? <EditOutlined /> : <PlusOutlined />}
            {editingCategory ? "Edit Category" : "Add New Category"}
          </Space>
        }
        open={open}
        onCancel={handleCancel}
        onOk={handleAddCategory} // <--- onOk akan menjalankan handleAddCategory yg sdh divalidasi
        confirmLoading={loading}
        okText={editingCategory ? "Update" : "Add"}
        width={600}
        destroyOnClose // <--- TAMBAH: Pastikan form dihancurkan saat close
      >
        <Form
          form={form} // <--- TAMBAH: Hubungkan instance form ke komponen Form
          layout="vertical"
          // <--- HAPUS: Properti di bawah ini tidak diperlukan lagi
          // initialValues={formData} 
          // onValuesChange={(changedValues, allValues) => setFormData(allValues)}
        >
          <Form.Item
            label={<Text strong>Merchant <span style={{ color: "red" }}>*</span></Text>}
            name="merchantId"
            rules={[{ required: true, message: "Silakan pilih merchant!" }]}
          >
            <Select
              placeholder="Pilih merchant"
              style={{ width: "100%" }}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => (option?.children ?? "").toLowerCase().includes(input.toLowerCase())}
              // <--- HAPUS: Properti value & onChange
              // onChange={(val) => handleChange("merchantId", val)}
              // value={formData.merchantId}
            >
              {tenantsForDropdown.map((tenant) => (
                <Option key={tenant.id_tenant} value={tenant.id_tenant}>
                  {tenant.nama_tenant}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={<Text strong>Nama Kategori <span style={{ color: "red" }}>*</span></Text>}
            name="nama_kategori"
            rules={[{ required: true, message: "Silakan masukkan nama kategori!" }]}
          >
            <Input
              placeholder="Masukkan nama kategori"
              // <--- HAPUS: Properti value & onChange
              // onChange={(e) => handleChange("nama_kategori", e.target.value)}
              // value={formData.nama_kategori}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductKategoriTab;