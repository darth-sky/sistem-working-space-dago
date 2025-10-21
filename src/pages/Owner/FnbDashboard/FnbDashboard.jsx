// src/pages/dashboard/FnBDashboard.jsx
import React, { useMemo, useState } from "react";
import {
    ConfigProvider,
    DatePicker,
    Row,
    Col,
    Card,
    Statistic,
    Space,
    Tag,
    Progress,
    Table,
    Divider,
    Typography,
    Select,
    Tooltip,
    Empty,
} from "antd";
import locale from "antd/locale/id_ID";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Tooltip as ChartTooltip,
    Legend,
} from "chart.js";
import { motion } from "framer-motion";
import {
    ArrowUpOutlined,
    SoundOutlined,
    ShopOutlined,
    FieldTimeOutlined,
    UsergroupAddOutlined, // Ikon untuk pengunjung
} from "@ant-design/icons";

dayjs.locale("id");

// register chartjs components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    ChartTooltip,
    Legend
);

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

// ---------- Utility ----------
const formatRupiah = (num) => {
    if (!num && num !== 0) return "0";
    return new Intl.NumberFormat("id-ID").format(Math.round(Number(num)));
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------- Simulated data generators (for demo) ----------

// DUMMY FUNCTION: Total Pengunjung Setiap Jam
const generateHourlyTrafficData = (start, end) => {
    // Label jam dari 08:00 hingga 21:00
    const labels = ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21"];
    const days = Math.max(1, end.diff(start, "day") + 1);

    const data = labels.map((lbl, i) => {
        // Pola pengunjung: rendah di pagi/sore, tinggi saat makan siang & pulang kerja
        const basePattern = [15, 25, 40, 60, 110, 80, 50, 45, 55, 75, 90, 85, 60, 30][i];
        
        // Simulasikan total pengunjung selama periode yang dipilih
        return Math.round(basePattern * (0.8 + Math.random() * 0.4) * days);
    });

    return { labels, data };
};


const generateDailySellingDataForTenant = (tenantSeed, start, end) => {
    // returns { labels: [...], data: [...] }
    if (!start || !end) return { labels: [], data: [] };
    const labels = [];
    const data = [];
    let cur = start.clone();
    while (cur.isSame(end, "day") || cur.isBefore(end, "day")) {
        labels.push(cur.format("D"));
        const dayOfMonth = cur.date();
        // base differs per tenant via seed
        const base = tenantSeed === "DMS" ? 350000 : 180000;
        const variance = tenantSeed === "DMS" ? 170000 : 90000;
        let value = base + Math.sin(dayOfMonth / 3) * (variance * 0.4) + Math.random() * variance;
        // add weekday bump (weekend lower)
        if ([0, 6].includes(cur.day())) value *= 0.85;
        data.push(Math.round(value));
        cur = cur.add(1, "day");
    }
    return { labels, data };
};

const generatePeakHourData = (start, end) => {
    // returns { labels: ['07','08'...], data: [...] } hourly counts
    const labels = ["08", "09", "10", "11", "12", "13", "14", "17", "18", "19", "20"];
    const data = labels.map((lbl, i) => {
        // some deterministic-ish pattern
        const base = [5, 8, 12, 22, 48, 40, 22, 18, 38, 50, 32][i];
        const days = Math.max(1, end.diff(start, "day") + 1);
        return Math.round(base * (0.6 + Math.random() * 0.8) * Math.sqrt(days));
    });
    return { labels, data };
};

const generateTopProducts = () => {
    // static top products for demo
    const dapoer = [
        { item: "DMS_Nasi Goreng Ngejengit", qty: 15, total: 225000 },
        { item: "DMS_Rice Bowls Spicy Chicken", qty: 10, total: 150000 },
        { item: "DMS_Mie Kuah", qty: 12, total: 108000 },
        { item: "DMS_Rice Bowls Cabe Garam", qty: 8, total: 120000 },
        { item: "DMS_Rice Bowls Sambal Matah", qty: 6, total: 90000 },
    ];
    const home = [
        { item: "HB_Cafe Latte", qty: 8, total: 176000 },
        { item: "HB_Cappuccino", qty: 7, total: 154000 },
        { item: "HB_Americano", qty: 10, total: 140000 },
        { item: "HB_HomeBro's Special", qty: 9, total: 99000 },
        { item: "HB_Matcha", qty: 6, total: 102000 },
    ];
    return { dapoer, home };
};

// ---------- FnBDashboard Component ----------
const FnBDashboard = () => {
    // date range state
    const [dateRange, setDateRange] = useState([dayjs().startOf("month"), dayjs()]);
    const [dailyTarget] = useState(1000000); // Daily target dipertahankan

    // simulated tenants
    const tenantSeeds = { DapoerMS: "DMS", HomeBro: "HB" };

    // derived data for each tenant
    const dapoerData = useMemo(
        () => generateDailySellingDataForTenant(tenantSeeds.DapoerMS, dateRange[0], dateRange[1]),
        [dateRange]
    );
    const homeData = useMemo(
        () => generateDailySellingDataForTenant(tenantSeeds.HomeBro, dateRange[0], dateRange[1]),
        [dateRange]
    );
    
    // DATA BARU: Total Pengunjung
    const hourlyTraffic = useMemo(
        () => generateHourlyTrafficData(dateRange[0], dateRange[1]),
        [dateRange]
    );
    const totalVisitors = hourlyTraffic.data.reduce((s, v) => s + v, 0);

    // totals
    const totalDapoer = dapoerData.data.reduce((s, v) => s + v, 0);
    const totalHome = homeData.data.reduce((s, v) => s + v, 0);
    const totalSales = totalDapoer + totalHome;

    // transactions counts simulated from sales roughly
    const totalTransactions = Math.round((totalSales / 60000) || 0); // avg order ~60k

    // Top products
    const { dapoer: dapoerTop, home: homeTop } = useMemo(() => generateTopProducts(), []);

    // Peak hours
    const peak = useMemo(() => generatePeakHourData(dateRange[0], dateRange[1]), [dateRange]);

    // Progress/target calculations
    const totalDays = Math.max(1, dateRange[1].diff(dateRange[0], "day") + 1);
    const totalTarget = dailyTarget * totalDays;
    const pctAchieved = clamp((totalSales / totalTarget) * 100, 0, 999).toFixed(1);

    // **LOGIKA Performance Insights TELAH DIHAPUS**

    // chart data objects
    const lineData = {
        labels: dapoerData.labels,
        datasets: [
            {
                label: "DapoerMS",
                data: dapoerData.data,
                fill: false,
                borderColor: "#2563eb",
                tension: 0.2,
                pointRadius: 3,
                pointHoverRadius: 5,
            },
            {
                label: "HomeBro",
                data: homeData.data,
                fill: false,
                borderColor: "#10B981",
                tension: 0.2,
                pointRadius: 3,
                pointHoverRadius: 5,
            },
        ],
    };

    const doughnutData = {
        labels: ["DapoerMS", "HomeBro"],
        datasets: [
            {
                data: [totalDapoer, totalHome],
                backgroundColor: ["#2563eb", "#10B981"],
                hoverOffset: 8,
            },
        ],
    };

    const peakBarData = {
        labels: peak.labels,
        datasets: [
            {
                label: "Jumlah Transaksi (Simulasi)",
                data: peak.data,
                backgroundColor: "#F59E0B",
            },
        ],
    };

    // DATA CHART BARU: Trafik Pengunjung
    const trafficBarData = {
        labels: hourlyTraffic.labels,
        datasets: [
            {
                label: "Total Pengunjung",
                data: hourlyTraffic.data,
                backgroundColor: "#EF4444", // Merah
                borderWidth: 1,
            },
        ],
    };

    // chart options
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true } },
        scales: {
            y: {
                ticks: {
                    callback: (v) => "Rp " + formatRupiah(v),
                },
            },
            x: {},
        },
    };

    const doughnutOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "bottom" },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const value = ctx.parsed || 0;
                        const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
                        const pct = total === 0 ? 0 : ((value / total) * 100).toFixed(1);
                        return `${ctx.label}: ${formatRupiah(value)} ( ${pct}% )`;
                    },
                },
            },
        },
    };
    
    const trafficBarOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Jumlah Pengunjung',
                },
            },
            x: {
                title: {
                    display: true,
                    text: 'Jam (WIB)',
                },
            },
        },
    };


    // table columns for top products
    const topColumns = [
        { title: "Item", dataIndex: "item", key: "item" },
        { title: "Qty", dataIndex: "qty", key: "qty", align: "center", width: 80 },
        {
            title: "Total (Rp)",
            dataIndex: "total",
            key: "total",
            align: "right",
            render: (t) => <b>Rp {formatRupiah(t)}</b>,
            width: 140,
        },
    ];

    // small responsive breakpoints are handled by AntD Row/Col
    return (
        <ConfigProvider locale={locale}>
            <div style={{ padding: 20 }}>
                {/* Header */}
                <Row gutter={[16, 16]} justify="space-between" align="middle" style={{ marginBottom: 14 }}>
                    <Col>
                        <Title level={4} style={{ margin: 0 }}>
                            F&B Dashboard 2.0
                        </Title>
                        <Text type="secondary">Dago Creative Hub & Coffee Lab — Food & Beverage</Text>
                    </Col>

                    <Col>
                        <Space align="center">
                            <Text type="secondary">Rentang:</Text>
                            <RangePicker
                                value={dateRange}
                                onChange={(vals) => {
                                    if (!vals) return;
                                    // Pastikan tanggal mulai di awal hari, tanggal akhir di akhir hari
                                    setDateRange([vals[0].startOf("day"), vals[1].endOf("day")]);
                                }}
                                format="DD-MM-YYYY"
                            />
                            <Select
                                defaultValue="mtm"
                                style={{ width: 120 }}
                                onChange={(val) => {
                                    // quick presets
                                    if (val === "lw") {
                                        setDateRange([dayjs().subtract(7, "day").startOf("day"), dayjs().endOf("day")]);
                                    } else if (val === "mtm") {
                                        setDateRange([dayjs().startOf("month").startOf("day"), dayjs().endOf("day")]);
                                    } else {
                                        // all current month as default
                                        setDateRange([dayjs().startOf("month").startOf("day"), dayjs().endOf("day")]);
                                    }
                                }}
                            >
                                <Option value="mtm">Month to date</Option>
                                <Option value="lw">Last 7d</Option>
                                <Option value="all">This Month</Option>
                            </Select>
                        </Space>
                    </Col>
                </Row>

                {/* Top Summary Cards (Menambah Total Pengunjung) */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} md={6}>
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                            <Card>
                                <Statistic
                                    title="Total Penjualan"
                                    value={`Rp ${formatRupiah(totalSales)}`}
                                    prefix={<ShopOutlined />}
                                />
                                <div style={{ marginTop: 12 }}>
                                    <Text type="secondary">Target ({totalDays} hari): Rp {formatRupiah(totalTarget)}</Text>
                                    <Progress percent={Number(pctAchieved)} status={pctAchieved >= 100 ? "success" : "active"} />
                                </div>
                            </Card>
                        </motion.div>
                    </Col>
                    
                    {/* CARD BARU: Total Pengunjung */}
                    <Col xs={24} sm={12} md={6}>
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                            <Card>
                                <Statistic
                                    title="Total Pengunjung"
                                    value={formatRupiah(totalVisitors)}
                                    prefix={<UsergroupAddOutlined />}
                                />
                                <Text type="secondary">Rata-rata per hari: {Math.round(totalVisitors / totalDays)} pengunjung</Text>
                            </Card>
                        </motion.div>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <Card>
                                <Statistic title="Jumlah Transaksi" value={totalTransactions} prefix={<FieldTimeOutlined />} />
                                <Text type="secondary">Rata-rata per hari: {Math.round(totalTransactions / totalDays)} transaksi</Text>
                            </Card>
                        </motion.div>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                            <Card>
                                <Statistic title="Rata-rata Harian" value={`Rp ${formatRupiah(totalSales / totalDays)}`} prefix={<ArrowUpOutlined />} />
                                <Text type="secondary">Performa harian rata-rata</Text>
                            </Card>
                        </motion.div>
                    </Col>
                </Row>

                {/* Main Charts: Daily Selling dan Kontribusi Tenant */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                        <Card style={{ marginBottom: 16 }}>
                            <Row gutter={[12, 12]}>
                                <Col span={24} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Title level={5} style={{ margin: 0 }}>Daily Selling (per tenant)</Title>
                                    <Text type="secondary">
                                        {dateRange[0].format("D MMM")} - {dateRange[1].format("D MMM YYYY")}
                                    </Text>
                                </Col>

                                <Col span={24}>
                                    <div style={{ height: 300 }}>
                                        <Line data={lineData} options={{
                                            ...commonOptions,
                                            plugins: { legend: { display: true } },
                                            scales: {
                                                y: {
                                                    ticks: {
                                                        callback: (v) => `Rp ${formatRupiah(v)}`,
                                                    },
                                                },
                                            },
                                        }} />
                                    </div>
                                </Col>
                            </Row>
                        </Card>
                        
                        {/* CHART BARU: Total Pengunjung Setiap Jam */}
                        <Card style={{ marginBottom: 16 }}>
                            <Row gutter={[12, 12]}>
                                <Col span={24}>
                                    <Title level={5} style={{ marginTop: 0 }}>Total Pengunjung Setiap Jam (Trafik Pengguna)</Title>
                                    <Text type="secondary">Simulasi akumulasi pengunjung selama periode {totalDays} hari.</Text>
                                    <div style={{ height: 300, marginTop: 10 }}>
                                        <Bar data={trafficBarData} options={trafficBarOptions} />
                                    </div>
                                </Col>
                            </Row>
                        </Card>

                        {/* Chart Peak Hours lama */}
                        <Card style={{ marginBottom: 16 }}>
                            <Row gutter={[12, 12]}>
                                <Col xs={24}>
                                    <Title level={5} style={{ marginTop: 0 }}>Peak Hours Transaksi</Title>
                                    <div style={{ height: 220 }}>
                                        <Bar data={peakBarData} options={{
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: { y: { beginAtZero: true } },
                                        }} />
                                    </div>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    <Col xs={24} lg={8}>
                        <Card style={{ marginBottom: 16 }}>
                            <Title level={5}>Kontribusi Tenant</Title>
                            <div style={{ height: 220 }}>
                                <Doughnut data={doughnutData} options={doughnutOptions} />
                            </div>
                            <Divider />
                            <Space direction="vertical" size="small" style={{ width: "100%" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <Text><Tag color="#2563eb" /> DapoerMS</Text>
                                    <Text strong>Rp {formatRupiah(totalDapoer)}</Text>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <Text><Tag color="#10B981" /> HomeBro</Text>
                                    <Text strong>Rp {formatRupiah(totalHome)}</Text>
                                </div>
                            </Space>
                        </Card>

                        <Card style={{ marginBottom: 16 }}>
                            <Title level={5}>Target Progress</Title>
                            <Text type="secondary">Total target: Rp {formatRupiah(totalTarget)}</Text>
                            <div style={{ marginTop: 12 }}>
                                <Progress percent={Number(pctAchieved)} status={pctAchieved >= 100 ? "success" : "active"} />
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                                    <Text type="secondary">Tercapai: Rp {formatRupiah(totalSales)}</Text>
                                    <Text type="secondary">Sisa: Rp {formatRupiah(Math.max(0, totalTarget - totalSales))}</Text>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <Title level={5}>Quick Actions</Title>
                            <Space direction="vertical" style={{ width: "100%" }}>
                                <Tooltip title="Cetak Laporan">
                                    <button style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e6e6e6" }}>📄 Cetak Laporan</button>
                                </Tooltip>
                                <Tooltip title="Download CSV">
                                    <button style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e6e6e6" }}>⬇️ Export CSV</button>
                                </Tooltip>
                            </Space>
                        </Card>
                    </Col>
                </Row>

                {/* Top Products Table */}
                <Divider />
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <Card title="Top 5 DapoerMS (Berdasarkan Total Rp)">
                            <Table
                                columns={topColumns}
                                dataSource={dapoerTop.map((r, i) => ({ ...r, key: i }))}
                                pagination={false}
                                size="small"
                                locale={{ emptyText: <Empty description="Tidak ada data" /> }}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card title="Top 5 HomeBro (Berdasarkan Total Rp)">
                            <Table
                                columns={topColumns}
                                dataSource={homeTop.map((r, i) => ({ ...r, key: i }))}
                                pagination={false}
                                size="small"
                                locale={{ emptyText: <Empty description="Tidak ada data" /> }}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        </ConfigProvider>
    );
};

export default FnBDashboard;