import React, { useEffect, useState, useMemo } from "react";
import {
  ConfigProvider,
  DatePicker,
  Row,
  Col,
  Card,
  Statistic,
  Space,
  Tag,
  Divider,
  Typography,
  Table,
  Empty,
  Spin,
  Alert,
} from "antd";
import locale from "antd/locale/id_ID";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import { getWorkingSpaceDashboardData } from "../../../services/service";
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
  FieldTimeOutlined,
  UsergroupAddOutlined,
  DollarCircleOutlined,
} from "@ant-design/icons";

dayjs.locale("id");

if (typeof window !== "undefined" && window.ChartDataLabels) {
  ChartJS.register(window.ChartDataLabels);
}
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

const formatRupiah = (num) => {
  if (num === null || num === undefined || Number.isNaN(Number(num))) return "0";
  return new Intl.NumberFormat("id-ID").format(Math.round(Number(num)));
};

// util untuk Peak Durations
const getTopNIndices = (arr, n = 3) =>
  arr
    .map((v, i) => ({ v: Number(v) || 0, i }))
    .filter((o) => o.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, n)
    .map((o) => o.i);

const maskExceptIndices = (arr, indices) => {
  const keep = new Set(indices);
  return arr.map((v, i) => (keep.has(i) ? v : null)); // null = bar lain disembunyikan
};

const WorkingSpace = () => {
  const [dateRange, setDateRange] = useState([dayjs().startOf("month"), dayjs()]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const startDate = dateRange[0].format("YYYY-MM-DD");
        const endDate = dateRange[1].format("YYYY-MM-DD");
        const data = await getWorkingSpaceDashboardData(startDate, endDate);
        setDashboardData(data);
      } catch (err) {
        setError(err.message || "Gagal memuat data. Coba lagi nanti.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  // Stats
  const stats = useMemo(
    () =>
      dashboardData?.stats || {
        totalRevenue: 0,
        totalBookings: 0,
        totalVisitors: 0,
      },
    [dashboardData]
  );
  const totalDays = Math.max(1, dateRange[1].diff(dateRange[0], "day") + 1);
  const avgDaily = Math.round((stats.totalRevenue || 0) / totalDays) || 0;

  // Line (daily booking count per category) — label X = 1..N
  const lineData = useMemo(() => {
    const daily = dashboardData?.dailyRevenue;
    if (!daily || !daily.datasets) return { labels: [], datasets: [] };

    const baseLabels = daily.labels || daily.labelsPretty || [];
    const n = baseLabels.length;
    const numericLabels = Array.from({ length: n }, (_, i) => String(i + 1));

    const meetingRoomData = (daily.datasets["Room Meeting Besar"] || []).map(
      (val, i) => (val || 0) + (daily.datasets["Room Meeting Kecil"]?.[i] || 0)
    );

    return {
      labels: numericLabels,
      datasets: [
        {
          label: "Open Space",
          data: daily.datasets["Open Space"] || [],
          fill: false,
          borderColor: "#2563eb",
          tension: 0.2,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: "Space Monitor",
          data: daily.datasets["Space Monitor"] || [],
          fill: false,
          borderColor: "#10B981",
          tension: 0.2,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: "Meeting Room",
          data: meetingRoomData,
          fill: false,
          borderColor: "#F59E0B",
          tension: 0.2,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [dashboardData]);

  // Doughnut (revenue contribution)
  const doughnutData = useMemo(() => {
    const contribution = dashboardData?.categoryContribution || [];
    if (!contribution.length) return { labels: [], datasets: [{ data: [] }] };

    const dataMap = contribution.reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || 0) + (item.value || 0);
      return acc;
    }, {});

    const totalMeetingRoom =
      (dataMap["Room Meeting Besar"] || 0) + (dataMap["Room Meeting Kecil"] || 0);

    return {
      labels: ["Open Space", "Space Monitor", "Meeting Room"],
      datasets: [
        {
          data: [dataMap["Open Space"] || 0, dataMap["Space Monitor"] || 0, totalMeetingRoom],
          backgroundColor: ["#2563eb", "#10B981", "#F59E0B"],
          hoverOffset: 8,
        },
      ],
    };
  }, [dashboardData]);

  const totalOpenSpace = doughnutData.datasets?.[0]?.data?.[0] || 0;
  const totalSpaceMonitor = doughnutData.datasets?.[0]?.data?.[1] || 0;
  const totalMeetingRoom = doughnutData.datasets?.[0]?.data?.[2] || 0;

  // Trafik Pengguna (Per Durasi) — hanya paket dari DB
  const trafficByDurationData = useMemo(() => {
    const paket = dashboardData?.packageByDuration ?? [];

    if (!paket.length) {
      const fallbackDur = [2, 3, 6, 8];
      return {
        labels: fallbackDur.map((d) => `${d} Jam`),
        datasets: [
          {
            label: "Jumlah Pengguna",
            data: [0, 0, 0, 0],
            backgroundColor: "#2563eb",
            borderWidth: 1,
          },
        ],
      };
    }

    const sorted = [...paket].sort(
      (a, b) => Number(a?.durasi_jam ?? 0) - Number(b?.durasi_jam ?? 0)
    );

    return {
      labels: sorted.map((p) => `${Number(p?.durasi_jam ?? 0)} Jam`),
      datasets: [
        {
          label: "Jumlah Pengguna",
          data: sorted.map((p) => parseInt(p?.total_user ?? p?.total_booking ?? 0, 10)),
          backgroundColor: "#2563eb",
          borderWidth: 1,
        },
      ],
    };
  }, [dashboardData]);

  // Peak Durations – Top 3 jumlah booking
  const peakBarData = useMemo(() => {
    const rows = dashboardData?.packageByDuration || [];
    if (!rows.length) return { labels: [], datasets: [] };

    const labelsAll = rows.map((r) =>
      r?.durasi_jam != null ? `${r.durasi_jam} Jam` : "Paket"
    );
    const bookingsAll = rows.map((r) => Number(r?.total_booking || 0));

    const idxTop3 = getTopNIndices(bookingsAll, 3);
    const maskedBookings = maskExceptIndices(bookingsAll, idxTop3);

    return {
      labels: labelsAll,
      datasets: [
        {
          label: "Jumlah Booking per Durasi (Top 3)",
          data: maskedBookings,
          backgroundColor: "#EF4444",
        },
      ],
    };
  }, [dashboardData]);

  // Chart Options
  const nonDoughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        datalabels: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => {
              const idx = items?.[0]?.dataIndex ?? 0;
              const pretty =
                dashboardData?.dailyRevenue?.labelsPretty?.[idx] ||
                dashboardData?.dailyRevenue?.labels?.[idx];
              return pretty || String(idx + 1);
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            callback: (val, idx, ticks) => ticks?.[idx]?.label ?? val,
          },
          title: { display: true, text: "Tanggal" },
        },
        y: {
          ticks: { callback: (v) => `${Math.trunc(v)}` },
        },
      },
    }),
    [dashboardData]
  );

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
            return `${ctx.label}: Rp ${formatRupiah(value)} (${pct}%)`;
          },
        },
      },
      datalabels: {
        formatter: (value, ctx) => {
          const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          return total === 0 ? "0.0%" : ((value / total) * 100).toFixed(1) + "%";
        },
        color: "#fff",
        font: { weight: "bold", size: 16 },
      },
    },
  };

  const trafficBarOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, datalabels: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Jumlah Pengguna" },
        ticks: { callback: (v) => `${Math.trunc(v)}` },
      },
      x: { title: { display: true, text: "Durasi (Jam)" } },
    },
  };

  const peakBarOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: {
        filter: (ctx) => ctx.raw != null, // hanya bar yang tidak null
        callbacks: {
          label: (ctx) => `Booking: ${Math.trunc(Number(ctx.parsed?.y ?? 0))}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Jumlah Booking" },
        ticks: { callback: (v) => `${Math.trunc(v)}` },
      },
      x: { title: { display: true, text: "Durasi Paket" } },
    },
  };

  const topColumns = [
    { title: "Nama Space", dataIndex: "item", key: "item" },
    {
      title: "Kategori",
      dataIndex: "category",
      key: "category",
      width: 150,
      render: (text) => (
        <Tag
          color={
            text.includes("Open Space")
              ? "blue"
              : text.includes("Space Monitor")
              ? "green"
              : text.includes("Meeting Room")
              ? "gold"
              : "orange"
          }
        >
          {text}
        </Tag>
      ),
    },
    {
      title: "Qty Booking",
      dataIndex: "qty",
      key: "qty",
      align: "center",
      width: 120,
    },
    {
      title: "Total(Rp)",
      dataIndex: "total",
      key: "total",
      align: "right",
      width: 180,
      render: (t) => <b>Rp {formatRupiah(t)}</b>,
    },
  ];

  return (
    <ConfigProvider locale={locale}>
      <div style={{ padding: 20 }}>
        {/* Header */}
        <Row
          gutter={[16, 16]}
          justify="space-between"
          align="middle"
          style={{ marginBottom: 14 }}
        >
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              Working Space Dashboard
            </Title>
            <Text type="secondary">Dago Creative Hub & Coffee Lab — Working Space</Text>
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
                disabled={loading}
              />
            </Space>
          </Col>
        </Row>

        {/* Quick Links */}
        <div className="flex justify-start gap-2 mb-4">
          <a
            href="/laporan"
            className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Laporan
          </a>
          <a
            href="/fnbdashboard"
            className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            FNB
          </a>
          <a
            href="/workingspace"
            className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            Working Space
          </a>
          <a
            href="/laporanpajak"
            className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Laporan Pajak
          </a>
        </div>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Statistic Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <Spin spinning={loading}>
                  <Statistic
                    title="Total Pendapatan"
                    value={`Rp ${formatRupiah(stats.totalRevenue)}`}
                    prefix={<DollarCircleOutlined />}
                  />
                </Spin>
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card>
                <Spin spinning={loading}>
                  <Statistic
                    title="Total Pengunjung"
                    value={formatRupiah(stats.totalVisitors)}
                    prefix={<UsergroupAddOutlined />}
                  />
                </Spin>
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <Spin spinning={loading}>
                  <Statistic
                    title="Jumlah Booking"
                    value={stats.totalBookings}
                    prefix={<FieldTimeOutlined />}
                  />
                </Spin>
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <Spin spinning={loading}>
                  <Statistic
                    title="Rata-rata Harian"
                    value={`Rp ${formatRupiah(avgDaily)}`}
                    prefix={<ArrowUpOutlined />}
                  />
                </Spin>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Charts */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card style={{ marginBottom: 16 }}>
              <Spin spinning={loading}>
                <Title level={5}>Daily Booking (per Space Category)</Title>
                <div style={{ height: 300 }}>
                  <Line data={lineData} options={nonDoughnutOptions} />
                </div>
              </Spin>
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <Spin spinning={loading}>
                <Title level={5}>Trafik Pengguna (Per Durasi)</Title>
                <div style={{ height: 300, marginTop: 10 }}>
                  <Bar data={trafficByDurationData} options={trafficBarOptions} />
                </div>
              </Spin>
            </Card>

            <Card>
              <Spin spinning={loading}>
                <Title level={5}>Peak Durasi (Top 3 Booking)</Title>
                <Text type="secondary">
                  Menampilkan 3 paket durasi dengan jumlah booking/sewa terbanyak pada
                  periode {totalDays} hari.
                </Text>
                <div style={{ height: 220, marginTop: 10 }}>
                  <Bar data={peakBarData} options={peakBarOptions} />
                </div>
              </Spin>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card>
              <Spin spinning={loading}>
                <Title level={5}>Kontribusi Space</Title>
                <div style={{ height: 220 }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
                <Divider />
                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text>
                      <Tag color="#2563eb" /> Open Space
                    </Text>
                    <Text strong>Rp {formatRupiah(totalOpenSpace)}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text>
                      <Tag color="#10B981" /> Space Monitor
                    </Text>
                    <Text strong>Rp {formatRupiah(totalSpaceMonitor)}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text>
                      <Tag color="#F59E0B" /> Meeting Room
                    </Text>
                    <Text strong>Rp {formatRupiah(totalMeetingRoom)}</Text>
                  </div>
                </Space>
              </Spin>
            </Card>
          </Col>
        </Row>

        {/* Top 10 Working Spaces */}
        <Card style={{ marginTop: 16 }}>
          <Spin spinning={loading}>
            <Title level={5}>Top 10 Working Spaces</Title>
            {(dashboardData?.topSpaces || []).length > 0 ? (
              <Table
                dataSource={dashboardData.topSpaces}
                columns={topColumns}
                pagination={false}
                rowKey={(r) => `${r.item}-${r.category}`}
                scroll={{ x: "max-content" }}
              />
            ) : (
              !loading && <Empty description="Tidak ada data" />
            )}
          </Spin>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default WorkingSpace;
