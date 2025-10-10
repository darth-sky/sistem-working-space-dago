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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  AppstoreOutlined,
  BookOutlined, // Mengganti ikon
} from "@ant-design/icons";

// ⬇️ Mengimpor service yang baru dibuat
import {
  getKategoriRuangan,
  createKategoriRuangan,
  updateKategoriRuangan,
  deleteKategoriRuangan,
} from "../../../../services/service"; // pastikan path import benar

const { Text } = Typography;
const { Search } = Input;
const { TextArea } = Input; // Menggunakan TextArea untuk deskripsi

const RuanganKategoriTab = () => {
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pageSize, setPageSize] = useState(5);

  // 🚀 Fetch data kategori ruangan
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getKategoriRuangan();
      // ✅ Sesuaikan dengan respons API kategori ruangan Anda
      if (res.status === 200 && res.data.message === "OK") {
        const kategori = res.data.datas.map((item, index) => ({
          key: index + 1,
          id_kategori_ruangan: item.id_kategori_ruangan,
          nama_kategori: item.nama_kategori,
          deskripsi: item.deskripsi,
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

  // 🔎 Filter pencarian
  const filteredData = data.filter(
    (item) =>
      item.nama_kategori.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.deskripsi &&
        item.deskripsi.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns = [
    {
      title: "ID Kategori",
      dataIndex: "id_kategori_ruangan",
      key: "id_kategori_ruangan",
      width: 120,
    },
    {
      title: "Nama Kategori Ruangan",
      dataIndex: "nama_kategori",
      key: "nama_kategori",
      render: (text) => (
        <Space>
          <AppstoreOutlined style={{ color: "#1890ff" }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Deskripsi",
      dataIndex: "deskripsi",
      key: "deskripsi",
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
              onConfirm={() => handleDelete(record.id_kategori_ruangan)}
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
  const handleSave = async () => {
    if (!formData.nama_kategori) {
      message.error("Nama Kategori wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nama_kategori: formData.nama_kategori,
        deskripsi: formData.deskripsi,
      };

      if (editingCategory) {
        // Update kategori
        const res = await updateKategoriRuangan(
          editingCategory.id_kategori_ruangan,
          payload
        );
        if (res.status === 200) {
          message.success("Kategori berhasil diperbarui!");
        }
      } else {
        // Tambah kategori
        const res = await createKategoriRuangan(payload);
        if (res.status === 201) {
          message.success("Kategori baru berhasil ditambahkan!");
        }
      }
      await fetchData(); // Refresh tabel
      handleCancel();
    } catch (err) {
      console.error("Error save kategori ruangan:", err);
      message.error("Gagal menyimpan kategori");
    } finally {
      setLoading(false);
    }
  };

  // ❌ Delete kategori (panggil API)
  const handleDelete = async (id_kategori) => {
    setLoading(true);
    try {
      const res = await deleteKategoriRuangan(id_kategori);
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
      nama_kategori: category.nama_kategori,
      deskripsi: category.deskripsi,
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
            placeholder="Cari kategori ruangan..."
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
            // Style bisa disesuaikan lagi
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
            pageSizeOptions: ["5", "10", "50", "100"],
            onShowSizeChange: (current, size) => setPageSize(size),
          }}
          loading={loading}
        />
      </Card>

      {/* Modal */}
      <Modal
        title={
          <Space>
            {editingCategory ? <EditOutlined /> : <PlusOutlined />}
            {editingCategory
              ? "Edit Kategori Ruangan"
              : "Add Kategori Ruangan"}
          </Space>
        }
        open={open}
        onCancel={handleCancel}
        onOk={handleSave}
        confirmLoading={loading}
        okText={editingCategory ? "Update" : "Add"}
      >
        <div style={{ marginTop: '24px' }}>
          <Text strong>
            Nama Kategori <span style={{ color: "red" }}>*</span>
          </Text>
          <Input
            placeholder="Masukkan nama kategori"
            value={formData.nama_kategori || ""}
            onChange={(e) => handleChange("nama_kategori", e.target.value)}
            style={{ marginTop: '8px' }}
          />
        </div>
        <div style={{ marginTop: '16px' }}>
          <Text strong>Deskripsi</Text>
          <TextArea
            rows={4}
            placeholder="Masukkan deskripsi singkat"
            value={formData.deskripsi || ""}
            onChange={(e) => handleChange("deskripsi", e.target.value)}
            style={{ marginTop: '8px' }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default RuanganKategoriTab;