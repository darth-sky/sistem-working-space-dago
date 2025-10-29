// PromoTab.js

import React, { useState, useEffect } from "react";
import {
  Table, Button, Modal, Input, Typography, Row, Col, Card, Space, message,
  Popconfirm, Tooltip, InputNumber, DatePicker, TimePicker, Tag, Switch
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getPromoAdmin, createPromo, updatePromo, deletePromo
} from "../../../../services/service";

const { Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const PromoTab = () => {
  const [open, setOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pageSize, setPageSize] = useState(5);
  const [filteredInfo, setFilteredInfo] = useState({});

  // Fetch data dari API
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getPromoAdmin();
      if (res.status === 200 && res.data.message === "OK") {
        const promos = res.data.datas.map((item) => ({
          key: item.id_promo,
          ...item,
        }));
        setData(promos);
      }
    } catch (err) {
      console.error("Gagal fetch promo:", err);
      message.error("Gagal mengambil data promo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // === Search Global ===
  const filteredData = data.filter(
    (item) =>
      item.kode_promo?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.deskripsi_promo?.toLowerCase().includes(searchText.toLowerCase())
  );

  // === Search Input di Kolom ===
  const getColumnSearchProps = (dataIndex, placeholder = "Cari...") => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={placeholder}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ width: 188, marginBottom: 8, display: "block" }}
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
            onClick={() => {
              clearFilters();
              confirm({ closeDropdown: true });
            }}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    onFilter: (value, record) =>
      record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase()),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
  });

  // === Kolom Tabel ===
  const columns = [
    { title: "ID", dataIndex: "id_promo", key: "id_promo", width: 60 },
    {
      title: "Kode Promo",
      dataIndex: "kode_promo",
      key: "kode_promo",
      render: (text) => <Text strong>{text}</Text>,
      ...getColumnSearchProps("kode_promo", "Cari kode promo..."),
    },
    {
      title: "Deskripsi",
      dataIndex: "deskripsi_promo",
      key: "deskripsi_promo",
      ...getColumnSearchProps("deskripsi_promo", "Cari deskripsi..."),
    },
    {
      title: "Nilai Diskon",
      dataIndex: "nilai_diskon",
      key: "nilai_diskon",
      sorter: (a, b) => a.nilai_diskon - b.nilai_diskon,
      render: (val) =>
        val.toLocaleString("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }),
    },
    {
      title: "Tanggal Berlaku",
      key: "tanggal",
      render: (_, record) =>
        `${dayjs(record.tanggal_mulai).format("DD/MM/YYYY")} - ${dayjs(
          record.tanggal_selesai
        ).format("DD/MM/YYYY")}`,
      sorter: (a, b) => dayjs(a.tanggal_mulai).unix() - dayjs(b.tanggal_mulai).unix(),
    },
    {
      title: "Status",
      dataIndex: "status_aktif",
      key: "status_aktif",
      filters: [
        { text: "Aktif", value: "aktif" },
        { text: "Inaktif", value: "inaktif" },
      ],
      filteredValue: filteredInfo.status_aktif || null,
      onFilter: (value, record) => record.status_aktif === value,
      render: (status) => (
        <Tag color={status === "aktif" ? "green" : "red"}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Promo">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Promo">
            <Popconfirm
              title="Hapus Promo"
              description="Yakin ingin menghapus promo ini?"
              onConfirm={() => handleDelete(record.id_promo)}
              okText="Ya"
              cancelText="Tidak"
            >
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // === Handler Tabel (Filter/Sort) ===
  const handleTableChange = (pagination, filters) => {
    setFilteredInfo(filters);
  };

  // === Input Handler ===
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDateChange = (dates, dateStrings) => {
    setFormData({
      ...formData,
      tanggal_mulai: dateStrings[0],
      tanggal_selesai: dateStrings[1],
    });
  };

  const handleTimeChange = (times, timeStrings) => {
    setFormData({
      ...formData,
      waktu_mulai: timeStrings[0] || null,
      waktu_selesai: timeStrings[1] || null,
    });
  };

  // === CRUD Actions ===
  const handleSave = async () => {
    if (!formData.kode_promo || !formData.nilai_diskon || !formData.tanggal_mulai) {
      message.error("Field dengan tanda * wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        waktu_mulai: formData.waktu_mulai || null,
        waktu_selesai: formData.waktu_selesai || null,
      };

      if (editingPromo) {
        const res = await updatePromo(editingPromo.id_promo, payload);
        if (res.status === 200) message.success("Promo berhasil diperbarui!");
      } else {
        const res = await createPromo(payload);
        if (res.status === 201) message.success("Promo baru berhasil ditambahkan!");
      }
      await fetchData();
      handleCancel();
    } catch (err) {
      console.error("Error save promo:", err);
      message.error("Gagal menyimpan promo");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id_promo) => {
    setLoading(true);
    try {
      const res = await deletePromo(id_promo);
      if (res.status === 200) {
        message.success("Promo berhasil dihapus!");
        await fetchData();
      } else {
        message.error(res.data?.error || "Gagal menghapus promo");
      }
    } catch (err) {
      console.error("Error delete promo:", err);
      message.error("Gagal menghapus promo");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData(promo);
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    setFormData({});
    setEditingPromo(null);
  };

  // Nilai default untuk Date/Time Picker
  const dateRangeValue =
    formData.tanggal_mulai && formData.tanggal_selesai
      ? [dayjs(formData.tanggal_mulai), dayjs(formData.tanggal_selesai)]
      : null;

  const timeRangeValue =
    formData.waktu_mulai && formData.waktu_selesai
      ? [
          dayjs(formData.waktu_mulai, "HH:mm:ss"),
          dayjs(formData.waktu_selesai, "HH:mm:ss"),
        ]
      : null;

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
            placeholder="Cari promo..."
            allowClear
            enterButton
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="large"
          />
        </Col>
        <Col flex="none">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpen(true)}
            size="large"
          >
            Tambah Promo Baru
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
            pageSizeOptions: ["5", "10", "50", "100"],
            onShowSizeChange: (c, size) => setPageSize(size),
          }}
          loading={loading}
          scroll={{ x: 1000 }}
          onChange={handleTableChange}
        />
      </Card>

      {/* === MODAL FORM === */}
      <Modal
        title={
          <Space>
            {editingPromo ? <EditOutlined /> : <PlusOutlined />}
            {editingPromo ? "Edit Promo" : "Tambah Promo Baru"}
          </Space>
        }
        open={open}
        onCancel={handleCancel}
        onOk={handleSave}
        confirmLoading={loading}
        okText={editingPromo ? "Update" : "Simpan"}
        width={600}
      >
        <div style={{ marginTop: "24px" }}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>
                Kode Promo <span style={{ color: "red" }}>*</span>
              </Text>
              <Input
                placeholder="cth: SARAPANHEMAT"
                value={formData.kode_promo || ""}
                onChange={(e) =>
                  handleChange("kode_promo", e.target.value.toUpperCase())
                }
                style={{ marginTop: "8px" }}
              />
            </Col>
            <Col span={12}>
              <Text strong>
                Nilai Diskon (Rp) <span style={{ color: "red" }}>*</span>
              </Text>
              <InputNumber
                placeholder="cth: 5000"
                value={formData.nilai_diskon}
                onChange={(value) => handleChange("nilai_diskon", value)}
                style={{ marginTop: "8px", width: "100%" }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              />
            </Col>
          </Row>
          <div style={{ marginTop: "16px" }}>
            <Text strong>Deskripsi</Text>
            <TextArea
              rows={3}
              placeholder="Masukkan deskripsi singkat promo"
              value={formData.deskripsi_promo || ""}
              onChange={(e) =>
                handleChange("deskripsi_promo", e.target.value)
              }
              style={{ marginTop: "8px" }}
            />
          </div>
          <div style={{ marginTop: "16px" }}>
            <Text strong>
              Tanggal Berlaku <span style={{ color: "red" }}>*</span>
            </Text>
            <RangePicker
              style={{ marginTop: "8px", width: "100%" }}
              onChange={handleDateChange}
              value={dateRangeValue}
              format="YYYY-MM-DD"
            />
          </div>
          <div style={{ marginTop: "16px" }}>
            <Text strong>Waktu Berlaku (Opsional)</Text>
            <TimePicker.RangePicker
              style={{ marginTop: "8px", width: "100%" }}
              onChange={handleTimeChange}
              value={timeRangeValue}
              format="HH:mm:ss"
            />
          </div>
          <div style={{ marginTop: "16px" }}>
            <Text strong>
              Status <span style={{ color: "red" }}>*</span>
            </Text>
            <Switch
              checkedChildren="Aktif"
              unCheckedChildren="Inaktif"
              checked={formData.status_aktif === "aktif"}
              onChange={(checked) =>
                handleChange("status_aktif", checked ? "aktif" : "inaktif")
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PromoTab;
