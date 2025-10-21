import React, { useState, useEffect, useCallback } from "react";
import {
  ConfigProvider,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Space,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  SearchOutlined,
  DollarOutlined,
  BarChartOutlined,
  WifiOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  ToolOutlined,
  ShoppingOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import locale from "antd/locale/id_ID";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "../../../services/service";

const { Option } = Select;
const { TextArea } = Input;

// Kategori pengeluaran
const CATEGORIES = [
  { value: "wifi", label: "Internet/WiFi", color: "blue", icon: <WifiOutlined /> },
  { value: "listrik", label: "Listrik", color: "orange", icon: <ThunderboltOutlined /> },
  { value: "air", label: "Air", color: "orange", icon: <ThunderboltOutlined /> },
  { value: "gaji", label: "Gaji Staff", color: "green", icon: <TeamOutlined /> },
  { value: "kebersihan", label: "Kebersihan", color: "purple", icon: <ShoppingOutlined /> },
  { value: "office", label: "Belanja Office", color: "cyan", icon: <ShoppingOutlined /> },
  { value: "maintenance", label: "Maintenance", color: "red", icon: <ToolOutlined /> },
  { value: "lainnya", label: "Lain-lain", color: "default", icon: <MoreOutlined /> },
];

// Format Rupiah
const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);



const CostBulanan = () => {
  dayjs.locale("id");

  // <-- MODIFIKASI: State 'expenses' diawali dengan array kosong
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true); // <-- BARU: State untuk loading indicator
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  // <-- BARU: Fungsi untuk mengambil data dari API, dibungkus dengan useCallback
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExpenses(selectedMonth, selectedYear);
      setExpenses(data);
    } catch (error) {
      message.error(error.message || "Gagal memuat data dari server.");
      setExpenses([]); // Kosongkan data jika terjadi error
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  // <-- MODIFIKASI: useEffect ini sekarang memanggil API saat filter berubah
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);


  // Filter expenses
  // <-- MODIFIKASI: useEffect ini sekarang hanya untuk filter pencarian teks (client-side)
  useEffect(() => {
    const filtered = expenses.filter((expense) => {
      const matchSearch =
        expense.deskripsi.toLowerCase().includes(searchText.toLowerCase()) ||
        expense.kategori.toLowerCase().includes(searchText.toLowerCase());
      return matchSearch;
    });
    setFilteredExpenses(filtered);
  }, [expenses, searchText]);

  const totalExpense = filteredExpenses.reduce((sum, expense) => sum + expense.jumlah, 0);

  const statsPerCategory = CATEGORIES.map((cat) => {
    const total = filteredExpenses
      .filter((exp) => exp.kategori === cat.value)
      .reduce((sum, exp) => sum + exp.jumlah, 0);
    return { ...cat, total };
  }).filter((cat) => cat.total > 0);

  const showModal = (expense = null) => {
    setEditingExpense(expense);
    if (expense) {
      form.setFieldsValue({
        ...expense,
        tanggal: dayjs(expense.tanggal),
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingExpense(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    const expenseData = {
      tanggal: values.tanggal.format("YYYY-MM-DD"),
      kategori: values.kategori,
      deskripsi: values.deskripsi,
      jumlah: parseInt(values.jumlah.toString().replace(/[^\d]/g, "")),
    };

    try {
      if (editingExpense) {
        // Proses UPDATE
        const response = await updateExpense(editingExpense.id, expenseData);
        if (response.status === 200) {
          message.success("Pengeluaran berhasil diperbarui!");
        } else {
          throw new Error(response.data.error || "Gagal memperbarui pengeluaran.");
        }
      } else {
        // Proses CREATE
        const response = await createExpense(expenseData);
        if (response.status === 201) {
          message.success("Pengeluaran berhasil ditambahkan!");
        } else {
          throw new Error(response.data.error || "Gagal menambahkan pengeluaran.");
        }
      }
      handleCancel();
      fetchExpenses(); // <-- PENTING: Muat ulang data dari server setelah berhasil
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await deleteExpense(id);
      if (response.status === 200) {
        message.success("Pengeluaran berhasil dihapus!");
        fetchExpenses(); // <-- PENTING: Muat ulang data dari server setelah berhasil
      } else {
        throw new Error(response.data.error || "Gagal menghapus pengeluaran.");
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleExport = () => {
    const header = "No,Tanggal,Kategori,Deskripsi,Jumlah\n";
    const csvContent = filteredExpenses.map((exp, idx) => {
      const category = CATEGORIES.find((c) => c.value === exp.kategori)?.label || exp.kategori;
      return `${idx + 1},${exp.tanggal},${category},${exp.deskripsi},${exp.jumlah}`;
    }).join("\n");

    const blob = new Blob([header + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pengeluaran_${selectedMonth}_${selectedYear}.csv`;
    link.click();
    message.success("Data berhasil diexport!");
  };

  const getCategoryInfo = (value) => {
    return CATEGORIES.find((c) => c.value === value) || { label: value, color: "default", icon: <MoreOutlined /> };
  };

  const columns = [
    {
      title: "No",
      key: "no",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Tanggal",
      dataIndex: "tanggal",
      key: "tanggal",
      width: 120,
      render: (text) => dayjs(text).format("DD MMM YYYY"),
      sorter: (a, b) => dayjs(a.tanggal).unix() - dayjs(b.tanggal).unix(),
    },
    {
      title: "Kategori",
      dataIndex: "kategori",
      key: "kategori",
      width: 150,
      render: (kategori) => {
        const catInfo = getCategoryInfo(kategori);
        return (
          <Tag color={catInfo.color} icon={catInfo.icon}>
            {catInfo.label}
          </Tag>
        );
      },
      filters: CATEGORIES.map((cat) => ({ text: cat.label, value: cat.value })),
      onFilter: (value, record) => record.kategori === value,
    },
    {
      title: "Deskripsi",
      dataIndex: "deskripsi",
      key: "deskripsi",
      ellipsis: true,
    },
    {
      title: "Jumlah",
      dataIndex: "jumlah",
      key: "jumlah",
      width: 150,
      render: (jumlah) => (
        <span style={{ fontWeight: 600, color: '#262626' }}>{formatRupiah(jumlah)}</span>
      ),
      sorter: (a, b) => a.jumlah - b.jumlah,
    },
    {
      title: "Aksi",
      key: "aksi",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => showModal(record)}
          />
          <Popconfirm
            title="Hapus pengeluaran ini?"
            description="Data yang dihapus tidak dapat dikembalikan."
            onConfirm={() => handleDelete(record.id)}
            okText="Hapus"
            cancelText="Batal"
            okButtonProps={{ danger: true }}
          >
            <Button type="primary" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider locale={locale}>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Manajemen Pengeluaran Bulanan
          </h1>
          <p className="text-gray-600">
            Kelola dan pantau pengeluaran operasional Dago Creative Hub
          </p>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={8}>
            <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500">
              <Statistic
                title={`Total Pengeluaran (${dayjs().month(selectedMonth - 1).format("MMMM")} ${selectedYear})`}
                value={totalExpense}
                precision={0}
                formatter={(value) => formatRupiah(value)}
                prefix={<DollarOutlined style={{ color: '#1677ff' }} />}
                valueStyle={{ color: "#1677ff", fontWeight: "bold" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500">
              <Statistic
                title="Total Transaksi"
                value={filteredExpenses.length}
                suffix="transaksi"
                prefix={<BarChartOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-purple-500">
              <Statistic
                title="Rata-rata Pengeluaran"
                value={filteredExpenses.length > 0 ? totalExpense / filteredExpenses.length : 0}
                precision={0}
                formatter={(value) => formatRupiah(value)}
                valueStyle={{ color: "#722ed1", fontWeight: "bold" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Category Breakdown */}
        {statsPerCategory.length > 0 && (
          <Card className="mb-6 shadow-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChartOutlined style={{ color: '#1677ff' }} />
              Pengeluaran Per Kategori
            </h3>
            <Row gutter={[16, 16]}>
              {statsPerCategory.map((cat) => (
                <Col xs={12} sm={8} lg={6} key={cat.value}>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <Tag color={cat.color} icon={cat.icon} className="mb-2">
                      {cat.label}
                    </Tag>
                    <div className="text-lg font-bold text-gray-800">
                      {formatRupiah(cat.total)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {((cat.total / totalExpense) * 100).toFixed(1)}% dari total
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {/* Filters & Actions */}
        <Card className="mb-6 shadow-md">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Space wrap>
              <Select
                value={selectedMonth}
                onChange={setSelectedMonth}
                style={{ width: 150 }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <Option key={i + 1} value={i + 1}>
                    {dayjs().month(i).format("MMMM")}
                  </Option>
                ))}
              </Select>
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                style={{ width: 120 }}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = dayjs().year() - 2 + i;
                  return (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  );
                })}
              </Select>
              <Input
                placeholder="Cari deskripsi atau kategori..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
            </Space>
            <Space wrap>
              <Button
                type="default"
                icon={<FileExcelOutlined />}
                onClick={handleExport}
                className="bg-green-50 border-green-500 text-green-600 hover:bg-green-100"
              >
                Export Excel
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => showModal()}
                size="large"
              >
                Tambah Pengeluaran
              </Button>
            </Space>
          </div>
        </Card>

        {/* Table */}
        <Card className="shadow-md">
          <Table
            loading={loading}
            columns={columns}
            dataSource={filteredExpenses}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} transaksi`,
            }}
            scroll={{ x: 800 }}
            summary={() => (
              <Table.Summary>
                <Table.Summary.Row className="bg-blue-50 font-bold">
                  <Table.Summary.Cell index={0} colSpan={4} className="text-right">
                    <span className="text-gray-800 text-base font-bold">TOTAL</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <span className="text-blue-600 text-lg font-bold">
                      {formatRupiah(totalExpense)}
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>

        {/* Modal Form */}
        <Modal
          title={
            <span className="text-lg font-bold">
              {editingExpense ? "Edit Pengeluaran" : "Tambah Pengeluaran Baru"}
            </span>
          }
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              tanggal: dayjs(),
            }}
          >
            <Form.Item
              label="Tanggal"
              name="tanggal"
              rules={[{ required: true, message: "Pilih tanggal pengeluaran" }]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                placeholder="Pilih tanggal"
              />
            </Form.Item>

            <Form.Item
              label="Kategori"
              name="kategori"
              rules={[{ required: true, message: "Pilih kategori" }]}
            >
              <Select placeholder="Pilih kategori pengeluaran">
                {CATEGORIES.map((cat) => (
                  <Option key={cat.value} value={cat.value}>
                    <Tag color={cat.color} icon={cat.icon}>{cat.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Deskripsi"
              name="deskripsi"
              rules={[
                { required: true, message: "Masukkan deskripsi" },
                { min: 10, message: "Deskripsi minimal 10 karakter" },
              ]}
            >
              <TextArea
                rows={3}
                placeholder="Contoh: Pembayaran internet bulan Oktober 2025"
              />
            </Form.Item>

            <Form.Item
              label="Jumlah (Rp)"
              name="jumlah"
              rules={[
                { required: true, message: "Masukkan jumlah pengeluaran" },
                {
                  validator: (_, value) => {
                    const num = parseInt(value?.toString().replace(/[^\d]/g, "") || "0");
                    if (num <= 0) {
                      return Promise.reject("Jumlah harus lebih dari 0");
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input
                type="text"
                placeholder="Contoh: 350000"
                prefix="Rp"
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, "");
                  form.setFieldValue("jumlah", parseInt(value || "0").toLocaleString("id-ID"));
                }}
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <div className="flex justify-end gap-2">
                <Button onClick={handleCancel}>Batal</Button>
                <Button type="primary" htmlType="submit">
                  {editingExpense ? "Perbarui" : "Simpan"}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>

      <style>{`
        .ant-statistic-title {
          font-weight: 600;
          color: #4b5563;
        }
        .ant-table-thead > tr > th {
          background-color: #f8fafc;
          font-weight: 700;
          color: #374151;
        }
        .ant-table-summary {
          background-color: #eff6ff;
        }
        .border-l-4 {
          border-left-width: 4px;
        }
        .border-blue-500 {
          border-left-color: #1677ff;
        }
        .border-green-500 {
          border-left-color: #52c41a;
        }
        .border-purple-500 {
          border-left-color: #722ed1;
        }
      `}</style>
    </ConfigProvider>
  );
};

export default CostBulanan;