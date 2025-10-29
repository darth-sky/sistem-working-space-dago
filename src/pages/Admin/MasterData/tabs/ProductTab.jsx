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
  Upload,
  InputNumber,
  Switch,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ShoppingOutlined,
  FileImageOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  getProduk,
  createProduk,
  updateProduk,
  deleteProduk,
  getKategoriTenant,
} from "../../../../services/service";

const { Text } = Typography;
const { Option } = Select;
const { Search, TextArea } = Input;

const ProductTab = () => {
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [formData, setFormData] = useState({});
  const [fileFoto, setFileFoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pageSize, setPageSize] = useState(5);

  const [kategoriList, setKategoriList] = useState([]);
  const [tenantList, setTenantList] = useState([]);
  const [filteredKategoriList, setFilteredKategoriList] = useState([]);

  // 🚀 Fetch data produk
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getProduk();
      if (res.status === 200 && res.data.message === "OK") {
        const produk = res.data.datas.map((item, index) => ({
          key: index + 1,
          ...item,
        }));
        setData(produk);
      }

      const resKategori = await getKategoriTenant();
      if (resKategori.status === 200 && resKategori.data.message === "OK") {
        const allKategori = resKategori.data.datas.map((item) => ({
          id: item.id_kategori,
          nama: item.nama_kategori,
          tenant: item.nama_tenant,
          id_tenant: item.id_tenant,
        }));
        setKategoriList(allKategori);

        const uniqueTenants = allKategori.reduce((acc, current) => {
          if (!acc.find((item) => item.id_tenant === current.id_tenant)) {
            acc.push({ id_tenant: current.id_tenant, nama_tenant: current.tenant });
          }
          return acc;
        }, []);
        setTenantList(uniqueTenants);
      }
    } catch (err) {
      console.error("Gagal fetch data:", err);
      message.error("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.id_tenant) {
      const filtered = kategoriList.filter((k) => k.id_tenant === formData.id_tenant);
      setFilteredKategoriList(filtered);
    } else {
      setFilteredKategoriList([]);
    }
  }, [formData.id_tenant, kategoriList]);

  // 🔎 Filter pencarian global
  const filteredData = data.filter(
    (item) =>
      item.nama_produk.toLowerCase().includes(searchText.toLowerCase()) ||
      item.nama_kategori.toLowerCase().includes(searchText.toLowerCase())
  );

  // --- 🔽 FILTER PER KOLOM TABLE ---
  const uniqueValues = (arr, key) => {
    return [...new Set(arr.map((item) => item[key]).filter(Boolean))].map((val) => ({
      text: val,
      value: val,
    }));
  };

  const columns = [
    {
      title: "Nama Produk",
      dataIndex: "nama_produk",
      key: "nama_produk",
      filters: uniqueValues(data, "nama_produk"),
      onFilter: (value, record) =>
        record.nama_produk.toLowerCase().includes(value.toLowerCase()),
      render: (text) => (
        <Space>
          <ShoppingOutlined style={{ color: "#1890ff" }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Kategori",
      dataIndex: "nama_kategori",
      key: "kategori_info",
      filters: uniqueValues(data, "nama_kategori"),
      onFilter: (value, record) =>
        record.nama_kategori.toLowerCase().includes(value.toLowerCase()),
      render: (_, record) => (
        <div>
          <Text strong>{record.nama_kategori}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.nama_tenant || "N/A"}
          </Text>
        </div>
      ),
    },
    {
      title: "Harga",
      dataIndex: "harga",
      key: "harga",
      sorter: (a, b) => a.harga - b.harga,
      render: (harga) => `Rp ${Number(harga).toLocaleString("id-ID")}`,
    },
    {
      title: "Status",
      dataIndex: "status_ketersediaan",
      key: "status_ketersediaan",
      filters: [
        { text: "Active", value: "Active" },
        { text: "Inactive", value: "Inactive" },
      ],
      onFilter: (value, record) => record.status_ketersediaan === value,
      render: (status) =>
        status === "Active" ? (
          <Text type="success">Active</Text>
        ) : (
          <Text type="danger">Inactive</Text>
        ),
    },
    {
      title: "Deskripsi",
      dataIndex: "deskripsi_produk",
      key: "deskripsi_produk",
      render: (text) => <Text>{text || "-"}</Text>,
    },
    {
      title: "Foto",
      dataIndex: "foto_produk",
      key: "foto_produk",
      render: (url) =>
        url ? (
          <img
            src={`${import.meta.env.VITE_BASE_URL}/static/${url}`}
            alt="produk"
            style={{ width: 50, borderRadius: 8 }}
          />
        ) : (
          <FileImageOutlined />
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Produk">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ color: "#1890ff" }}
            />
          </Tooltip>
          <Tooltip title="Delete Produk">
            <Popconfirm
              title="Delete Produk"
              description="Yakin ingin menghapus produk ini?"
              onConfirm={() => handleDelete(record.id_produk)}
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

  // --- Form Handler ---
  const handleChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    if (field === "id_tenant") {
      delete newFormData.id_kategori;
    }
    setFormData(newFormData);
  };

  const handleAddProduct = async () => {
    if (!formData.nama_produk || !formData.id_kategori || !formData.harga) {
      message.error("Mohon lengkapi semua field wajib!");
      return;
    }

    setLoading(true);
    try {
      const formPayload = new FormData();
      formPayload.append("nama_produk", formData.nama_produk);
      formPayload.append("deskripsi_produk", formData.deskripsi_produk || "");
      formPayload.append("harga", formData.harga);
      formPayload.append(
        "status_ketersediaan",
        formData.status_ketersediaan || "Active"
      );
      formPayload.append("id_kategori", formData.id_kategori);

      if (fileFoto) formPayload.append("foto_produk", fileFoto);

      let res;
      if (editingProduct) {
        res = await updateProduk(editingProduct.id_produk, formPayload);
        if (res.status === 200) message.success("Produk berhasil diperbarui!");
      } else {
        res = await createProduk(formPayload);
        if (res.status === 201) message.success("Produk baru berhasil ditambahkan!");
      }

      await fetchData();
      handleCancel();
    } catch (err) {
      console.error("Error save produk:", err);
      message.error("Gagal menyimpan produk");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id_produk) => {
    setLoading(true);
    try {
      const res = await deleteProduk(id_produk);
      if (res.status === 200) {
        message.success("Produk berhasil dihapus!");
        await fetchData();
      } else {
        message.error("Gagal menghapus produk");
      }
    } catch (err) {
      console.error("Error delete produk:", err);
      message.error("Gagal menghapus produk");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    const kategoriProduk = kategoriList.find((k) => k.id === product.id_kategori);
    setEditingProduct(product);
    setFormData({
      id_tenant: kategoriProduk ? kategoriProduk.id_tenant : null,
      id_kategori: product.id_kategori,
      nama_produk: product.nama_produk,
      deskripsi_produk: product.deskripsi_produk,
      harga: product.harga,
      status_ketersediaan: product.status_ketersediaan,
    });
    setFileFoto(null);
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    setFormData({});
    setEditingProduct(null);
    setFileFoto(null);
  };

  return (
    <div style={{ padding: "24px" }}>
      <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
        <Col flex="1">
          <Search
            placeholder="Cari produk..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
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
            Add New Product
          </Button>
        </Col>
      </Row>

      <Card style={{ borderRadius: "12px" }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{
            pageSize,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (page, newSize) => setPageSize(newSize),
          }}
          loading={loading}
        />
      </Card>
      {/* Modal Form Produk */}
      <Modal
        title={
          <Space>
            {editingProduct ? <EditOutlined /> : <PlusOutlined />}
            {editingProduct ? "Edit Product" : "Add New Product"}
          </Space>
        }
        open={open}
        onCancel={handleCancel}
        onOk={handleAddProduct}
        confirmLoading={loading}
        okText={editingProduct ? "Update" : "Add"}
        width={800}
      >
        <Row gutter={[20, 20]}>
          <Col span={12}>
            <Text strong>Tenant *</Text>
            <Select
              placeholder="Pilih tenant"
              value={formData.id_tenant}
              onChange={(val) => handleChange("id_tenant", val)}
              style={{ width: "100%", marginBottom: 16 }}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {tenantList.map((t) => (
                <Option key={t.id_tenant} value={t.id_tenant}>
                  {t.nama_tenant}
                </Option>
              ))}
            </Select>

            <Text strong>Kategori *</Text>
            <Select
              placeholder="Pilih kategori"
              value={formData.id_kategori}
              onChange={(val) => handleChange("id_kategori", val)}
              style={{ width: "100%", marginBottom: 16 }}
              disabled={!formData.id_tenant}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {filteredKategoriList.map((k) => (
                <Option key={k.id} value={k.id}>
                  {k.nama}
                </Option>
              ))}
            </Select>

            <Text strong>Nama Produk *</Text>
            <Input
              placeholder="Masukkan nama produk"
              value={formData.nama_produk || ""}
              onChange={(e) => handleChange("nama_produk", e.target.value)}
              style={{ marginBottom: 16 }}
            />

            <Text strong>Harga *</Text>
            <InputNumber
              controls={false}
              placeholder="Masukkan harga"
              value={formData.harga || 0}
              onChange={(val) => handleChange("harga", val)}
              style={{ width: "100%", marginBottom: 16 }}
            />

            <Text strong>Status</Text>
            <Switch
              checked={formData.status_ketersediaan === "Active"}
              onChange={(checked) =>
                handleChange("status_ketersediaan", checked ? "Active" : "Inactive")
              }
              checkedChildren="Active"
              unCheckedChildren="Inactive"
              style={{ display: "block", marginTop: 8 }}
            />
          </Col>

          <Col span={12}>
            <Text strong>Deskripsi</Text>
            <TextArea
              rows={6}
              placeholder="Masukkan deskripsi produk"
              value={formData.deskripsi_produk || ""}
              onChange={(e) => handleChange("deskripsi_produk", e.target.value)}
              style={{ marginBottom: 16 }}
            />

            <Text strong>Foto Produk</Text>
            <Upload
              beforeUpload={(file) => {
                setFileFoto(file);
                return false;
              }}
              maxCount={1}
              accept="image/*"
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>Upload Foto</Button>
            </Upload>
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default ProductTab;
