import React, { useState, useEffect } from "react";
import {
  Table, Button, Modal, Input, Typography, Row, Col, Card, Space,
  Select, message, Popconfirm, Tooltip, Upload, InputNumber, Switch,
  Tag, List, Divider, Image
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, SearchOutlined } from "@ant-design/icons";
import {
  getRuangan, createRuangan, updateRuangan, deleteRuangan,
  getKategoriRuangan, getPaketHargaByRuangan,
  addPaketHarga, deletePaketHarga, updatePaketHarga
} from "../../../../services/service";

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea, Search } = Input;

const initialFormData = {
  nama_ruangan: "",
  id_kategori_ruangan: null,
  harga_per_jam: 0,
  kapasitas: 1,
  deskripsi_ruangan: "",
  fitur_ruangan: "",
  status_ketersediaan: "Active",
};

const RuanganTab = () => {
  const [data, setData] = useState([]);
  const [kategoriRuanganList, setKategoriRuanganList] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingRuangan, setEditingRuangan] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [fileGambar, setFileGambar] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [pageSize, setPageSize] = useState(5);

  const [paketHargaList, setPaketHargaList] = useState([]);
  const [newPaket, setNewPaket] = useState({ durasi_jam: "", harga_paket: "" });
  const [editingPaket, setEditingPaket] = useState(null);

  // === Ambil Data dari Backend ===
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRuangan, resKategori] = await Promise.all([
        getRuangan(),
        getKategoriRuangan(),
      ]);
      if (resRuangan.status === 200) {
        setData(resRuangan.data.datas.map((item) => ({ ...item, key: item.id_ruangan })));
      }
      if (resKategori.status === 200) {
        setKategoriRuanganList(resKategori.data.datas);
      }
    } catch (err) {
      message.error("Gagal mengambil data dari server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchPaketHarga = async (id_ruangan) => {
    try {
      const res = await getPaketHargaByRuangan(id_ruangan);
      setPaketHargaList(res.data.datas || []);
    } catch {
      message.error("Gagal mengambil data paket harga");
    }
  };

  // === Modal Tambah/Edit ===
  const handleOpenModal = (ruangan = null) => {
    if (ruangan) {
      setEditingRuangan(ruangan);
      setFormData(ruangan);
      fetchPaketHarga(ruangan.id_ruangan);
    } else {
      setEditingRuangan(null);
      setFormData(initialFormData);
    }
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    setEditingRuangan(null);
    setFormData(initialFormData);
    setFileGambar(null);
    setPaketHargaList([]);
    setNewPaket({ durasi_jam: "", harga_paket: "" });
  };

  const handleChange = (field, value) => setFormData({ ...formData, [field]: value });

  const handleAddOrUpdateRuangan = async () => {
    const formPayload = new FormData();
    for (const key in formData) {
      if (formData[key] !== null) formPayload.append(key, formData[key]);
    }
    if (fileGambar) formPayload.append("gambar_ruangan", fileGambar);

    setLoading(true);
    try {
      if (editingRuangan) {
        await updateRuangan(editingRuangan.id_ruangan, formPayload);
        message.success("Ruangan berhasil diperbarui!");
      } else {
        await createRuangan(formPayload);
        message.success("Ruangan baru berhasil ditambahkan!");
      }
      fetchData();
      handleCancel();
    } catch {
      message.error("Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRuangan(id);
      message.success("Ruangan dihapus!");
      fetchData();
    } catch {
      message.error("Gagal hapus ruangan");
    }
  };

  // === Logika Paket Harga ===
  const handleSavePaket = async () => {
    if (!newPaket.durasi_jam || !newPaket.harga_paket) {
      return message.warning("Durasi & harga wajib diisi!");
    }
    try {
      if (editingPaket) {
        await updatePaketHarga(editingPaket.id_paket, newPaket);
        message.success("Paket diperbarui!");
      } else {
        await addPaketHarga({ ...newPaket, id_ruangan: editingRuangan.id_ruangan });
        message.success("Paket baru ditambahkan!");
      }
      fetchPaketHarga(editingRuangan.id_ruangan);
      setEditingPaket(null);
      setNewPaket({ durasi_jam: "", harga_paket: "" });
    } catch {
      message.error("Gagal simpan paket");
    }
  };

  const handleDeletePaket = async (id_paket) => {
    try {
      await deletePaketHarga(id_paket);
      message.success("Paket dihapus!");
      fetchPaketHarga(editingRuangan.id_ruangan);
    } catch {
      message.error("Gagal hapus paket");
    }
  };

  // === Filter di Tiap Kolom ===
  const getColumnSearchProps = (dataIndex, placeholder) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Cari ${placeholder}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Cari
          </Button>
          <Button
            onClick={() => clearFilters && clearFilters()}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : "",
  });

  const columns = [
    {
      title: "Gambar",
      dataIndex: "gambar_ruangan",
      key: "gambar_ruangan",
      width: 100,
      render: (gambar) => (
        <Image
          width={60}
          src={
            gambar
              ? `${import.meta.env.VITE_BASE_URL}/static/${gambar}`
              : "https://via.placeholder.com/100?text=No+Image"
          }
        />
      ),
    },
    {
      title: "Nama Ruangan",
      dataIndex: "nama_ruangan",
      key: "nama_ruangan",
      ...getColumnSearchProps("nama_ruangan", "Nama Ruangan"),
    },
    {
      title: "Kategori",
      dataIndex: "nama_kategori",
      key: "nama_kategori",
      filters: kategoriRuanganList.map((k) => ({
        text: k.nama_kategori,
        value: k.nama_kategori,
      })),
      onFilter: (value, record) => record.nama_kategori === value,
    },
    {
      title: "Kapasitas",
      dataIndex: "kapasitas",
      key: "kapasitas",
      sorter: (a, b) => a.kapasitas - b.kapasitas,
      ...getColumnSearchProps("kapasitas", "Kapasitas"),
      render: (val) => `${val} org`,
    },
    {
      title: "Harga per Jam",
      dataIndex: "harga_per_jam",
      key: "harga_per_jam",
      sorter: (a, b) => a.harga_per_jam - b.harga_per_jam,
      render: (harga) =>
        harga > 0 ? `Rp ${harga.toLocaleString("id-ID")}` : <Tag>Gratis</Tag>,
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
      render: (status) => (
        <Tag color={status === "Active" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Ruangan">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Yakin hapus ruangan ini?"
            onConfirm={() => handleDelete(record.id_ruangan)}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // === Render ===
  return (
    <div style={{ padding: "24px" }}>
      <Row gutter={[16, 16]} justify="space-between" style={{ marginBottom: 24 }}>
        <Col flex="1">
          <Search
            placeholder="Cari nama atau kategori ruangan..."
            size="large"
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Col>
        <Col flex="none">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            size="large"
          >
            Tambah Ruangan Baru
          </Button>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={data.filter(
            (item) =>
              item.nama_ruangan.toLowerCase().includes(searchText.toLowerCase()) ||
              item.nama_kategori.toLowerCase().includes(searchText.toLowerCase())
          )}
          loading={loading}
          pagination={{
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50"],
            onShowSizeChange: (c, size) => setPageSize(size),
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* === MODAL TAMBAH/EDIT RUANGAN === */}
      <Modal
        title={<Title level={4}>{editingRuangan ? "Edit Ruangan" : "Tambah Ruangan Baru"}</Title>}
        open={open}
        onCancel={handleCancel}
        width={850}
        destroyOnClose
        footer={[
          <Button key="cancel" onClick={handleCancel}>Batal</Button>,
          <Button key="save" type="primary" onClick={handleAddOrUpdateRuangan} loading={loading}>
            Simpan
          </Button>,
        ]}
      >
        {/* Isi form seperti sebelumnya */}
        {/* ... (form yang kamu punya sebelumnya tetap digunakan di sini) ... */}
      </Modal>
    </div>
  );
};

export default RuanganTab;
