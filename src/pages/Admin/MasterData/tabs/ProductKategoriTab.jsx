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
 *   filters from uniqueValues(data, key)
 *   onFilter uses includes(...) case-insensitive
 *   filterSearch enabled on dropdown
 */

const ProductKategoriTab = () => {
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [tenantsForDropdown, setTenantsForDropdown] = useState([]);
  const [data, setData] = useState([]);
  const [pageSize, setPageSize] = useState(5);

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

  // Kolom tabel: merchant & kategori pakai filter sama seperti ProductTab.jsx
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
      // **SAMA DENGAN ProductTab.jsx**: filter dropdown dari uniqueValues(data,'nama_merchant')
      filters: uniqueValues(data, "nama_merchant"),
      filterSearch: true, // searchable dropdown like typical AntD filter
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
      // **SAMA DENGAN ProductTab.jsx**: filter dropdown dari uniqueValues(data,'nama_kategori')
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

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Add / Update kategori
  const handleAddCategory = async () => {
    if (!formData.merchantId || !formData.nama_kategori) {
      message.error("Mohon lengkapi semua field!");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (editingCategory) {
        res = await updateKategori(editingCategory.id_kategori, {
          nama_kategori: formData.nama_kategori,
          id_tenant: formData.merchantId,
        });
      } else {
        res = await createKategori({
          id_tenant: formData.merchantId,
          nama_kategori: formData.nama_kategori,
        });
      }

      if (res.status === 200 || res.status === 201) {
        message.success(res.data?.message || `Kategori berhasil ${editingCategory ? "diperbarui" : "ditambahkan"}!`);
        await fetchData();
        handleCancel();
      } else {
        message.error(res.data?.error || "Gagal menyimpan kategori.");
      }
    } catch (err) {
      console.error("Error save kategori:", err);
      message.error("Gagal menyimpan kategori: " + (err.message || "Error tidak diketahui"));
    } finally {
      setLoading(false);
    }
  };

  // Delete kategori
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
      <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
        <Col flex="1" />
        <Col flex="none">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpen(true)}
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
        onOk={handleAddCategory}
        confirmLoading={loading}
        okText={editingCategory ? "Update" : "Add"}
        width={600}
      >
        <Form
          layout="vertical"
          initialValues={formData}
          onValuesChange={(changedValues, allValues) => setFormData(allValues)}
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
              onChange={(val) => handleChange("merchantId", val)}
              value={formData.merchantId}
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
              onChange={(e) => handleChange("nama_kategori", e.target.value)}
              value={formData.nama_kategori}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductKategoriTab;
