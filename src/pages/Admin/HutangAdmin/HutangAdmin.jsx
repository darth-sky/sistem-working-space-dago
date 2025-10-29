import React, { useMemo, useState, useCallback, useEffect } from "react"; // Tambahkan useEffect
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
    Spin, // Tambahkan Spin
} from "antd";
import {
    DownloadOutlined,
    EditOutlined,
    PlusOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
import locale from "antd/locale/id_ID";
import "dayjs/locale/id";

// --- IMPORT API SERVICES ---
import {
    fetchRekapData,
    updateRekapData,
    addUtangTenant,
    deleteUtangTenant,
    downloadRekapSemuaBulan,
    downloadRekapBulanan, // Ganti dengan fungsi download lokal
} from "../../../services/service"; // Sesuaikan path

dayjs.locale("id");
dayjs.extend(isBetween);

const { Option } = Select;
const { RangePicker } = DatePicker;

// helper rupiah
const formatRupiah = (amount = 0) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(Math.round(Number(amount) || 0));

// helper untuk format InputNumber dengan pemisah ribuan
const formatNumberInput = (v) =>
    v ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
const parseNumberInput = (v) => (v ? v.replace(/\./g, "") : 0);

// --- HAPUS DEFAULT_GLOBAL_DATA ---

// --- UTILITY FUNCTION UNTUK CSV (Export ke Excel) ---
const convertToCSV = (headers, data) => {
    const headerKeys = headers.map((h) => h.key);
    const headerRow = headers.map((h) => `"${h.label}"`).join(",");

    const csvRows = data.map((row) => {
        return headerKeys
            .map((key) => {
                let value = row[key];
                if (typeof value === "number") {
                    value = String(value);
                }
                return `"${String(value).replace(/"/g, '""').replace(/,/g, "")}"`;
            })
            .join(",");
    });

    const BOM = "\uFEFF"; // Byte Order Mark
    return BOM + [headerRow, ...csvRows].join("\r\n");
};
// --- END UTILITY CSV ---

const HutangAdmin = () => {
    const [modal, contextHolder] = Modal.useModal();
    // State utama
    const [tenants, setTenants] = useState([]); // Ganti globalData menjadi tenants
    const [period, setPeriod] = useState(dayjs("2025-11-01"));
    const [isLoading, setIsLoading] = useState(false); // State loading

    // Periode range
    const [periode1Range, setPeriode1Range] = useState([
        dayjs("2025-11-01"),
        dayjs("2025-11-15"),
    ]);
    const [periode2Range, setPeriode2Range] = useState([
        dayjs("2025-11-16"),
        dayjs("2025-11-30"),
    ]);

    // Form & Modal state
    const [addDebtForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingTenant, setEditingTenant] = useState(null);
    const [addDebtModalVisible, setAddDebtModalVisible] = useState(false);
    const [selectedDebtDate, setSelectedDebtDate] = useState(dayjs());
    const [manualPeriodChoice, setManualPeriodChoice] = useState("auto");

    // --- Fungsi Fetch Data ---
    const loadData = useCallback(async () => {
        if (!period || !periode1Range || !periode2Range || !periode1Range[0] || !periode2Range[0]) return;

        setIsLoading(true);
        try {
            const params = {
                tahun: period.year(),
                bulan: period.month() + 1, // dayjs month() adalah 0-indexed
                p1_start: periode1Range[0].format("YYYY-MM-DD"),
                p1_end: periode1Range[1].format("YYYY-MM-DD"),
                p2_start: periode2Range[0].format("YYYY-MM-DD"),
                p2_end: periode2Range[1].format("YYYY-MM-DD"),
            };
            const data = await fetchRekapData(params);
            // Konversi tanggal dari ISO string ke dayjs object
            const processedData = data.map(tenant => ({
                ...tenant,
                debtHistory: tenant.debtHistory.map(debt => ({
                    ...debt,
                    date: dayjs(debt.date), // Ubah string ISO menjadi objek dayjs
                }))
            }));
            setTenants(processedData);
        } catch (error) {
            message.error(`Gagal memuat data: ${error.message}`);
            setTenants([]); // Kosongkan data jika error
        } finally {
            setIsLoading(false);
        }
    }, [period, periode1Range, periode2Range]); // Dependency

    // --- useEffect untuk memuat data saat periode berubah ---
    useEffect(() => {
        loadData();
    }, [loadData]); // loadData sudah di-memoize dengan useCallback

    // Fungsi untuk menentukan period berdasarkan tanggal + range manual
    const getPaymentPeriod = useCallback((date) => {
        const d = dayjs(date);
        if (!d.isValid()) return "Luar Periode";

        if (
            periode1Range &&
            periode1Range[0] &&
            d.isBetween(periode1Range[0].startOf('day'), periode1Range[1].endOf('day'), "day", "[]")
        ) {
            return "P1";
        }

        if (
            periode2Range &&
            periode2Range[0] &&
            d.isBetween(periode2Range[0].startOf('day'), periode2Range[1].endOf('day'), "day", "[]")
        ) {
            return "P2";
        }

        // Cek bulan yang sama
        if (d.format('YYYY-MM') === period.format('YYYY-MM')) {
            return "Luar Range";
        }

        return "Luar Periode";
    }, [periode1Range, periode2Range, period]);

    // Ketika bulan diganti, sesuaikan default periode untuk bulan itu
    const handlePeriodChange = (d) => {
        if (d) {
            // Atur default range P1 = tgl 1 - 15, P2 = tgl 16 - akhir bulan
            setPeriode1Range([d.startOf("month"), d.date(15)]);
            setPeriode2Range([d.date(16), d.endOf("month")]);
            setPeriod(d);
            // Data akan otomatis ter-fetch oleh useEffect
        }
    };

    // Total unpaid debt
    const getTotalUnpaidDebt = (tenant) => {
        // Pastikan debtHistory ada
        const history = tenant.debtHistory || [];
        const historyDebt = history
            .filter((d) => !d.isPaidOut)
            .reduce((sum, d) => sum + d.amount, 0);
        return (Number(tenant.currentDebt) || 0) + historyDebt;
    };

    // Perhitungan bagi hasil (useCallback)
    const computeShares = useCallback((tenant, targetPeriod = "total") => {
        let totalSales;
        let debtForCalculation;
        const history = tenant.debtHistory || []; // Pastikan history ada

        if (targetPeriod === "total") {
            totalSales = (tenant.totalSales.p1 || 0) + (tenant.totalSales.p2 || 0);
            debtForCalculation = getTotalUnpaidDebt(tenant);
        } else {
            totalSales = tenant.totalSales[targetPeriod] || 0;
            const historyDebtInPeriod = history
                .filter(
                    (d) => {
                        // Gunakan getPaymentPeriod untuk menentukan periode utang secara dinamis
                        const debtPeriod = getPaymentPeriod(d.date);
                        return !d.isPaidOut && debtPeriod.toLowerCase() === targetPeriod;
                    }
                )
                .reduce((sum, d) => sum + d.amount, 0);

            if (targetPeriod === "p1") {
                debtForCalculation = (Number(tenant.currentDebt) || 0) + historyDebtInPeriod;
            } else {
                debtForCalculation = historyDebtInPeriod;
            }
        }

        const rawTenantShare = totalSales * 0.7;
        const ownerShare = Math.round(totalSales * 0.3);
        const netTenantShare = Math.max(0, rawTenantShare - debtForCalculation);
        const remainingDebt = Math.max(0, debtForCalculation - rawTenantShare);

        return {
            total: totalSales,
            rawTenantShare: Math.round(rawTenantShare),
            ownerShare,
            debt: debtForCalculation,
            netTenantShare: Math.round(netTenantShare),
            remainingDebt: Math.round(remainingDebt),
        };
    }, [getPaymentPeriod]); // Tambahkan getPaymentPeriod sebagai dependency

    // Totals
    const totals = useMemo(() => {
        const totalGross = tenants.reduce(
            (s, t) => s + (t.totalSales.p1 || 0) + (t.totalSales.p2 || 0),
            0
        );
        const totalTenantNetPayment = tenants.reduce(
            (s, t) => s + computeShares(t, "total").netTenantShare,
            0
        );
        const totalOwnerShare = Math.round(totalGross * 0.3);

        return {
            totalGross,
            totalTenantNetPayment: Math.round(totalTenantNetPayment),
            totalOwnerShare,
        };
    }, [tenants, computeShares]); // computeShares sudah di-memoize

    // Hapus tenant (LOGIKA INI DIHAPUS, karena data dari DB)
    // const handleDelete = ... (Dihapus)
    // Kita ganti dengan HAPUS UTANG
    const handleDeleteDebt = (id_utang) => {
        modal.confirm({
            title: "Hapus utang ini?",
            content: "Utang akan dihapus permanen dari database. Lanjutkan?",
            okText: "Ya, Hapus",
            cancelText: "Batal",
            onOk: async () => {
                try {
                    setIsLoading(true);
                    await deleteUtangTenant(id_utang); // Panggil API
                    message.success("Utang berhasil dihapus.");

                    // --- START PERBAIKAN ---

                    // 1. Buat riwayat utang baru tanpa ID yang dihapus
                    const newDebtHistory = editingTenant.debtHistory.filter(
                        (d) => d.id !== id_utang
                    );

                    // 2. Buat objek tenant yang sudah ter-update
                    const updatedTenant = {
                        ...editingTenant,
                        debtHistory: newDebtHistory
                    };

                    // 3. Perbarui state modal agar langsung refresh
                    setEditingTenant(updatedTenant);

                    // 4. Perbarui juga state utama 'tenants' di latar belakang
                    setTenants((prevTenants) =>
                        prevTenants.map((t) =>
                            t.id === editingTenant.id ? updatedTenant : t
                        )
                    );

                    // loadData(); // <-- Hapus ini, tidak perlu lagi

                    // --- END PERBAIKAN ---

                } catch (error) {
                    message.error(`Gagal menghapus utang: ${error.message}`);
                } finally {
                    setIsLoading(false);
                }
            },
        });
    };

    // Edit tenant (simpan)
    const handleUpdate = async (vals) => {
        const dataToUpdate = {
            id_tenant: editingTenant.id,
            tahun: period.year(),
            bulan: period.month() + 1,
            totalSalesP1: Number(vals.totalSalesP1) || 0,
            totalSalesP2: Number(vals.totalSalesP2) || 0,
            currentDebt: Number(vals.currentDebt) || 0,
        };

        setIsLoading(true);
        try {
            await updateRekapData(dataToUpdate);
            message.success("Perubahan tersimpan ke database.");
            setEditModalVisible(false);
            setEditingTenant(null);
            loadData(); // Muat ulang data setelah update
        } catch (error) {
            message.error(`Gagal menyimpan: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Tambah utang (modal)
    const handleAddDebt = async (values) => {
        const { name, date, amount } = values;
        const selectedTenant = tenants.find(t => t.name === name);

        if (!selectedTenant || !date || !amount) {
            message.error("Lengkapi semua field.");
            return;
        }

        const dataToSave = {
            id_tenant: selectedTenant.id,
            date: dayjs(date).format("YYYY-MM-DD"), // Kirim format YYYY-MM-DD
            amount: Number(amount) || 0,
        };

        // (Pengecekan periode sudah tidak relevan di sini, karena backend
        // hanya menerima tanggal. Frontend akan mengkalkulasi periodenya saat `computeShares`)

        setIsLoading(true);
        try {
            const result = await addUtangTenant(dataToSave);
            message.success(`Utang ${formatRupiah(result.newDebt.amount)} untuk ${name} berhasil ditambahkan.`);

            // Update state lokal secara optimis (atau panggil loadData())
            setTenants(prevTenants => prevTenants.map(t => {
                if (t.id === selectedTenant.id) {
                    return {
                        ...t,
                        debtHistory: [
                            ...t.debtHistory,
                            { ...result.newDebt, date: dayjs(result.newDebt.date) } // konversi ke dayjs
                        ]
                    };
                }
                return t;
            }));

            addDebtForm.resetFields();
            setSelectedDebtDate(dayjs());
            setManualPeriodChoice("auto");
            setAddDebtModalVisible(false);
        } catch (error) {
            message.error(`Gagal menambah utang: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Export helpers
    const getExportData = (t, monthKey) => {
        const s = computeShares(t, "total");
        return {
            month: dayjs(monthKey, "YYYY-MM").format("YYYY-MM"),
            tenantName: t.name,
            salesP1: t.totalSales.p1 || 0,
            salesP2: t.totalSales.p2 || 0,
            totalSales: s.total,
            ownerShare: s.ownerShare,
            tenantRawShare: s.rawTenantShare,
            totalDebt: s.debt,
            netTenantPayment: s.netTenantShare,
            initialDebt: t.currentDebt || 0,
            remainingDebt: s.remainingDebt,
        };
    };

    // Fungsi export ini tetap di frontend, tapi datanya dari state
    const exportMonthlyDataToCSV = () => {
        const currentMonthKey = period.format("YYYY-MM");
        const dataToExport = tenants.map((t) => getExportData(t, currentMonthKey));
        const headers = [
            { label: "Bulan", key: "month" },
            { label: "Tenant", key: "tenantName" },
            { label: "Sales P1", key: "salesP1" },
            { label: "Sales P2", key: "salesP2" },
            { label: "Total Sales", key: "totalSales" },
            { label: "Hak Owner (30%)", key: "ownerShare" },
            { label: "Hak Tenant (70%)", key: "tenantRawShare" },
            { label: "Utang Awal Bulan", key: "initialDebt" },
            { label: "Total Utang Dipotong", key: "totalDebt" },
            { label: "Pembayaran NET", key: "netTenantPayment" },
            { label: "Sisa Utang Bulan Ini", key: "remainingDebt" },
        ];

        const csvContent = convertToCSV(headers, dataToExport);
        const filename = `data_rekap_bulanan_${period.format("YYYYMM")}.csv`;
        downloadRekapBulanan(csvContent, filename); // Gunakan helper download
        message.success(`Data rekap bulan ${period.format("MMMM YYYY")} telah di-download.`);
    };

    // Fungsi export semua bulan (panggil API)
    const exportAllTimeDataToCSV = useCallback(async () => {
        setIsLoading(true);
        try {
            await downloadRekapSemuaBulan();
            message.success("Data rekap semua bulan telah di-download.");
        } catch (error) {
            message.error(`Gagal download: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fungsi export per tenant
    const exportMonthlyDataPerTenantToCSV = (targetTenantName) => {
        const currentMonthKey = period.format("YYYY-MM");
        const dataToExport = tenants.filter((t) => t.name === targetTenantName).map((t) => getExportData(t, currentMonthKey));
        const headers = [
            // (headers sama seperti exportMonthlyDataToCSV)
            { label: "Bulan", key: "month" },
            { label: "Tenant", key: "tenantName" },
            // ... (sisa headers)
            { label: "Sisa Utang Bulan Ini", key: "remainingDebt" },
        ];

        const csvContent = convertToCSV(headers, dataToExport);
        const filename = `data_bulanan_${targetTenantName.replace(/\s+/g, "_")}_${period.format("YYYYMM")}.csv`;
        downloadRekapBulanan(csvContent, filename);
        message.success(`Data ${targetTenantName} bulan ${period.format("MMMM YYYY")} telah di-download.`);
    };

    // Kolom aksi (Download per tenant, Edit)
    // (Fungsi Hapus tenant dihilangkan dari sini)
    const actionColumn = {
        title: "Aksi",
        key: "actions",
        width: 100, // Lebar dikurangi
        align: "center",
        fixed: "right",
        render: (_, record) => (
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <Tooltip title={`Download ${record.name} bulan ini`}>
                    <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => exportMonthlyDataPerTenantToCSV(record.name)}
                        type="primary"
                    />
                </Tooltip>
                <Tooltip title="Edit">
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingTenant(record);
                            setEditModalVisible(true);
                            // set initial values
                            editForm.setFieldsValue({
                                name: record.name,
                                totalSalesP1: record.totalSales.p1,
                                totalSalesP2: record.totalSales.p2,
                                currentDebt: record.currentDebt,
                            });
                        }}
                    />
                </Tooltip>
                {/* Tombol Hapus tenant (record) dihilangkan karena tidak logis */}
            </div>
        ),
    };

    // Render generic column (Logika computeShares dipindah ke useCallback)
    const renderColumn = (key, align, width, title, targetPeriod) => ({
        title,
        key,
        align,
        width,
        render: (_, record) => {
            const s = computeShares(record, targetPeriod);
            // ... (sisa logika renderColumn tetap sama) ...
            if (key === "totalSales") {
                return <Tag color="blue">{formatRupiah(s.total)}</Tag>;
            } else if (key === "ownerShare") {
                return (
                    <span style={{ color: "#722ed1", fontWeight: 700 }}>{formatRupiah(s.ownerShare)}</span>
                );
            } else if (key === "rawTenantShare") {
                return (
                    <span style={{ color: "#389e0d", fontWeight: 700 }}>{formatRupiah(s.rawTenantShare)}</span>
                );
            } else if (key === "debt") {
                if (s.debt > 0) {
                    let tooltipContent =
                        targetPeriod === "total" ? "Utang Awal + Utang Baru" : targetPeriod === "p1" ? "Utang Awal + Utang P1" : "Utang P2";
                    return (
                        <Tooltip title={tooltipContent}>
                            <Tag color="orange">-{formatRupiah(s.debt)}</Tag>
                        </Tooltip>
                    );
                }
                return <span>-</span>;
            } else if (key === "netTenantShare") {
                const paidOut = s.netTenantShare;
                return (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Tag color={paidOut > 0 ? "green" : "default"} style={{ fontSize: 13, padding: "4px 8px" }}>
                            {formatRupiah(paidOut)}
                        </Tag>
                        {/* Logika sisa utang */}
                        {s.remainingDebt > 0 && (
                            <Tag color="red" style={{ marginTop: 4 }}>
                                Sisa Utang: {formatRupiah(s.remainingDebt)}
                            </Tag>
                        )}
                    </div>
                );
            }
            return null;
        },
    });

    // (Kolom tabel sisanya tetap sama)
    const baseColumns = (targetPeriod) => [
        {
            title: "Tenant",
            dataIndex: "name",
            key: "name",
            render: (v) => <strong>{v}</strong>,
            fixed: "left",
            width: 140,
        },
        {
            title: targetPeriod === 'total' ? "Sales P1" : targetPeriod === 'p1' ? 'Sales P1' : 'Sales P2',
            dataIndex: 'totalSales',
            key: 'sales',
            align: 'right',
            width: 120,
            render: (_, record) => {
                const sales = targetPeriod === 'total' ? record.totalSales.p1 + record.totalSales.p2 : record.totalSales[targetPeriod] || 0;
                return formatRupiah(sales);
            },
        },
        renderColumn("totalSales", "right", 130, "Total Sales/Sales Periode", targetPeriod),
        renderColumn("ownerShare", "right", 130, "Hak Owner (30%)", targetPeriod),
        renderColumn("rawTenantShare", "right", 130, "Hak Tenant Murni (70%)", targetPeriod),
        renderColumn("debt", "right", 130, targetPeriod === "total" ? "Total Utang Dipotong" : "Utang di Periode Ini", targetPeriod),
    ];

    const totalColumns = [
        ...baseColumns("total"),
        renderColumn("netTenantShare", "center", 180, "Pembayaran Tenant (Potong Utang)", "total"),
        actionColumn,
    ];

    const periodColumns = (p) => [
        {
            title: "Tenant",
            dataIndex: "name",
            key: "name",
            render: (v) => <strong>{v}</strong>,
            fixed: "left",
            width: 140,
        },
        {
            title: "Sales",
            dataIndex: "totalSales",
            key: "sales",
            align: "right",
            width: 120,
            render: (_, record) => formatRupiah(record.totalSales[p] || 0),
        },
        renderColumn("ownerShare", "right", 130, "Hak Owner (30%)", p),
        renderColumn("rawTenantShare", "right", 130, "Hak Tenant Murni (70%)", p),
        renderColumn("debt", "right", 130, "Utang di Periode Ini", p),
        renderColumn("netTenantShare", "center", 180, "Pembayaran ke Tenant (Net)", p),
        actionColumn
    ];

    // (Helper formatRangeLabel tetap sama)
    const formatRangeLabel = (range) => {
        if (!range || !range[0] || !range[1]) return "-";
        const start = dayjs(range[0]);
        const end = dayjs(range[1]);
        if (start.month() === end.month() && start.year() === end.year()) {
            return `${start.format("DD")}–${end.format("DD MMMM YYYY")}`;
        }
        return `${start.format("DD MMM YYYY")} – ${end.format("DD MMM YYYY")}`;
    };

    // Tentukan periode yang terdeteksi otomatis
    const autoDetectedPeriod = selectedDebtDate.isValid()
        ? getPaymentPeriod(selectedDebtDate)
        : "Luar Periode";

    // (Logika displayedPeriodChoice tetap sama)
    const displayedPeriodChoice = manualPeriodChoice === "auto" ? autoDetectedPeriod : manualPeriodChoice;
    const isAutoPeriod = manualPeriodChoice === "auto";

    return (
        <ConfigProvider locale={locale}>
            <Spin spinning={isLoading} tip="Memuat data...">
                {contextHolder}
                <div style={{ padding: 16 }}>
                    {/* Header (Tombol Export Semua Bulan diupdate) */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 12 }}>
                        <Col xs={24}>
                            <Card>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                                    <div>
                                        <h2 style={{ margin: 0 }}>Admin — Bagi Hasil</h2>
                                        <div style={{ color: "#6b7280" }}>
                                            Rekap pendapatan dan manajemen pembayaran tenant untuk periode <b>{period.format("MMMM YYYY")}</b>.
                                        </div>
                                    </div>
                                    <Space wrap>
                                        <DatePicker picker="month" value={period} onChange={handlePeriodChange} />
                                        <Button type="primary" icon={<DownloadOutlined />} onClick={exportAllTimeDataToCSV}>
                                            Export Semua Bulan
                                        </Button>
                                    </Space>
                                </div>

                                {/* (Sisa dari Header Card: Divider, Bar Periode, Statistik tetap sama) */}
                                <Divider style={{ margin: "12px 0" }} />
                                <Row gutter={[12, 12]} align="middle">
                                    <Col xs={24} sm={8}>
                                        <Form layout="vertical">
                                            <Form.Item label={`Periode 1 (${formatRangeLabel(periode1Range)})`} style={{ marginBottom: 0 }}>
                                                <RangePicker
                                                    value={periode1Range}
                                                    format="DD MMM YYYY"
                                                    onChange={(val) => setPeriode1Range(val)}
                                                    style={{ width: "100%" }}
                                                />
                                            </Form.Item>
                                        </Form>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Form layout="vertical">
                                            <Form.Item label={`Periode 2 (${formatRangeLabel(periode2Range)})`} style={{ marginBottom: 0 }}>
                                                <RangePicker
                                                    value={periode2Range}
                                                    format="DD MMM YYYY"
                                                    onChange={(val) => setPeriode2Range(val)}
                                                    style={{ width: "100%" }}
                                                />
                                            </Form.Item>
                                        </Form>
                                    </Col>
                                    <Col xs={24} sm={8} style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
                                        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                                            setAddDebtModalVisible(true);
                                            setSelectedDebtDate(dayjs());
                                            addDebtForm.setFieldValue('date', dayjs());
                                            addDebtForm.setFieldValue('periodChoice', 'auto');
                                            setManualPeriodChoice("auto");
                                        }}>
                                            Tambah Utang Baru
                                        </Button>
                                    </Col>
                                </Row>
                                <Divider style={{ margin: "12px 0" }} />
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} sm={8}>
                                        <Statistic title="Total Penjualan Kotor" value={formatRupiah(totals.totalGross)} />
                                    </Col>
                                    <Col xs={12} sm={8}>
                                        <Statistic title="Total Hak Owner (30%)" value={formatRupiah(totals.totalOwnerShare)} />
                                    </Col>
                                    <Col xs={12} sm={8}>
                                        <Statistic title="Total Pembayaran Tenant NET" value={formatRupiah(totals.totalTenantNetPayment)} />
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>

                    {/* Tabel Periode 1, Periode 2, Total Keseluruhan (Struktur HTML tetap sama) */}
                    <Row gutter={[16, 16]}>
                        <Col xs={24}>
                            <Card title={`DETAIL P1 (${formatRangeLabel(periode1Range)})`}>
                                <Table columns={periodColumns("p1")} dataSource={tenants} rowKey="id" pagination={false} scroll={{ x: 1200 }} size="small" />
                            </Card>
                        </Col>
                        {/* (Tabel P2 dan Tabel Total tetap sama) */}
                        <Col xs={24}>
                            <Card title={`DETAIL P2 (${formatRangeLabel(periode2Range)})`}>
                                <Table columns={periodColumns("p2")} dataSource={tenants} rowKey="id" pagination={false} scroll={{ x: 1200 }} size="small" />
                            </Card>
                        </Col>
                        <Col xs={24}>
                            <Card
                                title={`REKAP TOTAL BULANAN - ${period.format("MMMM YYYY")}`}
                                extra={
                                    <Button type="primary" icon={<DownloadOutlined />} onClick={exportMonthlyDataToCSV} disabled={tenants.length === 0}>
                                        Download Bulan Ini
                                    </Button>
                                }
                            >
                                <Table columns={totalColumns} dataSource={tenants} rowKey="id" pagination={false} scroll={{ x: 1300 }} size="small" />
                                {/* (Footer rekap tetap sama) */}
                            </Card>
                        </Col>
                    </Row>

                    {/* Modal Tambah Utang (Logika Form diupdate) */}
                    <Modal
                        open={addDebtModalVisible}
                        title="Tambah Utang Baru Tenant"
                        onCancel={() => {
                            setAddDebtModalVisible(false);
                            addDebtForm.resetFields();
                            setSelectedDebtDate(dayjs());
                            setManualPeriodChoice("auto");
                        }}
                        footer={null}
                        destroyOnClose
                    >
                        <Form form={addDebtForm} onFinish={handleAddDebt} layout="vertical">
                            <Form.Item name="name" label="Pilih Nama Tenant" rules={[{ required: true, message: "Pilih nama tenant" }]}>
                                <Select placeholder="Pilih nama tenant" showSearch>
                                    {tenants.map((t) => (
                                        <Option key={t.id} value={t.name}>
                                            {t.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            {/* Row: DatePicker + Pilih Periode (Logika tampilan diupdate) */}
                            <Row gutter={8}>
                                <Col span={14}>
                                    <Form.Item name="date" label="Tanggal Pemberian Utang" rules={[{ required: true, message: "Pilih tanggal" }]}>
                                        <DatePicker
                                            style={{ width: "100%" }}
                                            placeholder="Pilih tanggal"
                                            defaultValue={dayjs()}
                                            format="DD MMMM YYYY"
                                            onChange={(d) => {
                                                setSelectedDebtDate(d || dayjs());
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={10}>
                                    {/* Select Periode ini sekarang hanya kosmetik, backend tidak menggunakannya */}
                                    <Form.Item name="periodChoice" label="Deteksi Periode">
                                        <Select
                                            value={autoDetectedPeriod} // Tampilkan hanya deteksi otomatis
                                            disabled // Nonaktifkan
                                        >
                                            <Option value={autoDetectedPeriod}>
                                                {autoDetectedPeriod}
                                            </Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="amount" label="Jumlah Utang (Rp)" rules={[{ required: true, message: "Masukkan jumlah utang" }]}>
                                <InputNumber style={{ width: "100%" }} min={1} formatter={formatNumberInput} parser={parseNumberInput} placeholder="Misalnya: 150.000" />
                            </Form.Item>

                            <Form.Item style={{ marginBottom: 0 }}>
                                <Button type="primary" htmlType="submit" block icon={<PlusOutlined />}>
                                    Tambahkan Utang
                                </Button>
                            </Form.Item>
                        </Form>
                    </Modal>

                    {/* Modal Edit Tenant (Tambahkan list utang + tombol hapus) */}
                    <Modal
                        open={editModalVisible}
                        title={`Edit Data Tenant: ${editingTenant?.name}`}
                        onCancel={() => {
                            setEditModalVisible(false);
                            setEditingTenant(null);
                        }}
                        footer={null}
                        destroyOnClose
                    >
                        {editingTenant && (
                            <Form
                                form={editForm}
                                onFinish={handleUpdate}
                                layout="vertical"
                            // initialValues ditangani oleh onClick di tombol Edit
                            >
                                <Form.Item name="name" label="Nama Tenant" rules={[{ required: true }]}>
                                    <Select disabled> {/* Nama tenant tidak boleh diubah */}
                                        <Option key={editingTenant.name} value={editingTenant.name}>
                                            {editingTenant.name}
                                        </Option>
                                    </Select>
                                </Form.Item>

                                

                                <Form.Item name="currentDebt" label="Sisa Utang Periode Sebelumnya">
                                    <InputNumber style={{ width: "100%" }} min={0} formatter={formatNumberInput} parser={parseNumberInput} />
                                </Form.Item>

                                <Card size="small" title="Riwayat Utang Periode Berjalan" style={{ marginBottom: 16 }}>
                                    <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                                        {editingTenant.debtHistory.filter((d) => !d.isPaidOut).map((d) => (
                                            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dotted #f0f0f0" }}>
                                                <div>
                                                    <span>{dayjs(d.date).format("DD/MM/YYYY")} (<Tag color='default' style={{ margin: 0 }}>{getPaymentPeriod(d.date)}</Tag>)</span>
                                                    <br />
                                                    <Tag color="orange">{formatRupiah(d.amount)}</Tag>
                                                </div>
                                                <Button
                                                    icon={<DeleteOutlined />}
                                                    danger
                                                    size="small"
                                                    onClick={() => handleDeleteDebt(d.id)}
                                                />
                                            </div>
                                        ))}
                                        {editingTenant.debtHistory.filter((d) => !d.isPaidOut).length === 0 && (
                                            <div style={{ color: "#999" }}>Tidak ada utang di periode ini.</div>
                                        )}
                                    </div>
                                </Card>

                                <Form.Item>
                                    <Button type="primary" htmlType="submit" block>
                                        Simpan Perubahan
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