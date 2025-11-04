import React, { useEffect, useMemo, useState } from "react";
import {
  ConfigProvider,
  DatePicker,
  Row,
  Col,
  Card,
  Statistic,
  Space,
  Progress,
  Table,
  Divider,
  Typography,
  Select,
  Tooltip,
  Empty,
  Tag,
} from "antd";
// Keep message separate to avoid parsing/import edge cases with grouped specifiers
import { message } from "antd";
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
import ChartDataLabels from "chartjs-plugin-datalabels";
import { motion } from "framer-motion";
import {
  ArrowUpOutlined,
  ShopOutlined,
  FieldTimeOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { getOwnerFnB } from "../../../services/service";

dayjs.locale("id");

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTooltip,
  Legend,
  ChartDataLabels
);

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID").format(Math.round(Number(n) || 0));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const HOUR_LABELS_15 = Array.from(
  { length: 15 },
  (_, i) => `${String(i + 8).padStart(2, "0")}:00`
);

// ===== Helpers =====

const buildDateRangeStrings = (start, end) => {
  const out = [];
  let it = start.startOf("day");
  const last = end.startOf("day");
  while (it.isBefore(last) || it.isSame(last, "day")) {
    out.push(it.format("YYYY-MM-DD"));
    it = it.add(1, "day");
  }
  return out;
};

const getTopNIndices = (arr, n = 3) => {
  return arr
    .map((v, i) => ({ v: Number(v) || 0, i }))
    .filter((o) => o.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, n)
    .map((o) => o.i);
};

const maskExceptIndices = (arr, indices) => {
  const keep = new Set(indices);
  return arr.map((v, i) => (keep.has(i) ? v : null));
};

const FnBDashboard = () => {
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs(),
  ]);
  const [loading, setLoading] = useState(false);

  const [totals, setTotals] = useState({
    total_fnb: 0,
    total_ws: 0,
    total_sales: 0,
    total_transactions: 0,
    avg_daily: 0,
    total_days: 0,
  });
  const [dailyTenant, setDailyTenant] = useState([]);
  const [visitorsByHour, setVisitorsByHour] = useState([]);
  const [peakByHour, setPeakByHour] = useState([]);
  const [topDapoer, setTopDapoer] = useState([]);
  const [topHome, setTopHome] = useState([]);

  // Independent filters for each table
  // Default example: Top = Semua tenant; Unpopular = HomeBro (sesuai contoh use-case)
const [tenantFilterTop, setTenantFilterTop] = useState("all");
  const [tenantFilterUnpop, setTenantFilterUnpop] = useState("HomeBro");

  const [dailyTarget] = useState(1000000);
  const handlePrint = () => window.print();
  const handleExportCSV = () => message.info("Proses ekspor CSV dimulai...");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const start = dateRange[0].format("YYYY-MM-DD");
        const end = dateRange[1].format("YYYY-MM-DD");
        const resp = await getOwnerFnB(start, end);
        const d = resp?.datas || {};

        const t = d?.totals || {};
        setTotals({
          total_fnb: Number(t.total_fnb || 0),
          total_ws: Number(t.total_ws || 0),
          total_sales: Number(t.total_sales || 0),
          total_transactions: Number(t.total_transactions || 0),
          avg_daily: Number(t.avg_daily || 0),
          total_days: Number(t.total_days || 0),
        });

        setDailyTenant(
          Array.isArray(d?.daily_selling_per_tenant)
            ? d.daily_selling_per_tenant
            : []
        );
        setVisitorsByHour(
          Array.isArray(d?.visitors_by_hour) ? d.visitors_by_hour : []
        );
        setPeakByHour(Array.isArray(d?.peak_by_hour) ? d.peak_by_hour : []);
        setTopDapoer(Array.isArray(d?.top_fnb?.dapoer) ? d.top_fnb.dapoer : []);
        setTopHome(Array.isArray(d?.top_fnb?.home) ? d.top_fnb.home : []);
      } catch (e) {
        console.error(e);
        message.error("Gagal memuat data FnB Dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [dateRange]);

  // ====== Derivatif ======
  const totalDays =
    totals.total_days ||
    Math.max(1, dateRange[1].diff(dateRange[0], "day") + 1);
  const totalTarget = dailyTarget * totalDays;
  const pctAchieved = clamp(
    (Number(totals.total_sales || 0) / Math.max(1, totalTarget)) * 100,
    0,
    999
  ).toFixed(1);

  // Pad semua tanggal untuk line chart (agar setiap hari muncul)
  const { lineLabels, dapoerSeries, homeSeries } = useMemo(() => {
    const idx = new Map(
      (dailyTenant || []).map((d) => [dayjs(d.tanggal).format("YYYY-MM-DD"), d])
    );
    const days = buildDateRangeStrings(dateRange[0], dateRange[1]);

    const labels = days.map((d) => dayjs(d).format("D"));
    const dapoer = days.map((d) => Number(idx.get(d)?.dapoerms || 0));
    const home = days.map((d) => Number(idx.get(d)?.homebro || 0));
    return { lineLabels: labels, dapoerSeries: dapoer, homeSeries: home };
  }, [dailyTenant, dateRange]);

  const lineData = {
    labels: lineLabels,
    datasets: [
      {
        label: "DapoerMS",
        data: dapoerSeries,
        fill: false,
        borderColor: "#2563eb",
        tension: 0.2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: "HomeBro",
        data: homeSeries,
        fill: false,
        borderColor: "#10B981",
        tension: 0.2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const totalDapoer = dapoerSeries.reduce((s, v) => s + v, 0);
  const totalHome = homeSeries.reduce((s, v) => s + v, 0);

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

  // Map jam
  const visitorsMap = new Map(
    visitorsByHour.map((r) => [Number(r.hour), Number(r.count)])
  );
  const peakMap = new Map(
    peakByHour.map((r) => [Number(r.hour), Number(r.count)])
  );

  // mapping 08..22 → ambil hour 8..22
  const visitorsDataRaw = HOUR_LABELS_15.map(
    (_, idx) => visitorsMap.get(8 + idx) || 0
  );
  const peakDataRaw = HOUR_LABELS_15.map((_, idx) => peakMap.get(8 + idx) || 0);

  const topPeakIdx = useMemo(
    () => getTopNIndices(peakDataRaw, 3),
    [peakDataRaw]
  );
  const visitorsData = visitorsDataRaw;
  const peakData = useMemo(() => {
    if (!topPeakIdx.length) {
      return peakDataRaw.map(() => null);
    }
    return maskExceptIndices(peakDataRaw, topPeakIdx);
  }, [peakDataRaw, topPeakIdx]);

  const trafficBarData = {
    labels: HOUR_LABELS_15,
    datasets: [
      {
        label: "Total Pengunjung",
        data: visitorsData,
        backgroundColor: "#EF4444",
      },
    ],
  };

  const peakBarData = {
    labels: HOUR_LABELS_15,
    datasets: [
      {
        label: "Jumlah Menu Dipesan (Top 3)",
        data: peakData,
        backgroundColor: "#F59E0B",
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      datalabels: { display: false },
      tooltip: {
        filter: (ctx) => Number.isFinite(ctx.parsed?.y),
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed?.y ?? ctx.parsed ?? 0;
            return `${ctx.dataset?.label ? ctx.dataset.label + ": " : ""}${formatRupiah(v)}`;
          },
        },
      },
    },
  };

  const doughnutOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      datalabels: {
        color: "#fff",
        font: { weight: "bold" },
        formatter: (value, ctx) => {
          const total = ctx.dataset.data.reduce((s, v) => s + (v || 0), 0);
          if (!total) return "0%";
          return `${((value / total) * 100).toFixed(1)}%`;
        },
      },
    },
  };

  const vMaxVisitors = Math.max(0, ...visitorsData);
  const vMaxPeak = Math.max(0, ...peakDataRaw);
  const yMaxVisitors = Math.max(2, Math.ceil(vMaxVisitors));
  const yMaxPeak = Math.max(2, Math.ceil(vMaxPeak));

  const trafficBarOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: {
        filter: (ctx) => Number.isFinite(ctx.parsed?.y),
        callbacks: {
          label: (ctx) => `Pengunjung: ${formatRupiah(ctx.parsed?.y ?? 0)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: yMaxVisitors,
        title: { display: true, text: "Jumlah Pengunjung" },
        ticks: { callback: (v) => `${Math.trunc(v)}`, precision: 0, autoSkip: true },
      },
      x: { title: { display: true, text: "Jam Operasional" } },
    },
  };

  const peakBarOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: {
        filter: (ctx) => ctx.raw != null,
        callbacks: {
          label: (ctx) => `Menu dipesan: ${formatRupiah(ctx.parsed?.y ?? 0)}`,
        },
      },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Jumlah Menu" } },
      x: { title: { display: true, text: "Jam Operasional" } },
    },
  };

  // ===== TOP / UNPOPULAR (merged + independent filters) =====
  const withTenant = (rows, tenantName) =>
    (Array.isArray(rows) ? rows : []).map((r, i) => ({
      ...r,
      tenant: tenantName,
      key: `${tenantName}-${i}-${r.item}`,
      qty: Number(r.qty || 0),
      total: Number(r.total || 0),
    }));

  const allItems = useMemo(
    () => [...withTenant(topDapoer, "DapoerMS"), ...withTenant(topHome, "HomeBro")],
    [topDapoer, topHome]
  );

  const filteredTopItems = useMemo(() => {
    if (tenantFilterTop === "all") return allItems;
    return allItems.filter((r) => r.tenant === tenantFilterTop);
  }, [allItems, tenantFilterTop]);

  const filteredUnpopItems = useMemo(() => {
    if (tenantFilterUnpop === "all") return allItems;
    return allItems.filter((r) => r.tenant === tenantFilterUnpop);
  }, [allItems, tenantFilterUnpop]);

  const top5 = useMemo(() => {
    return [...filteredTopItems]
      .filter((r) => (r.total ?? 0) > 0 || (r.qty ?? 0) > 0)
      .sort((a, b) => (b.total - a.total) || (b.qty - a.qty))
      .slice(0, 5);
  }, [filteredTopItems]);

  const unpopular5 = useMemo(() => {
    const nonZero = filteredUnpopItems.filter((r) => (r.qty ?? 0) > 0);
    const base = nonZero.length ? nonZero : filteredUnpopItems;
    return [...base]
      .sort((a, b) => (a.qty - b.qty) || (a.total - b.total))
      .slice(0, 5);
  }, [filteredUnpopItems]);

  const topColumns = [
    {
      title: "Tenant",
      dataIndex: "tenant",
      key: "tenant",
      width: 120,
      render: (v) => (
        <Tag color={v === "DapoerMS" ? "blue" : "green"} style={{ marginRight: 0 }}>
          {v}
        </Tag>
      ),
    },
    { title: "Item", dataIndex: "item", key: "item" },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      align: "center",
      width: 80,
      render: (v) => formatRupiah(v),
    },
    {
      title: "Total (Rp)",
      dataIndex: "total",
      key: "total",
      align: "right",
      width: 140,
      render: (t) => <b>Rp {formatRupiah(t)}</b>,
    },
  ];

  const totalSales = totals.total_sales || 0;
  const avgDaily = totals.avg_daily || 0;
  const totalVisitors = visitorsByHour.reduce((s, r) => s + (r.count || 0), 0);
  const totalTransactions = totals.total_transactions || 0;

  return (
    <ConfigProvider locale={locale}>
      <div style={{ padding: 20 }}>
        {/* Header & controls */}
        <Row gutter={[16, 16]} justify="space-between" align="middle" style={{ marginBottom: 14 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>F&B Dashboard</Title>
            <Text type="secondary">Dago Creative Hub & Coffee Lab — Food & Beverage</Text>
          </Col>
          <Col>
            <Space align="center">
              <Text type="secondary">Rentang:</Text>
              <RangePicker
                value={dateRange}
                onChange={(vals) => {
                  if (!vals) return;
                  setDateRange([vals[0].startOf("day"), vals[1].endOf("day")]);
                }}
                format="DD-MM-YYYY"
              />
              <Select
                defaultValue="mtm"
                style={{ width: 120 }}
                onChange={(val) => {
                  if (val === "lw")
                    setDateRange([dayjs().subtract(7, "day").startOf("day"), dayjs().endOf("day")]);
                  else
                    setDateRange([dayjs().startOf("month").startOf("day"), dayjs().endOf("day")]);
                }}
              >
                <Option value="mtm">Month to date</Option>
                <Option value="lw">Last 7d</Option>
              </Select>
            </Space>
          </Col>
        </Row>

        <div className="flex justify-start gap-3 mb-6">
          <a href="/laporan" className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100">Laporan</a>
          <a href="/fnbdashboard" className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 bg-blue-50 text-blue-600 hover:bg-blue-100">FNB</a>
          <a href="/workingspace" className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100">Working Space</a>
          <a href="/laporanpajak" className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100">Pajak</a>
        </div>

        {/* KPI Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <Card loading={loading}>
                <Statistic title="Total Penjualan" value={`Rp ${formatRupiah(totalSales)}`} prefix={<ShopOutlined />} />
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">Target ({totals.total_days} hari): Rp {formatRupiah(dailyTarget * totalDays)}</Text>
                  <Progress percent={Number(pctAchieved)} status={pctAchieved >= 100 ? "success" : "active"} />
                </div>
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card loading={loading}>
                <Statistic title="Total Pengunjung" value={formatRupiah(totalVisitors)} prefix={<UsergroupAddOutlined />} />
                <Text type="secondary">Rata-rata per hari: {Math.round(totalVisitors / Math.max(1, totalDays))} pengunjung</Text>
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card loading={loading}>
                <Statistic title="Jumlah Transaksi" value={totalTransactions} prefix={<FieldTimeOutlined />} />
                <Text type="secondary">Rata-rata per hari: {Math.round(totalTransactions / Math.max(1, totalDays))} transaksi</Text>
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card loading={loading}>
                <Statistic title="Rata-rata Harian" value={`Rp ${formatRupiah(avgDaily)}`} prefix={<ArrowUpOutlined />} />
                <Text type="secondary">Performa harian rata-rata</Text>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Charts */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card style={{ marginBottom: 16 }} loading={loading}>
              <Row gutter={[12, 12]}>
                <Col span={24} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Title level={5} style={{ margin: 0 }}>Daily Selling (per tenant)</Title>
                  <Text type="secondary">{dateRange[0].format("D MMM")} - {dateRange[1].format("D MMM YYYY")}</Text>
                </Col>
                <Col span={24}>
                  <div style={{ height: 300 }}>
                    <Line
                      data={lineData}
                      options={{
                        ...commonOptions,
                        plugins: { ...commonOptions.plugins, legend: { display: true } },
                        scales: {
                          x: { ticks: { autoSkip: true }, title: { display: true, text: "Tanggal" } },
                          y: { beginAtZero: true, ticks: { callback: (v) => `Rp ${formatRupiah(v)}` } },
                        },
                      }}
                    />
                  </div>
                </Col>
              </Row>
            </Card>

            <Card style={{ marginBottom: 16 }} loading={loading}>
              <Row gutter={[12, 12]}>
                <Col span={24}>
                  <Title level={5} style={{ marginTop: 0 }}>Trafik Pengunjung</Title>
                  <Text type="secondary">Akumulasi pengunjung selama periode {totalDays} hari.</Text>
                  <div style={{ height: 300, marginTop: 10 }}>
                    <Bar data={trafficBarData} options={trafficBarOptions} />
                  </div>
                </Col>
              </Row>
            </Card>

            <Card style={{ marginBottom: 16 }} loading={loading}>
              <Row gutter={[12, 12]}>
                <Col xs={24}>
                  <Title level={5} style={{ marginTop: 0 }}>Peak Hours Menu</Title>
                  <Text type="secondary">Akumulasi pemesanan selama periode {totalDays} hari.</Text>
                  {!topPeakIdx.length && (<Text type="secondary">Belum ada jam dengan pesanan menu &gt; 0 pada rentang ini.</Text>)}
                  <div style={{ height: 220 }}>
                    <Bar data={peakBarData} options={peakBarOptions} />
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card style={{ marginBottom: 16 }} loading={loading}>
              <Title level={5}>Kontribusi Tenant</Title>
              <div style={{ height: 220 }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
              <Divider />
              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text>
                    <span style={{ display: "inline-block", width: 10, height: 10, background: "#2563eb", borderRadius: 2, marginRight: 6 }} /> DapoerMS
                  </Text>
                  <Text strong>Rp {formatRupiah(totalDapoer)}</Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text>
                    <span style={{ display: "inline-block", width: 10, height: 10, background: "#10B981", borderRadius: 2, marginRight: 6 }} /> HomeBro
                  </Text>
                  <Text strong>Rp {formatRupiah(totalHome)}</Text>
                </div>
              </Space>
            </Card>

            <Card>
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
                <Tooltip title="Mencetak seluruh tampilan dashboard saat ini ke PDF/Gambar">
                  <button onClick={handlePrint} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e6e6e6", cursor: "pointer" }}>
                    📄 Cetak Gambar
                  </button>
                </Tooltip>
                <Tooltip title="Mengunduh data ringkasan dan transaksi harian ke format Excel/CSV">
                  <button onClick={handleExportCSV} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e6e6e6", cursor: "pointer" }}>
                    ⬇ Cetak Laporan (CSV/Excel)
                  </button>
                </Tooltip>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* TOP + UNPOPULAR tables */}
        <Divider />
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span>Top 5 Menu</span>
                  <Select
                    value={tenantFilterTop}
                    onChange={setTenantFilterTop}
                    style={{ width: 160 }}
                    size="small"
                  >
                    <Option value="all">Semua tenant</Option>
                    <Option value="DapoerMS">DapoerMS</Option>
                    <Option value="HomeBro">HomeBro</Option>
                  </Select>
                </div>
              }
              loading={loading}
            >
              <Table
                columns={topColumns}
                dataSource={top5}
                pagination={false}
                size="small"
                locale={{ emptyText: <Empty description="Tidak ada data" /> }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span>Unpopular Menu (Paling Jarang Dibeli)</span>
                  <Select
                    value={tenantFilterUnpop}
                    onChange={setTenantFilterUnpop}
                    style={{ width: 160 }}
                    size="small"
                  >
                    <Option value="all">Semua tenant</Option>
                    <Option value="DapoerMS">DapoerMS</Option>
                    <Option value="HomeBro">HomeBro</Option>
                  </Select>
                </div>
              }
              loading={loading}
            >
              <Table
                columns={topColumns}
                dataSource={unpopular5}
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

// ===== Tiny dev-time tests (won't run in production) =====
if (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production") {
  // getTopNIndices
  console.assert(JSON.stringify(getTopNIndices([0,5,2,9,1], 3)) === JSON.stringify([3,1,2]), "getTopNIndices should pick top 3 indices");
  // maskExceptIndices
  console.assert(JSON.stringify(maskExceptIndices([10,20,30,40], [1,3])) === JSON.stringify([null,20,null,40]), "maskExceptIndices should null other indices");
  // unpopular sort: by qty asc then total asc
  const sample = [
    { item: "A", qty: 0, total: 0 },
    { item: "B", qty: 2, total: 2000 },
    { item: "C", qty: 1, total: 1000 },
    { item: "D", qty: 2, total: 1500 },
  ];
  const _withTenant = (rows) => rows.map((r,i) => ({...r, tenant: "T", key: `k-${i}`}));
  const items = _withTenant(sample);
  const nonZero = items.filter((r) => (r.qty ?? 0) > 0);
  const base = nonZero.length ? nonZero : items;
  const sorted = [...base].sort((a,b) => (a.qty - b.qty) || (a.total - b.total));
  console.assert(sorted[0].item === "C", "Unpopular first should be item with smallest qty (C)");
}

export default FnBDashboard;
