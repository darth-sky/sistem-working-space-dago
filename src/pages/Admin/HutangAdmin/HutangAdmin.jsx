// BagiHasil.jsx
import React, { useMemo, useState } from "react";
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
    Space, // FIX: Komponen Space sudah diimpor
} from "antd";
import {
    DollarOutlined,
    TeamOutlined,
    CrownOutlined,
    DownloadOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import locale from "antd/locale/id_ID";
import "dayjs/locale/id";

dayjs.locale("id");

const { Option } = Select;

// helper rupiah
const formatRupiah = (amount = 0) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(
        Math.round(Number(amount) || 0)
    );

// helper untuk format InputNumber dengan pemisah ribuan
const formatNumberInput = (v) => v ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
const parseNumberInput = (v) => v ? v.replace(/\./g, "") : 0;


// default tenants
const DEFAULT_TENANTS = [
    {
        id: 1,
        name: "HomeBro",
        totalSales: 1500000,
        debt: 0,
        payments: { p1_paid: false, p2_paid: false }, // p1 = 1 (30%), p2 = 16 (70%)
    },
    {
        id: 2,
        name: "Dapoer M.S",
        totalSales: 2000000,
        debt: 150000,
        payments: { p1_paid: false, p2_paid: false },
    },
];

const nextDateForDay = (yearMonthDay, dayOfMonth) => {
    // returns string like 'YYYY-MM-DD' representing that month's day
    const base = dayjs(yearMonthDay).date(dayOfMonth);
    if (base.date() !== dayOfMonth) return base.endOf("month").format("YYYY-MM-DD");
    return base.format("YYYY-MM-DD");
};

const HutangAdmin = () => {
    // state
    const [tenants, setTenants] = useState(DEFAULT_TENANTS);
    const [form] = Form.useForm();
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingTenant, setEditingTenant] = useState(null);
    const [period, setPeriod] = useState(dayjs()); // month selector

    // derived totals
    const totals = useMemo(() => {
        const totalGross = tenants.reduce((s, t) => s + (Number(t.totalSales) || 0), 0);
        const totalTenantShare = tenants.reduce((s, t) => s + ((Number(t.totalSales) || 0) * 0.7), 0);
        const totalOwnerShare = tenants.reduce((s, t) => s + ((Number(t.totalSales) || 0) * 0.3), 0);
        
        return { 
            totalGross, 
            totalTenantShare: Math.round(totalTenantShare), 
            totalOwnerShare: Math.round(totalOwnerShare)
        };
    }, [tenants]);

    // helper to compute shares for a tenant, applying debt deduction to tenant share
    const computeShares = (tenant) => {
        const total = Number(tenant.totalSales) || 0;
        const rawTenantShare = total * 0.7;
        const ownerShare = Math.round(total * 0.3);
        const debt = Number(tenant.debt) || 0;

        // deduct debt from tenant share
        const netTenantShare = Math.max(0, rawTenantShare - debt);
        const remainingDebt = Math.max(0, debt - rawTenantShare);

        // split tenant payout into two installments: 30% on day 1, 70% on day 16 (of netTenantShare)
        const p1 = Math.round(netTenantShare * 0.3); // paid on day 1 (30%)
        
        // Adjust p2 slightly if p1 + p2 != netTenantShare due to rounding
        const p2_adjusted = Math.round(netTenantShare) - p1;

        return {
            total,
            rawTenantShare: Math.round(rawTenantShare),
            ownerShare,
            debt,
            netTenantShare: Math.round(netTenantShare),
            remainingDebt: Math.round(remainingDebt),
            p1,
            p2: p2_adjusted,
        };
    };

    // Add tenant entry
    const handleAdd = (values) => {
        const id = Math.max(0, ...tenants.map((t) => t.id)) + 1;
        const newTenant = {
            id,
            name: values.name,
            totalSales: Number(values.totalSales) || 0,
            debt: Number(values.debt) || 0,
            payments: { p1_paid: false, p2_paid: false },
        };
        setTenants((s) => [newTenant, ...s]);
        form.resetFields();
        message.success("Data tenant berhasil ditambahkan (dummy).");
    };

    // Delete
    const handleDelete = (id) => {
        Modal.confirm({
            title: "Hapus data tenant?",
            content: "Data akan dihapus dari rekap lokal. Lanjutkan?",
            okText: "Ya, Hapus",
            cancelText: "Batal",
            onOk() {
                setTenants((prev) => prev.filter((t) => t.id !== id));
                message.success("Data tenant dihapus.");
            },
        });
    };

    // open edit modal
    const openEdit = (tenant) => {
        setEditingTenant(tenant);
        setEditModalVisible(true);
    };

    const handleUpdate = (vals) => {
        setTenants((prev) =>
            prev.map((t) => (t.id === editingTenant.id ? { ...t, name: vals.name, totalSales: Number(vals.totalSales), debt: Number(vals.debt) } : t))
        );
        setEditModalVisible(false);
        setEditingTenant(null);
        message.success("Perubahan tersimpan (dummy).");
    };

    // toggle payment status for installment 1 or 2
    const togglePayment = (tenantId, installment) => {
        setTenants((prev) =>
            prev.map((t) => {
                if (t.id !== tenantId) return t;
                const newPayments = { ...t.payments };
                if (installment === 1) newPayments.p1_paid = !newPayments.p1_paid;
                if (installment === 2) newPayments.p2_paid = !newPayments.p2_paid;
                return { ...t, payments: newPayments };
            })
        );
    };

    // export single tenant report (TXT)
    const exportTenant = (t) => {
        const s = computeShares(t);
        const periodLabel = period.format("MMMM YYYY");
        const text = `LAPORAN BAGI HASIL - ${t.name}\nPeriode: ${periodLabel}\n\nTotal Penjualan: ${formatRupiah(s.total)}\nHak Tenant (70%): ${formatRupiah(s.rawTenantShare)}\nPotongan Utang: ${formatRupiah(s.debt)}\nNet Tenant Share (setelah potong utang): ${formatRupiah(s.netTenantShare)}\n - Pembayaran 1 (30%) tanggal 1: ${formatRupiah(s.p1)}\n - Pembayaran 2 (70%) tanggal 16: ${formatRupiah(s.p2)}\nHak Owner (30%): ${formatRupiah(s.ownerShare)}\nSisa Utang (jika ada): ${formatRupiah(s.remainingDebt)}\n`;
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `laporan_bagihasil_${t.name.replace(/\s+/g, "_")}_${period.format("YYYYMM")}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // export all report (TXT)
    const exportAll = () => {
        const periodLabel = period.format("MMMM YYYY");
        const header = `LAPORAN BAGI HASIL - SEMUA TENANT\nPeriode: ${periodLabel}\n\n`;
        const content = tenants
            .map((t) => {
                const s = computeShares(t);
                return `Tenant: ${t.name}
    Total Penjualan: ${formatRupiah(s.total)}
    Hak Tenant (70%): ${formatRupiah(s.rawTenantShare)}
    Potongan Utang: ${formatRupiah(s.debt)}
    Net Tenant Share: ${formatRupiah(s.netTenantShare)}
      - Pembayaran 1 (30%): ${formatRupiah(s.p1)}
      - Pembayaran 2 (70%): ${formatRupiah(s.p2)}
    Hak Owner (30%): ${formatRupiah(s.ownerShare)}
    Sisa Utang: ${formatRupiah(s.remainingDebt)}
-----------------------------`;
            })
            .join("\n\n");
        const blob = new Blob([header + content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `laporan_bagihasil_semua_${period.format("YYYYMM")}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // columns for table (responsive and compact)
    const columns = [
        {
            title: "Tenant",
            dataIndex: "name",
            key: "name",
            render: (v) => <strong>{v}</strong>,
            fixed: 'left',
            width: 150,
        },
        {
            title: "Penjualan Total",
            dataIndex: "totalSales",
            key: "totalSales",
            align: "right",
            render: (v) => formatRupiah(v),
            responsive: ['md'],
            width: 150,
        },
        {
            title: "Hak Tenant (70%)",
            key: "tenantShare",
            align: "right",
            render: (_, record) => {
                const s = computeShares(record);
                return <span style={{ color: "#389e0d", fontWeight: 700 }}>{formatRupiah(s.rawTenantShare)}</span>;
            },
            responsive: ['md'],
            width: 150,
        },
        {
            title: "Hak Owner (30%)",
            key: "ownerShare",
            align: "right",
            render: (_, record) => {
                const s = computeShares(record);
                return <span style={{ color: "#722ed1", fontWeight: 700 }}>{formatRupiah(s.ownerShare)}</span>;
            },
            responsive: ['lg'],
            width: 150,
        },
        {
            title: "Utang",
            key: "debt",
            align: "right",
            render: (_, record) => {
                const s = computeShares(record);
                return s.debt > 0 ? <Tag color="orange">-{formatRupiah(s.debt)}</Tag> : <span>-</span>;
            },
            width: 100,
        },
        {
            title: "Pembayaran Tenant",
            key: "payouts",
            align: "center",
            width: 300,
            render: (_, record) => {
                const s = computeShares(record);
                // compute scheduled dates for the selected month
                const year = period.year();
                const month = period.month(); // 0-index
                const monthBase = dayjs().year(year).month(month).date(1);
                const date1 = nextDateForDay(monthBase, 1);
                const date16 = nextDateForDay(monthBase, 16);

                return (
                    <div style={{ display: "flex", gap: 4, justifyContent: "center", flexDirection: "column" }}>
                        {/* Pembayaran 1 (30%) */}
                        <div style={{ display: "flex", alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <Tooltip title={`Tanggal 1: ${dayjs(date1).format("DD MMM YYYY")}`}>
                                <Tag color={record.payments.p1_paid ? "green" : "default"} icon={record.payments.p1_paid ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
                                    30% ({formatRupiah(s.p1)})
                                </Tag>
                            </Tooltip>
                            <Button size="small" onClick={() => togglePayment(record.id, 1)} style={{ fontSize: 11, padding: '0 4px', height: 22 }}>
                                {record.payments.p1_paid ? "Batal" : "Bayar"}
                            </Button>
                        </div>

                        {/* Pembayaran 2 (70%) */}
                        <div style={{ display: "flex", alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <Tooltip title={`Tanggal 16: ${dayjs(date16).format("DD MMM YYYY")}`}>
                                <Tag color={record.payments.p2_paid ? "green" : "default"} icon={record.payments.p2_paid ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
                                    70% ({formatRupiah(s.p2)})
                                </Tag>
                            </Tooltip>
                            <Button size="small" onClick={() => togglePayment(record.id, 2)} style={{ fontSize: 11, padding: '0 4px', height: 22 }}>
                                {record.payments.p2_paid ? "Batal" : "Bayar"}
                            </Button>
                        </div>
                    </div>
                );
            },
        },
        {
            title: "Sisa Utang",
            key: "remainingDebt",
            align: "right",
            render: (_, record) => {
                const s = computeShares(record);
                return s.remainingDebt > 0 ? <span style={{ color: "#d46b08", fontWeight: 700 }}>{formatRupiah(s.remainingDebt)}</span> : <span>-</span>;
            },
            width: 120,
            responsive: ['lg'],
        },
        {
            title: "Aksi",
            key: "actions",
            width: 120,
            align: "center",
            fixed: 'right',
            render: (_, record) => (
                <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                    <Tooltip title="Edit">
                        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                    </Tooltip>
                    <Tooltip title="Hapus">
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
                    </Tooltip>
                    <Tooltip title="Export Laporan">
                        <Button size="small" icon={<DownloadOutlined />} onClick={() => exportTenant(record)} />
                    </Tooltip>
                </div>
            ),
        },
    ];

    return (
        <ConfigProvider locale={locale}>
            <div style={{ padding: 16 }}>
                {/* Header & Global Stats */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24}>
                        <Card>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                                <div>
                                    <h2 style={{ margin: 0 }}>Admin — Bagi Hasil 💰</h2>
                                    <div style={{ color: "#6b7280" }}>Rekap pendapatan dan manajemen pembayaran tenant untuk periode **{period.format("MMMM YYYY")}**.</div>
                                </div>
                                
                                <Space wrap>
                                    <DatePicker picker="month" value={period} onChange={(d) => d && setPeriod(d)} />
                                    <Button type="primary" onClick={exportAll} icon={<DownloadOutlined />}>
                                        Export Semua
                                    </Button>
                                </Space>
                            </div>
                            <Divider style={{ margin: '16px 0' }}/>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} sm={8}>
                                    <Statistic title="Total Penjualan Kotor" value={formatRupiah(totals.totalGross)} prefix={<DollarOutlined />} />
                                </Col>
                                <Col xs={12} sm={8}>
                                    <Statistic title="Total Hak Tenant (70%)" value={formatRupiah(totals.totalTenantShare)} prefix={<TeamOutlined />} />
                                </Col>
                                <Col xs={12} sm={8}>
                                    <Statistic title="Total Hak Owner (30%)" value={formatRupiah(totals.totalOwnerShare)} prefix={<CrownOutlined />} />
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>

                {/* Bagian yang Anda minta TIDAK KEPOTONG: Form Input dan Tabel Rekap */}
                <Row gutter={[16, 16]}>
                    {/* Form Input Pendapatan Tenant (Ambil 8 kolom dari 24) */}
                    <Col xs={24} lg={8}>
                        <Card title="Input Pendapatan Tenant">
                            <Form form={form} layout="vertical" onFinish={handleAdd} initialValues={{ name: "HomeBro", totalSales: 0, debt: 0 }}>
                                <Form.Item name="name" label="Pilih Tenant / Nama" rules={[{ required: true, message: "Pilih atau masukkan nama tenant" }]}>
                                    <Select showSearch placeholder="Pilih tenant atau ketik nama">
                                        <Option value="HomeBro">HomeBro</Option>
                                        <Option value="Dapoer M.S">Dapoer M.S</Option>
                                        <Option value="Tenant Baru">Tenant Baru</Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item name="totalSales" label="Total Penjualan (Rp)" rules={[{ required: true, message: "Masukkan total penjualan" }]}>
                                    <InputNumber style={{ width: "100%" }} min={0} formatter={formatNumberInput} parser={parseNumberInput} placeholder="Contoh: 2500000" />
                                </Form.Item>

                                <Form.Item name="debt" label="Sisa Utang Bulan Lalu (Opsional)" rules={[{ type: "number", min: 0 }]}>
                                    <InputNumber style={{ width: "100%" }} min={0} formatter={formatNumberInput} parser={parseNumberInput} placeholder="Contoh: 150000" />
                                </Form.Item>

                                <Form.Item>
                                    <Button type="primary" block htmlType="submit">
                                        Tambah / Simpan Data (Dummy)
                                    </Button>
                                </Form.Item>
                            </Form>

                            <Divider />

                            <div style={{ fontSize: 13, color: "#6b7280" }}>
                                **Info Skema Bagi Hasil:**
                                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                                    <li>Pembagian: **Tenant 70%** dan **Owner 30%**.</li>
                                    <li>Pembayaran Tenant (70%) dipotong utang terlebih dahulu.</li>
                                    <li>**Jadwal Pembayaran Net Tenant Share:** 30% pada tanggal 1 dan 70% pada tanggal 16.</li>
                                </ul>
                            </div>
                        </Card>
                    </Col>

                    {/* Table Rekap Pembayaran (Ambil 16 kolom dari 24) */}
                    <Col xs={24} lg={16}>
                        <Card title={`Rekap Pembayaran Tenant - ${period.format("MMMM YYYY")}`} bodyStyle={{ padding: 0 }}>
                            <Table 
                                columns={columns} 
                                dataSource={tenants} 
                                rowKey="id" 
                                pagination={false} 
                                scroll={{ x: 1000 }} // Memastikan tabel dapat di-scroll horizontal di layar kecil
                            />

                            <div style={{ padding: 16, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                                <Button onClick={() => message.info("Download CSV belum diimplementasikan (dummy).")}>Download CSV</Button>
                                <Button type="primary" onClick={() => exportAll()} icon={<DownloadOutlined />}>
                                    Export Semua Laporan
                                </Button>
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* Edit Modal */}
                <Modal 
                    open={editModalVisible} 
                    title={`Edit Data Tenant: ${editingTenant?.name}`} 
                    onCancel={() => {setEditModalVisible(false); setEditingTenant(null);}} 
                    footer={null} 
                    destroyOnClose
                >
                    {editingTenant && (
                        <Form
                            initialValues={{ 
                                name: editingTenant.name, 
                                totalSales: editingTenant.totalSales, 
                                debt: editingTenant.debt 
                            }}
                            onFinish={handleUpdate}
                            layout="vertical"
                        >
                            <Form.Item name="name" label="Nama Tenant" rules={[{ required: true }]}>
                                <Select>
                                    <Option value="HomeBro">HomeBro</Option>
                                    <Option value="Dapoer M.S">Dapoer M.S</Option>
                                    <Option value="Tenant Baru">Tenant Baru</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="totalSales" label="Total Penjualan (Rp)" rules={[{ required: true }]}>
                                <InputNumber style={{ width: "100%" }} min={0} formatter={formatNumberInput} parser={parseNumberInput} />
                            </Form.Item>
                            <Form.Item name="debt" label="Sisa Utang">
                                <InputNumber style={{ width: "100%" }} min={0} formatter={formatNumberInput} parser={parseNumberInput} />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" block>
                                    Simpan Perubahan
                                </Button>
                            </Form.Item>
                        </Form>
                    )}
                </Modal>
            </div>
        </ConfigProvider>
    );
};

export default HutangAdmin;