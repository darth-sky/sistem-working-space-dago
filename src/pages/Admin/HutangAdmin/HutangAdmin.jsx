// HutangAdmin.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  ConfigProvider,
  Row,
  Col,
  Card,
  Statistic,
  Form,
  InputNumber,
  Select,
  Button,
  Table,
  Tag,
  Modal,
  Tooltip,
  Divider,
  DatePicker,
  message,
  Space,
  Input,
  Spin,
  Alert,
  Popconfirm,
  Switch, // Import Switch
} from "antd";
import {
  DollarOutlined,
  TeamOutlined,
  CrownOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined, // Import Delete
  PlusOutlined,
  BookOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import locale from "antd/locale/id_ID";
import "dayjs/locale/id";

// Import service API yang baru
import {
  getRekapLive,
  addUtangTenant,
  getActiveTenants,
  getUtangLog,       // <- BARU
  updateUtangLog,      // <- BARU
  deleteUtangLog,      // <- BARU
} from "../../../services/service"; // Sesuaikan path

dayjs.locale("id");
const { Option } = Select;
const { RangePicker } = DatePicker;

// ... (helper formatRupiah dan formatNumberInput tetap sama) ...
const formatRupiah = (amount = 0) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Math.round(Number(amount) || 0));

const formatNumberInput = (v) =>
  v ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
const parseNumberInput = (v) => (v ? v.replace(/\./g, "") : 0);


const HutangAdmin = () => {
  // --- STATE MANAGEMENT ---
  const [rekapData, setRekapData] = useState([]);
  const [tenantList, setTenantList] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'), 
    dayjs().endOf('month')
  ]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // State untuk form utang (Modal Add)
  const [utangForm] = Form.useForm();
  const [utangModalVisible, setUtangModalVisible] = useState(false);

  // --- STATE BARU UNTUK LOG CRUD UTANG ---
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [logData, setLogData] = useState([]);
  const [selectedTenantForLog, setSelectedTenantForLog] = useState(null); // { id, name }
  
  const [editUtangModalVisible, setEditUtangModalVisible] = useState(false);
  const [editUtangForm] = Form.useForm();
  const [editingUtangEntry, setEditingUtangEntry] = useState(null); // { id_utang, ... }
  // ----------------------------------------

  // --- FUNGSI PENGAMBILAN DATA ---
  const fetchData = useCallback(async () => {
    if (!dateRange || dateRange.length !== 2) {
       message.warn("Silakan pilih rentang tanggal terlebih dahulu.");
       return;
    }
    setLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      const [rekapResult, tenantsResult] = await Promise.all([
         getRekapLive(startDate, endDate),
         getActiveTenants()
      ]);

      const processedRekap = rekapResult.map(item => ({
          ...item,
          id: item.id_tenant,
          name: item.nama_tenant,
          totalSales: Number(item.totalSales) || 0,
          debt: Number(item.totalUtang) || 0,
          utangAwal: Number(item.utangAwal) || 0, // Pastikan number
          utangMasukPeriode: Number(item.utangMasukPeriode) || 0, // Pastikan number
      }));
      
      setRekapData(processedRekap);
      setTenantList(tenantsResult);
    } catch (error) {
      message.error(`Gagal mengambil data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ... (computeShares dan totals tetap sama) ...
  const computeShares = (tenantRekap) => {
    const total = Number(tenantRekap.totalSales) || 0;
    const ownerShare = Math.round(total * 0.3);
    const rawTenantShare = total - ownerShare;
    const debt = Number(tenantRekap.debt) || 0; 
    const netTenantShare = Math.max(0, rawTenantShare - debt);
    const remainingDebt = Math.max(0, debt - rawTenantShare);
    return { total, rawTenantShare, ownerShare, debt, netTenantShare, remainingDebt };
  };

  const totals = useMemo(() => {
    const totalGross = rekapData.reduce((s, t) => s + (Number(t.totalSales) || 0), 0);
    const totalTenantNetPayment = rekapData.reduce((s, t) => s + computeShares(t).netTenantShare, 0);
    const totalOwnerShare = rekapData.reduce((s, t) => s + computeShares(t).ownerShare, 0);
    return { totalGross, totalTenantNetPayment, totalOwnerShare };
  }, [rekapData]);


  // --- HANDLER AKSI ---

  // Form "Input Utang Tenant Baru"
  const handleAddUtang = async (values) => {
    setSubmitLoading(true);
    try {
      const tanggal_utang = values.tanggal_utang.format('YYYY-MM-DD');
      await addUtangTenant(
        values.id_tenant, 
        values.jumlah, 
        values.deskripsi || "Utang manual dari admin",
        tanggal_utang
      );
      
      const tenantName = tenantList.find(t => t.id_tenant === values.id_tenant)?.nama_tenant || '';
      message.success(`Utang untuk ${tenantName} pada ${tanggal_utang} berhasil ditambahkan.`);
      utangForm.resetFields();
      setUtangModalVisible(false);
      await fetchData(); // Refresh tabel utama
    } catch (error) {
       message.error(`Gagal menambah utang: ${error.message}`);
    } finally {
       setSubmitLoading(false);
    }
  };

  // --- HANDLER BARU UNTUK LOG CRUD UTANG ---

  // Buka Modal Log Utang (klik tombol <BookOutlined />)
  const handleOpenLog = async (tenant) => {
    setSelectedTenantForLog(tenant);
    setLogModalVisible(true);
    setLogLoading(true);
    setLogData([]);
    try {
      // Ambil log utang HANYA untuk tenant ini
      // Kita ambil semua log (tanpa filter tanggal) agar admin bisa lihat history
      const logResult = await getUtangLog(tenant.id_tenant, null, null);
      setLogData(logResult);
    } catch (error) {
       message.error(`Gagal mengambil log utang: ${error.message}`);
    } finally {
       setLogLoading(false);
    }
  };

  // Buka Modal Edit Utang (dari dalam Modal Log)
  const handleOpenEditUtang = (utangEntry) => {
    setEditingUtangEntry(utangEntry);
    editUtangForm.setFieldsValue({
        ...utangEntry,
        tanggal_utang: dayjs(utangEntry.tanggal_utang), // Konversi ke dayjs
        status_lunas: utangEntry.status_lunas === 1, // Konversi 0/1 ke boolean
    });
    setEditUtangModalVisible(true);
  };
  
  // Submit Modal Edit Utang
  const handleUpdateUtang = async (values) => {
     setSubmitLoading(true);
     try {
       const updatedData = {
         ...values,
         tanggal_utang: values.tanggal_utang.format('YYYY-MM-DD'),
         status_lunas: values.status_lunas, // Sudah boolean
       };
       await updateUtangLog(editingUtangEntry.id_utang, updatedData);
       message.success("Entri utang berhasil diperbarui.");
       setEditUtangModalVisible(false);
       setEditingUtangEntry(null);
       
       // Refresh log modal DAN tabel utama
       await handleOpenLog(selectedTenantForLog); // Refresh log
       await fetchData(); // Refresh tabel utama
     } catch (error) {
        message.error(`Gagal update utang: ${error.message}`);
     } finally {
        setSubmitLoading(false);
     }
  };

  // Hapus Entri Utang (dari Modal Log)
  const handleDeleteUtang = async (id_utang) => {
     setLogLoading(true); // Tampilkan loading di modal log
     try {
        await deleteUtangLog(id_utang);
        message.success("Entri utang berhasil dihapus.");
        // Refresh log modal DAN tabel utama
        await handleOpenLog(selectedTenantForLog); // Refresh log
        await fetchData(); // Refresh tabel utama
     } catch (error) {
        message.error(`Gagal hapus utang: ${error.message}`);
     } finally {
        setLogLoading(false);
     }
  };
  // ------------------------------------------
  
  // ... (Fungsi exportTenant dan exportAll tetap sama) ...
  const exportTenant = (t) => {
    const s = computeShares(t);
    const periodLabel = `${dateRange[0].format("DD MMM YYYY")} - ${dateRange[1].format("DD MMM YYYY")}`;
    const text = `LAPORAN BAGI HASIL - ${
      t.name
    }\nPeriode: ${periodLabel}\n
Total Penjualan: ${formatRupiah(s.total)}
Hak Owner (30%): ${formatRupiah(s.ownerShare)}
Hak Tenant Murni (70%): ${formatRupiah(s.rawTenantShare)}
Total Utang Periode: ${formatRupiah(s.debt)}
  (Utang Awal: ${formatRupiah(t.utangAwal)})
  (Utang Baru: ${formatRupiah(t.utangMasukPeriode)})
Total Pembayaran Tenant (Net): ${formatRupiah(s.netTenantShare)}
Sisa Utang (Periode Berikutnya): ${formatRupiah(s.remainingDebt)}
`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = `laporan_bagihasil_${t.name.replace(/\s+/g, "_")}_${dateRange[0].format("YYYYMMDD")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const exportAll = () => {
    const periodLabel = `${dateRange[0].format("DD MMM YYYY")} - ${dateRange[1].format("DD MMM YYYY")}`;
    const header = `LAPORAN BAGI HASIL - SEMUA TENANT\nPeriode: ${periodLabel}\n\n`;
    const content = rekapData
      .map((t) => {
        const s = computeShares(t);
        return `Tenant: ${t.name}
  Total Penjualan: ${formatRupiah(s.total)}
  Hak Owner (30%): ${formatRupiah(s.ownerShare)}
  Hak Tenant (70%): ${formatRupiah(s.rawTenantShare)}
  Total Utang: ${formatRupiah(s.debt)}
  Pembayaran Tenant (Net): ${formatRupiah(s.netTenantShare)}
  Sisa Utang: ${formatRupiah(s.remainingDebt)}
-----------------------------`;
      })
      .join("\n\n");
     const blob = new Blob([header + content], { type: "text/plain" });
     const url = URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.download = `laporan_bagihasil_semua_${dateRange[0].format("YYYYMMDD")}.txt`;
     a.click();
     URL.revokeObjectURL(url);
  };

  // --- DEFINISI KOLOM TABEL (Sederhana) ---
  const columns = [
    {
      title: "Tenant",
      dataIndex: "name",
      key: "name",
      render: (v) => <strong>{v}</strong>,
      fixed: "left",
      width: 150,
    },
    {
      title: "Penjualan Total",
      dataIndex: "totalSales",
      key: "totalSales",
      align: "right",
      render: (v) => <Tag color={"blue"}>{formatRupiah(v)}</Tag>,
      sorter: (a, b) => a.totalSales - b.totalSales,
      responsive: ["md"],
      width: 150,
    },
    {
      title: "Hak Owner (30%)",
      key: "ownerShare",
      align: "right",
      render: (_, record) => (
        <span style={{ color: "#722ed1", fontWeight: 700 }}>
          {formatRupiah(computeShares(record).ownerShare)}
        </span>
      ),
      responsive: ["md"],
      width: 150,
    },
    {
      title: "Hak Tenant (70%)",
      key: "tenantShare",
      align: "right",
      render: (_, record) => (
        <span style={{ color: "#389e0d", fontWeight: 700 }}>
          {formatRupiah(computeShares(record).rawTenantShare)}
        </span>
      ),
      responsive: ["md"],
      width: 160,
    },
    {
      title: "Total Utang", // Judul disederhanakan
      key: "debt",
      align: "right",
      render: (_, record) => {
        const s = computeShares(record);
        return s.debt > 0 ? (
          <Tooltip title={`Utang Awal: ${formatRupiah(record.utangAwal)} | Utang Baru: ${formatRupiah(record.utangMasukPeriode)}`}>
            <Tag color="orange">-{formatRupiah(s.debt)}</Tag>
          </Tooltip>
        ) : (
          <span>-</span>
        );
      },
      sorter: (a, b) => a.debt - b.debt,
      width: 130,
    },
    {
      title: "Pembayaran (Net)",
      key: "payouts",
      align: "right",
      width: 160,
      render: (_, record) => {
        const s = computeShares(record);
        return (
          <Tag
            color={s.netTenantShare > 0 ? "blue" : "default"}
            style={{ fontSize: 13, padding: "4px 8px", margin: 0 }}
          >
            {formatRupiah(s.netTenantShare)}
          </Tag>
        );
      },
      sorter: (a, b) => computeShares(a).netTenantShare - computeShares(b).netTenantShare,
    },
    {
      title: "Sisa Utang",
      key: "remainingDebt",
      align: "right",
      render: (_, record) => {
        const s = computeShares(record);
        return s.remainingDebt > 0 ? (
          <span style={{ color: "#d46b08", fontWeight: 700 }}>
            {formatRupiah(s.remainingDebt)}
          </span>
        ) : (
          <span>-</span>
        );
      },
      width: 120,
      responsive: ["lg"],
      sorter: (a, b) => computeShares(a).remainingDebt - computeShares(b).remainingDebt,
    },
    {
      title: "Aksi",
      key: "actions",
      width: 100,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="Lihat Log Utang">
            <Button
              size="small"
              icon={<BookOutlined />}
              onClick={() => handleOpenLog(record)} // <-- AKSI BARU
            />
          </Tooltip>
          <Tooltip title="Export Laporan">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => exportTenant(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // --- KOLOM UNTUK MODAL LOG UTANG ---
  const logColumns = [
     {
      title: "Tanggal",
      dataIndex: "tanggal_utang",
      key: "tanggal_utang",
      render: (t) => dayjs(t).format("DD MMM YYYY"),
      sorter: (a, b) => dayjs(a.tanggal_utang).unix() - dayjs(b.tanggal_utang).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: "Deskripsi",
      dataIndex: "deskripsi",
      key: "deskripsi",
    },
    {
      title: "Jumlah",
      dataIndex: "jumlah",
      key: "jumlah",
      align: "right",
      render: (v) => formatRupiah(v),
      sorter: (a, b) => a.jumlah - b.jumlah,
    },
     {
      title: "Status",
      dataIndex: "status_lunas",
      key: "status_lunas",
      render: (lunas) => (
        lunas ? <Tag color="green">Lunas</Tag> : <Tag color="red">Belum Lunas</Tag>
      ),
       filters: [
        { text: 'Belum Lunas', value: 0 },
        { text: 'Lunas', value: 1 },
      ],
      onFilter: (value, record) => record.status_lunas === value,
      defaultFilteredValue: [0], // Default hanya tampilkan yg belum lunas
    },
    {
      title: "Aksi",
      key: "aksi",
      align: "center",
      render: (_, record) => (
        <Space>
           <Tooltip title="Edit Utang">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEditUtang(record)} />
          </Tooltip>
          <Tooltip title="Hapus Utang">
            <Popconfirm
                title="Hapus entri utang ini?"
                description={`Yakin ingin menghapus utang ${formatRupiah(record.jumlah)}?`}
                onConfirm={() => handleDeleteUtang(record.id_utang)}
                okText="Ya, Hapus"
                cancelText="Batal"
                okButtonProps={{ danger: true }}
              >
               <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <ConfigProvider locale={locale}>
      <Spin spinning={loading} tip="Memuat data...">
        <div style={{ padding: 16 }}>
          {/* Header & Global Stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ margin: 0 }}>Admin — Laporan Bagi Hasil</h2>
                    <div style={{ color: "#6b7280" }}>
                      Laporan live pendapatan dan utang tenant.
                    </div>
                  </div>
                  <Space wrap>
                    <RangePicker
                      value={dateRange}
                      onChange={(dates) => dates && setDateRange(dates)}
                      disabled={loading}
                      allowClear={false}
                    />
                    <Button
                      type="primary"
                      onClick={exportAll}
                      icon={<DownloadOutlined />}
                      disabled={rekapData.length === 0 || loading}
                    >
                      Export Semua
                    </Button>
                  </Space>
                </div>
                <Divider style={{ margin: "16px 0" }} />
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic title="Total Penjualan Kotor" value={formatRupiah(totals.totalGross)} prefix={<DollarOutlined />} />
                  </Col>
                  <Col xs={12} sm={8}>
                    <Statistic title="Total Hak Owner (30%)" value={formatRupiah(totals.totalOwnerShare)} prefix={<CrownOutlined />} />
                  </Col>
                  <Col xs={12} sm={8}>
                    <Statistic title="Total Pembayaran Tenant (Net)" value={formatRupiah(totals.totalTenantNetPayment)} prefix={<TeamOutlined />} />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Table Rekap Pembayaran */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card
                title={`Rekap Bagi Hasil: ${dateRange[0].format("DD MMM YYYY")} - ${dateRange[1].format("DD MMM YYYY")}`}
                bodyStyle={{ padding: 0 }}
                extra={
                  <Button
                     type="primary"
                     icon={<PlusOutlined />}
                     onClick={() => setUtangModalVisible(true)}
                  >
                     Input Utang Baru
                  </Button>
                }
              >
                <Table
                  columns={columns}
                  dataSource={rekapData}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 1200 }}
                  size="small"
                  loading={loading}
                  locale={{ emptyText: "Tidak ada data penjualan untuk rentang tanggal ini." }}
                />
                <div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0f0f0", flexWrap: 'wrap', gap: 16 }}>
                  <Statistic title="Total Hak Owner (30%)" value={formatRupiah(totals.totalOwnerShare)} />
                  <Statistic title="Total Pembayaran Tenant (Net)" value={formatRupiah(totals.totalTenantNetPayment)} style={{textAlign: 'right'}} />
                </div>
              </Card>
            </Col>
          </Row>

          {/* Modal "Input Utang Baru" */}
          <Modal
            open={utangModalVisible}
            title="Input Utang Tenant Baru"
            onCancel={() => {
              setUtangModalVisible(false);
              utangForm.resetFields();
            }}
            footer={null}
            destroyOnClose
          >
            <Form form={utangForm} onFinish={handleAddUtang} layout="vertical" style={{marginTop: 20}}>
              <Form.Item
                name="id_tenant"
                label="Pilih Nama Tenant"
                rules={[{ required: true, message: "Pilih nama tenant" }]}
              >
                <Select
                  placeholder="Pilih nama tenant"
                  allowClear showSearch
                  loading={tenantList.length === 0}
                  filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                >
                  {tenantList.map((tenant) => (
                    <Option key={tenant.id_tenant} value={tenant.id_tenant}>
                      {tenant.nama_tenant}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="tanggal_utang"
                label="Tanggal Utang"
                rules={[{ required: true, message: "Pilih tanggal utang" }]}
                initialValue={dayjs()} // Default hari ini
              >
                 <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
              
              <Form.Item
                name="jumlah"
                label="Jumlah Utang (Rp)"
                rules={[{ required: true, message: "Jumlah tidak boleh kosong" }]}
                initialValue={0}
              >
                <InputNumber
                  style={{ width: "100%" }} min={0}
                  formatter={formatNumberInput} parser={parseNumberInput}
                  placeholder="Misalnya: 150.000"
                />
              </Form.Item>
              
               <Form.Item
                  name="deskripsi"
                  label="Deskripsi Utang"
                  rules={[{ required: true, message: "Deskripsi wajib diisi" }]}
                >
                  <Input.TextArea rows={2} placeholder="Contoh: Kasbon, dll." />
                </Form.Item>
              
              <Form.Item style={{marginTop: 20}}>
                <Button type="primary" htmlType="submit" block icon={<PlusOutlined />} loading={submitLoading}>
                  Simpan Utang
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          {/* --- MODAL BARU: Log Utang --- */}
          <Modal
             open={logModalVisible}
             title={`Log Utang untuk: ${selectedTenantForLog?.name}`}
             onCancel={() => {
                setLogModalVisible(false);
                setSelectedTenantForLog(null);
                setLogData([]);
             }}
             footer={null} // Tidak perlu footer OK/Cancel
             width={800}
             destroyOnClose
          >
             <Spin spinning={logLoading}>
                <Alert
                  message="Log Utang"
                  description="Daftar ini berisi semua catatan utang untuk tenant ini (belum lunas dan sudah lunas) dari semua periode. Mengedit atau menghapus entri di sini akan memengaruhi perhitungan utang di tabel utama."
                  type="info"
                  showIcon
                  style={{marginBottom: 16}}
                />
                <Table
                  columns={logColumns} // Kolom khusus untuk log
                  dataSource={logData}
                  rowKey="id_utang"
                  size="small"
                  pagination={{ pageSize: 5 }}
                  scroll={{ y: 300 }} // Scroll internal jika log panjang
                />
             </Spin>
          </Modal>

          {/* --- MODAL BARU: Edit Entri Utang --- */}
          <Modal
             open={editUtangModalVisible}
             title="Edit Entri Utang"
             onCancel={() => setEditUtangModalVisible(false)}
             footer={null} // Footer akan di-handle oleh Form
             destroyOnClose
          >
             {editingUtangEntry && ( // Hanya render jika ada data
                <Form
                  form={editUtangForm}
                  layout="vertical"
                  onFinish={handleUpdateUtang}
                  style={{marginTop: 20}}
                >
                  <Form.Item name="tanggal_utang" label="Tanggal" rules={[{ required: true }]}>
                     <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
                  </Form.Item>
                  <Form.Item name="jumlah" label="Jumlah (Rp)" rules={[{ required: true }]}>
                      <InputNumber
                        style={{ width: "100%" }} min={0}
                        formatter={formatNumberInput} parser={parseNumberInput}
                      />
                  </Form.Item>
                  <Form.Item name="deskripsi" label="Deskripsi" rules={[{ required: true }]}>
                       <Input.TextArea rows={2} />
                  </Form.Item>
                  <Form.Item name="status_lunas" label="Status" valuePropName="checked">
                       <Switch checkedChildren="Lunas" unCheckedChildren="Belum Lunas" />
                  </Form.Item>
                  <Form.Item style={{marginTop: 20}}>
                    <Button type="primary" htmlType="submit" block loading={submitLoading}>
                       Update Entri Utang
                    </Button>
                  </Form.Item>
                </Form>
             )}
          </Modal>

        </div>
      </Spin>
    </ConfigProvider>
  );
};

export default HutangAdmin;