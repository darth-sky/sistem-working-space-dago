import React, { useEffect, useMemo, useState } from "react";
import {
  ConfigProvider, Row, Col, Card, Statistic, Space, Table,
  Divider, Typography, Tooltip, Empty, DatePicker, Select, message,
} from "antd";
import locale from "antd/locale/id_ID";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  ShopOutlined, FieldTimeOutlined, UsergroupAddOutlined, ArrowUpOutlined,
} from "@ant-design/icons";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip as ChartTooltip, Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { getDashboardSummary } from "../../../services/service";

dayjs.locale("id");

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, ChartTooltip, Legend, ChartDataLabels
);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const formatRupiah = (n) => new Intl.NumberFormat("id-ID").format(Math.round(Number(n) || 0));

const Laporan = () => {
  const [dateRange, setDateRange] = useState([dayjs().startOf("month"), dayjs()]);
  const [loading, setLoading] = useState(false);

  // state dari API
  const [totals, setTotals] = useState({
    total_fnb: 0, total_ws: 0, total_sales: 0,
    total_transactions: 0, avg_daily: 0, total_days: 0,
  });
  const [dailySales, setDailySales] = useState([]); 
  const [visitorsByHour, setVisitorsByHour] = useState([]); 
  const [bookingsByHour, setBookingsByHour] = useState([]); 
  const [topFnb, setTopFnb] = useState([]);
  const [topWs, setTopWs] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const start = dateRange[0].format("YYYY-MM-DD");
        const end = dateRange[1].format("YYYY-MM-DD");
        const resp = await getDashboardSummary(start, end);

        const d = resp?.datas || {};
        setTotals({
          total_fnb: Number(d?.totals?.total_fnb || 0),
          total_ws: Number(d?.totals?.total_ws || 0),
          total_sales: Number(d?.totals?.total_sales || 0),
          total_transactions: Number(d?.totals?.total_transactions || 0),
          avg_daily: Number(d?.totals?.avg_daily || 0),
          total_days: Number(d?.totals?.total_days || 0),
        });
        setDailySales(Array.isArray(d?.daily_sales) ? d.daily_sales : []);
        setVisitorsByHour(Array.isArray(d?.visitors_by_hour) ? d.visitors_by_hour : []);
        setBookingsByHour(Array.isArray(d?.bookings_by_hour) ? d.bookings_by_hour : []);
        setTopFnb(Array.isArray(d?.top_fnb) ? d.top_fnb : []);
        setTopWs(Array.isArray(d?.top_ws) ? d.top_ws : []);
      } catch (e) {
        console.error(e);
        message.error("Gagal memuat data laporan");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [dateRange]);

  // === Chart builders ===
  const lineLabels = useMemo(
    () => dailySales.map((d) => dayjs(d.tanggal).format("D")),
    [dailySales]
  );
  const fnbSeries = useMemo(() => dailySales.map((d) => Number(d.fnb || 0)), [dailySales]);
  const wsSeries  = useMemo(() => dailySales.map((d) => Number(d.ws || 0)),  [dailySales]);

  const lineData = {
    labels: lineLabels,
    datasets: [
      { label: "FNB", data: fnbSeries, fill: false, borderColor: "#2563eb", tension: 0.2, pointRadius: 3 },
      { label: "Working Space", data: wsSeries, fill: false, borderColor: "#10B981", tension: 0.2, pointRadius: 3 },
    ],
  };

  const doughnutData = {
    labels: ["FNB (Tenant)", "Working Space"],
    datasets: [{ data: [totals.total_fnb, totals.total_ws], backgroundColor: ["#2563eb", "#10B981"], hoverOffset: 8 }],
  };

  const hourLabels = Array.from({ length: 15 }, (_, i) => `${8+i}:00`);
  const visitorsMap = new Map(visitorsByHour.map((r) => [Number(r.hour), Number(r.count)]));
  const bookingsMap = new Map(bookingsByHour.map((r) => [Number(r.hour), Number(r.count)]));
  const visitorsData = hourLabels.map((_, h) => visitorsMap.get(h) || 0);
  const bookingsData = hourLabels.map((_, h) => bookingsMap.get(h) || 0);

  const trafficBarData = { labels: hourLabels, datasets: [{ label: "Pengunjung (jumlah transaksi)", data: visitorsData, backgroundColor: "#2563eb" }] };
  const peakBarData    = { labels: hourLabels, datasets: [{ label: "Booking", data: bookingsData, backgroundColor: "#10B981" }] };

  const chartOptionsNoDatalabels = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      datalabels: { display: false },
      tooltip: { callbacks: { label: (ctx) => {
        let label = ctx.dataset.label || ""; if (label) label += ": ";
        if (ctx.parsed?.y != null) label += `Rp ${formatRupiah(ctx.parsed.y)}`;
        return label;
      }}}
    },
    scales: { y: { beginAtZero: true, ticks: { callback: (v) => `Rp ${formatRupiah(v)}` } } }
  };
  const lineChartOptions = { ...chartOptionsNoDatalabels };
  const trafficBarOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, datalabels: { display: false },
      tooltip: { callbacks: { label: (ctx) => {
        let label = ctx.dataset.label || ""; if (label) label += ": ";
        if (ctx.parsed?.y != null) label += `${formatRupiah(ctx.parsed.y)} pengunjung`;
        return label;
      }}}
    },
    scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatRupiah(v) } } }
  };
  const peakBarOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, datalabels: { display: false },
      tooltip: { callbacks: { label: (ctx) => {
        let label = ctx.dataset.label || ""; if (label) label += ": ";
        if (ctx.parsed?.y != null) label += `${formatRupiah(ctx.parsed.y)} booking`;
        return label;
      }}}
    },
    scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatRupiah(v) } } }
  };
  const doughnutOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      datalabels: {
        color: "#fff",
        formatter: (value, context) => {
          const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          return total ? ((value / total) * 100).toFixed(1) + "%" : "0%";
        },
        font: { weight: "bold", size: 14 },
      },
      tooltip: { callbacks: { label: (ctx) => {
        const value = ctx.parsed || 0;
        const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
        const pct = total ? ((value / total) * 100).toFixed(1) : 0;
        return `${ctx.label}: Rp ${formatRupiah(value)} (${pct}%)`;
      }}}
    },
  };

  const columns = [
    { title: "Menu/Item", dataIndex: "item", key: "item" },
    { title: "Jumlah Terjual", dataIndex: "qty", key: "qty", align: "right", render: (v)=> formatRupiah(v) },
    { title: "Total Penjualan (Rp)", dataIndex: "total", key: "total", align: "right", render: (t)=> `Rp ${formatRupiah(t)}` },
  ];

  const handlePrint = () => window.print();
  const handleExportCSV = () => message.info("Proses ekspor CSV dimulai...");

  const totalDays = totals.total_days || Math.max(1, dateRange[1].diff(dateRange[0], "day") + 1);

  return (
    <ConfigProvider locale={locale}>
      <div style={{ padding: 20 }}>
        {/* Header */}
        <Row gutter={[16, 16]} justify="space-between" align="middle" style={{ marginBottom: 12 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>Dashboard Laporan</Title>
            <Text type="secondary">Dago Creative Hub & Coffee Lab</Text>
          </Col>
          <Col>
            <Space align="center">
              <Text type="secondary">Rentang:</Text>
              <RangePicker
                value={dateRange}
                onChange={(vals) => vals && setDateRange([vals[0].startOf("day"), vals[1].endOf("day")])}
                format="DD-MM-YYYY"
              />
              <Select
                defaultValue="mtm"
                style={{ width: 140 }}
                onChange={(val) =>
                  val === "lw"
                    ? setDateRange([dayjs().subtract(7, "day"), dayjs()])
                    : setDateRange([dayjs().startOf("month"), dayjs()])
                }
                options={[{ value: "mtm", label: "Month to date" }, { value: "lw", label: "Last 7d" }]}
              />
            </Space>
          </Col>
        </Row>

        <div className="flex justify-start gap-2 mb-4">
          <a href="/laporan" className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 bg-blue-50 text-blue-600 hover:bg-gray-100">Laporan</a>
          <a href="/fnbdashboard" className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100">FNB</a>
          <a href="/workingspace" className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100">Working Space</a>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}><Statistic title="Total Penjualan" value={`Rp ${formatRupiah(totals.total_sales)}`} prefix={<ShopOutlined />} /></Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}><Statistic title="Total Pengunjung" value={formatRupiah(visitorsByHour.reduce((s, r) => s + (r.count || 0), 0))} prefix={<UsergroupAddOutlined />} /></Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}><Statistic title="Jumlah Transaksi" value={totals.total_transactions} prefix={<FieldTimeOutlined />} /></Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}><Statistic title="Rata-rata Harian" value={`Rp ${formatRupiah(totals.avg_daily)}`} prefix={<ArrowUpOutlined />} /></Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card style={{ marginBottom: 16 }} loading={loading}>
              <Row gutter={[12, 12]}>
                <Col span={24} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Title level={5} style={{ margin: 0 }}>Daily Selling</Title>
                  <Text type="secondary">
                    {dateRange[0].format("D MMM")} - {dateRange[1].format("D MMM YYYY")}
                  </Text>
                </Col>
                <Col span={24}>
                  <div style={{ height: 300 }}>
                    <Line data={lineData} options={lineChartOptions} />
                  </div>
                </Col>
              </Row>
            </Card>

            <Card style={{ marginBottom: 16 }} loading={loading}>
              <Title level={5}>Total Pengunjung Setiap Jam</Title>
              <Text type="secondary">Akumulasi transaksi per jam dalam periode {totalDays} hari.</Text>
              <div style={{ height: 300, marginTop: 10 }}>
                <Bar data={trafficBarData} options={trafficBarOptions} />
              </div>
            </Card>

            <Card style={{ marginBottom: 16 }} loading={loading}>
              <Title level={5}>Peak Hours Booking</Title>
              <Text type="secondary">Jumlah booking aktif per jam.</Text>
              <div style={{ height: 220, marginTop: 10 }}>
                <Bar data={peakBarData} options={peakBarOptions} />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card style={{ marginBottom: 16 }} loading={loading}>
              <Title level={5}>Kontribusi Space (Revenue)</Title>
              <div style={{ height: 220 }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </Card>

            <Card>
              <Title level={5}>Quick Actions</Title>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Tooltip title="Mencetak seluruh tampilan dashboard saat ini ke PDF/Gambar">
                  <button onClick={handlePrint} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e6e6e6", cursor: "pointer" }}>
                    📄 Cetak Laporan (Gambar)
                  </button>
                </Tooltip>
                <Tooltip title="Mengunduh data ringkasan dan transaksi harian ke format Excel/CSV">
                  <button onClick={handleExportCSV} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e6e6e6", cursor: "pointer" }}>
                    ⬇ Export Data (CSV/Excel)
                  </button>
                </Tooltip>
              </Space>
            </Card>
          </Col>
        </Row>

        <Divider />
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Top 10 FNB" loading={loading}>
              <Table
                columns={columns}
                dataSource={topFnb}
                rowKey={(r, i) => `${r.item}-${i}`}
                pagination={false}
                size="small"
                locale={{ emptyText: <Empty description="Tidak ada data" /> }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Top 5 Working Space" loading={loading}>
              <Table
                columns={columns}
                dataSource={topWs}
                rowKey={(r, i) => `${r.item}-${i}`}
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

export default Laporan;