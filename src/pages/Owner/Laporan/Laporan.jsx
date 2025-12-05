import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  ConfigProvider,
  Row,
  Col,
  Card,
  Statistic,
  Space,
  Table,
  Divider,
  Typography,
  Tooltip,
  Empty,
  DatePicker,
  Select,
  message,
} from "antd";
import locale from "antd/locale/id_ID";
import dayjs from "dayjs";
import "dayjs/locale/id";
import html2canvas from "html2canvas-pro";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  ShopOutlined,
  FieldTimeOutlined,
  UsergroupAddOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { getDashboardSummary } from "../../../services/service";

dayjs.locale("id");

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  ChartTooltip,
  Legend,
  ChartDataLabels
);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID").format(Math.round(Number(n) || 0));

// ===== Helpers =====
const getTopNIndices = (arr, n = 3) =>
  arr
    .map((v, i) => ({ v: Number(v) || 0, i }))
    .sort((a, b) => b.v - a.v)
    .slice(0, n)
    .map((o) => o.i);

const maskExceptIndices = (arr, indices) => {
  const keep = new Set(indices);
  return arr.map((v, i) => (keep.has(i) ? v : null));
};

const Laporan = () => {
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs(),
  ]);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);

  // state dari API
  const [totals, setTotals] = useState({
    total_fnb: 0,
    total_ws: 0,
    total_sales: 0,
    total_tax: 0, // Ditambahkan untuk perhitungan bersih
    total_transactions: 0,
    total_visitors: 0,
    avg_daily: 0,
    total_days: 0,
  });
  const [dailySales, setDailySales] = useState([]);
  const [visitorsByHour, setVisitorsByHour] = useState([]);
  const [topFnb, setTopFnb] = useState([]);
  const [topWs, setTopWs] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [tenantContribution, setTenantContribution] = useState([]);

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
          total_tax: Number(d?.totals?.total_tax || 0), // Ambil Tax dari API
          total_transactions: Number(d?.totals?.total_transactions || 0),
          total_visitors: Number(d?.totals?.total_visitors || 0),
          avg_daily: Number(d?.totals?.avg_daily || 0),
          total_days: Number(d?.totals?.total_days || 0),
        });
        setDailySales(Array.isArray(d?.daily_sales) ? d.daily_sales : []);
        setVisitorsByHour(
          Array.isArray(d?.visitors_by_hour) ? d.visitors_by_hour : []
        );
        setTopFnb(Array.isArray(d?.top_fnb) ? d.top_fnb : []);
        setTopWs(
          Array.isArray(d?.top_ws)
            ? [...d.top_ws].sort(
                (a, b) => Number(b.qty || 0) - Number(a.qty || 0)
              )
            : []
        );
        setPaymentBreakdown(
          Array.isArray(d?.payment_breakdown) ? d.payment_breakdown : []
        );

        setTenantContribution(
          Array.isArray(d?.tenant_contribution) ? d.tenant_contribution : []
        );
      } catch (e) {
        console.error(e);
        message.error("Gagal memuat data laporan");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [dateRange]);

  // === PERHITUNGAN BERSIH ===
  const totalPendapatanBersih = totals.total_sales - totals.total_tax;

  // === Chart builders ===
  const lineLabels = useMemo(
    () => dailySales.map((d) => dayjs(d.tanggal).format("D")),
    [dailySales]
  );
  const fnbSeries = useMemo(
    () => dailySales.map((d) => Number(d.fnb || 0)),
    [dailySales]
  );
  const wsSeries = useMemo(
    () => dailySales.map((d) => Number(d.ws || 0)),
    [dailySales]
  );

  const lineData = {
    labels: lineLabels,
    datasets: [
      {
        label: "FNB",
        data: fnbSeries,
        fill: false,
        borderColor: "#2563eb",
        tension: 0.2,
        pointRadius: 3,
      },
      {
        label: "Working Space",
        data: wsSeries,
        fill: false,
        borderColor: "#10B981",
        tension: 0.2,
        pointRadius: 3,
      },
    ],
  };

  const doughnutData = {
    labels: ["FNB", "Working Space"],
    datasets: [
      {
        data: [totals.total_fnb, totals.total_ws],
        backgroundColor: ["#2563eb", "#10B981"],
        hoverOffset: 8,
      },
    ],
  };

  // jam operasional (8 s/d 22)
  const hourLabels = Array.from({ length: 15 }, (_, i) => `${8 + i}:00`);
  const hours = Array.from({ length: 15 }, (_, i) => 8 + i);

  const visitorsMap = new Map(
    visitorsByHour.map((r) => [Number(r.hour), Number(r.count)])
  );
  const visitorsData = hours.map((H) => visitorsMap.get(H) || 0);

  const topPeakIdx = useMemo(
    () => getTopNIndices(visitorsData, 3),
    [visitorsData]
  );
  const peakOnly = useMemo(
    () => maskExceptIndices(visitorsData, topPeakIdx),
    [visitorsData, topPeakIdx]
  );

  const chartOptionsNoDatalabels = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      datalabels: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            let label = ctx.dataset.label || "";
            if (label) label += ": ";
            if (ctx.parsed?.y != null)
              label += `Rp ${formatRupiah(ctx.parsed.y)}`;
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v) => `Rp ${formatRupiah(v)}` },
      },
      x: { title: { display: true, text: "Tanggal" } },
    },
  };
  const lineChartOptions = { ...chartOptionsNoDatalabels };

  const trafficBarOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            let label = ctx.dataset.label || "";
            if (label) label += ": ";
            if (ctx.parsed?.y != null)
              label += `${formatRupiah(ctx.parsed.y)} kunjungan`;
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v) => formatRupiah(v) },
        title: { display: true, text: "Jumlah Kunjungan" },
      },
      x: { title: { display: true, text: "Jam" } },
    },
  };

  const peakBarOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: {
        filter: (ctx) => ctx.parsed?.y != null,
        callbacks: {
          label: (ctx) => {
            let label = ctx.dataset.label || "";
            if (label) label += ": ";
            if (ctx.parsed?.y != null)
              label += `${formatRupiah(ctx.parsed.y)} kunjungan`;
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v) => formatRupiah(v) },
        title: { display: true, text: "Jumlah Kunjungan" },
      },
      x: { title: { display: true, text: "Jam" } },
    },
  };

  const totalDays =
    totals.total_days ||
    Math.max(1, dateRange[1].diff(dateRange[0], "day") + 1);

  // === Capture to Image Handler ===
  const handleCaptureImage = async () => {
    try {
      const node = document.getElementById("capture-area");

      if (!node) {
        message.error("Area cetak tidak ditemukan");
        return;
      }

      await new Promise((r) => setTimeout(r, 400));

      const canvas = await html2canvas(node, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `laporan-summary-${dayjs().format("YYYYMMDD-HHmm")}.png`;
      link.click();
    } catch (err) {
      console.error(err);
      message.error("Gagal mencetak gambar");
    }
  };

  // === Export to Excel Handler (PERBAIKAN FULL) ===
  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();

      const borderStyle = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      const headerFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF4A460" },
      };

      const Rp = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID", { minimumFractionDigits: 0 })}`;

      // --- SHEET 1: RINGKASAN ---
      const sheetSummary = workbook.addWorksheet("Ringkasan");
      
      sheetSummary.mergeCells("A1:E1");
      sheetSummary.getCell("A1").value = "RINGKASAN LAPORAN OWNER";
      sheetSummary.getCell("A1").font = { bold: true, size: 14 };
      sheetSummary.getCell("A1").alignment = { horizontal: "center" };
      sheetSummary.getCell("A1").fill = headerFill;

      sheetSummary.mergeCells("A2:E2");
      sheetSummary.getCell("A2").value = `Periode: ${dateRange[0].format("DD/MM/YYYY")} s/d ${dateRange[1].format("DD/MM/YYYY")}`;
      sheetSummary.getCell("A2").alignment = { horizontal: "center" };

      sheetSummary.addRow([]);
      
      const kpiData = [
        ["Total Penjualan (Net)", Rp(totalPendapatanBersih)],
        ["Total Pajak", Rp(totals.total_tax)],
        ["Total Transaksi", totals.total_transactions],
        ["Total Pengunjung", totals.total_visitors],
        ["Rata-rata Harian", Rp(totals.avg_daily)],
      ];

      kpiData.forEach(row => {
        const r = sheetSummary.addRow(row);
        r.getCell(1).font = { bold: true };
      });

      sheetSummary.addRow([]);
      sheetSummary.addRow(["Metode Pembayaran"]).font = { bold: true };
      paymentBreakdown.forEach(p => {
        sheetSummary.addRow([p.method, Rp(p.total)]);
      });

      sheetSummary.getColumn(1).width = 25;
      sheetSummary.getColumn(2).width = 25;

      // --- SHEET 2: PENJUALAN HARIAN ---
      const sheetDaily = workbook.addWorksheet("Penjualan Harian");
      const dailyHeader = ["Tanggal", "FNB", "Working Space", "Total Harian"];
      const dhRow = sheetDaily.addRow(dailyHeader);
      dhRow.font = { bold: true };
      dhRow.eachCell(c => { c.border = borderStyle; c.fill = headerFill; });

      dailySales.forEach(d => {
        const row = sheetDaily.addRow([
          dayjs(d.tanggal).format("DD/MM/YYYY"),
          Rp(d.fnb),
          Rp(d.ws),
          Rp(d.all)
        ]);
        row.eachCell(c => c.border = borderStyle);
      });
      sheetDaily.columns = [{width: 15}, {width: 20}, {width: 20}, {width: 20}];

      // --- SHEET 3: TOP PERFORMERS ---
      const sheetTop = workbook.addWorksheet("Top Menu & WS");
      
      sheetTop.addRow(["TOP 10 F&B"]).font = { bold: true, size: 12 };
      const fnbHeader = ["Menu", "Tenant", "Qty", "Total Penjualan"];
      const fhRow = sheetTop.addRow(fnbHeader);
      fhRow.font = { bold: true };
      fhRow.eachCell(c => c.border = borderStyle);

      topFnb.forEach(f => {
        const r = sheetTop.addRow([f.item, f.tenant, f.qty, Rp(f.total)]);
        r.eachCell(c => c.border = borderStyle);
      });

      sheetTop.addRow([]);
      sheetTop.addRow(["TOP 5 WORKING SPACE"]).font = { bold: true, size: 12 };
      const wsHeader = ["Kategori", "Qty", "Total Penjualan"];
      const whRow = sheetTop.addRow(wsHeader);
      whRow.font = { bold: true };
      whRow.eachCell((c, i) => { if (i <= 3) c.border = borderStyle; });

      topWs.forEach(w => {
        const r = sheetTop.addRow([w.item, w.qty, Rp(w.total)]);
        r.eachCell((c, i) => { if (i <= 3) c.border = borderStyle; });
      });

      sheetTop.columns = [{width: 30}, {width: 20}, {width: 10}, {width: 20}];

      // --- GENERATE FILE ---
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer]),
        `Laporan_Summary_${dateRange[0].format("YYYYMMDD")}_${dateRange[1].format("YYYYMMDD")}.xlsx`
      );

      message.success("Laporan berhasil diunduh!");
    } catch (e) {
      console.error(e);
      message.error("Gagal membuat Excel: " + e.message);
    }
  };

  const paymentDoughnut = useMemo(() => {
    if (!paymentBreakdown || paymentBreakdown.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
          },
        ],
      };
    }

    const labels = paymentBreakdown.map((x) => x.method);
    const values = paymentBreakdown.map((x) => x.total);

    const COLORS = ["#2563eb", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: COLORS.slice(0, values.length),
          hoverOffset: 8,
        },
      ],
    };
  }, [paymentBreakdown]);

  const tenantPieData = useMemo(() => {
    if (!tenantContribution || tenantContribution.length === 0) {
      return { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
    }

    const BLUE_TONES = [
      "#1E3A8A",
      "#1D4ED8",
      "#3B82F6",
      "#60A5FA",
      "#93C5FD",
      "#0EA5E9",
      "#0284C7",
      "#2563EB",
      "#38BDF8",
      "#0EA5E9",
    ];

    const WS_COLOR = "#10B981";

    const labels = tenantContribution.map((t) => t.tenant);
    const values = tenantContribution.map((t) => t.nett);

    const colors = labels.map((name, i) => {
      if (name.toLowerCase().includes("working space")) {
        return WS_COLOR;
      }
      return BLUE_TONES[i % BLUE_TONES.length];
    });

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          hoverOffset: 8,
        },
      ],
    };
  }, [tenantContribution]);

  return (
    <ConfigProvider locale={locale}>
      <div style={{ padding: 20 }}>
        {/* Header */}
        <Row
          gutter={[16, 16]}
          justify="space-between"
          align="middle"
          style={{ marginBottom: 12 }}
        >
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              Dashboard Laporan
            </Title>
            <Text type="secondary">Dago Creative Hub & Coffee Lab</Text>
          </Col>
          <Col>
            <Space align="center">
              <Text type="secondary">Rentang:</Text>
              <RangePicker
                value={dateRange}
                onChange={(vals) => {
                  if (vals && vals[0] && vals[1]) {
                    setDateRange([
                      vals[0].startOf("day"),
                      vals[1].endOf("day"),
                    ]);
                  }
                }}
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
                options={[
                  { value: "mtm", label: "Month to date" },
                  { value: "lw", label: "Last 7d" },
                ]}
              />
            </Space>
          </Col>
        </Row>

        {/* Quick links */}
        <div className="flex justify-start gap-2 mb-4">
          <a
            href="/laporan"
            className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 bg-blue-50 text-blue-600 hover:bg-gray-100"
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
            className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Working Space
          </a>
          <a
            href="/laporanpajak"
            className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Pajak
          </a>
        </div>

        {/* KPI cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="Total Penjualan (Net)"
                value={`Rp ${formatRupiah(totalPendapatanBersih)}`}
                prefix={<ShopOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="Total Pengunjung"
                value={totals.total_visitors}
                prefix={<UsergroupAddOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="Jumlah Transaksi"
                value={totals.total_transactions}
                prefix={<FieldTimeOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="Rata-rata Harian"
                value={`Rp ${formatRupiah(totals.avg_daily)}`}
                prefix={<ArrowUpOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card style={{ marginBottom: 16 }} loading={loading}>
              <Row gutter={[12, 12]}>
                <Col
                  span={24}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Title level={5} style={{ margin: 0 }}>
                    Daily Selling
                  </Title>
                  <Text type="secondary">
                    {dateRange[0].format("D MMM")} -{" "}
                    {dateRange[1].format("D MMM YYYY")}
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
              <Title level={5}>Trafik Pengunjung per Jam</Title>
              <Text type="secondary">
                Akumulasi kunjungan selama periode {totalDays} hari.
              </Text>
              <div style={{ height: 300, marginTop: 10 }}>
                <Bar
                  data={{
                    labels: hourLabels,
                    datasets: [
                      {
                        label: "Pengunjung (jumlah transaksi)",
                        data: visitorsData,
                        backgroundColor: "#2563eb",
                      },
                    ],
                  }}
                  options={trafficBarOptions}
                />
              </div>
            </Card>

            <Card style={{ marginBottom: 16 }} loading={loading}>
              <Title level={5}>Peak Hours Visiting</Title>
              <Text type="secondary">
                Akumulasi tiga waktu puncak selama periode {totalDays} hari.
              </Text>
              <div style={{ height: 220, marginTop: 10 }}>
                <Bar
                  data={{
                    labels: hourLabels,
                    datasets: [
                      {
                        label: "Kunjungan (Top 3 Jam)",
                        data: peakOnly,
                        backgroundColor: "#10B981",
                      },
                    ],
                  }}
                  options={peakBarOptions}
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card style={{ marginBottom: 16 }} loading={loading}>
              <Title level={5}>Metode Pembayaran </Title>
              <Text type="secondary">
                Distribusi metode pembayaran semua transaksi lunas.
              </Text>

              <div style={{ height: 240, marginTop: 12 }}>
                {paymentBreakdown.length === 0 ? (
                  <Empty description="Tidak ada transaksi lunas" />
                ) : (
                  <Doughnut
                    data={paymentDoughnut}
                    options={{
                      maintainAspectRatio: false,
                      animation: false,
                      plugins: {
                        legend: { position: "bottom" },
                        datalabels: {
                          color: "#fff",
                          font: { weight: "bold" },
                          formatter: (value, ctx) => {
                            const total = ctx.dataset.data.reduce(
                              (s, v) => s + v,
                              0
                            );
                            if (!total) return "0%";
                            return ((value / total) * 100).toFixed(1) + "%";
                          },
                        },
                      },
                    }}
                  />
                )}
              </div>

              <Divider />

              {paymentBreakdown.map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text>{p.method}</Text>
                  <Text strong>Rp {formatRupiah(p.total)}</Text>
                </div>
              ))}
            </Card>

            <Card style={{ marginBottom: 16 }} loading={loading}>
              <Title level={5}>Kontribusi Tenant & Working Space</Title>

              <div style={{ height: 260 }}>
                <Doughnut
                  data={tenantPieData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "bottom" },
                      datalabels: {
                        color: "#fff",
                        formatter: (value, ctx) => {
                          const total = ctx.dataset.data.reduce(
                            (a, b) => a + b,
                            0
                          );
                          if (!total) return "0%";
                          return ((value / total) * 100).toFixed(1) + "%";
                        },
                      },
                    },
                  }}
                />
              </div>

              <Divider />

              <div>
                {tenantContribution.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <Text>{t.tenant}</Text>
                    <Text strong>Rp {formatRupiah(t.nett)}</Text>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <Title level={5}>Quick Actions</Title>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Tooltip title="Mencetak tampilan dashboard saat ini ke gambar PNG">
                  <button
                    onClick={handleCaptureImage}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #e6e6e6",
                      cursor: "pointer",
                    }}
                  >
                    📄 Cetak Gambar
                  </button>
                </Tooltip>
                <Tooltip title="Unduh seluruh data yang tampil ke Excel (multi-sheet)">
                  <button
                    onClick={handleExportExcel}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #e6e6e6",
                      cursor: "pointer",
                    }}
                  >
                    ⬇ Cetak Laporan (Excel)
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
                columns={[
                  { title: "Menu", dataIndex: "item", key: "item" },
                  {
                    title: "Tenant",
                    dataIndex: "tenant",
                    key: "tenant",
                    width: 140,
                  },
                  {
                    title: "Jumlah Terjual",
                    dataIndex: "qty",
                    key: "qty",
                    align: "right",
                    render: (v) => formatRupiah(v),
                  },
                  {
                    title: "Total Penjualan (Rp)",
                    dataIndex: "total",
                    key: "total",
                    align: "right",
                    render: (t) => `Rp ${formatRupiah(t)}`,
                  },
                ]}
                dataSource={topFnb}
                rowKey={(r) => `${r.item}-${r.tenant || ""}`}
                pagination={false}
                size="small"
                locale={{ emptyText: <Empty description="Tidak ada data" /> }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Top 5 Working Space" loading={loading}>
              <Table
                columns={[
                  {
                    title: "Kategori - Durasi",
                    dataIndex: "item",
                    key: "item",
                  },
                  {
                    title: "Jumlah Terjual",
                    dataIndex: "qty",
                    key: "qty",
                    align: "right",
                    render: (v) => formatRupiah(v),
                  },
                  {
                    title: "Total Penjualan (Rp)",
                    dataIndex: "total",
                    key: "total",
                    align: "right",
                    render: (t) => `Rp ${formatRupiah(t)}`,
                  },
                ]}
                dataSource={topWs}
                rowKey={(r) =>
                  `${r.item}-${String(r.qty)}-${String(r.total)}`
                }
                pagination={false}
                size="small"
                locale={{ emptyText: <Empty description="Tidak ada data" /> }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* ============================================================
 AREA KHUSUS UNTUK CETAK GAMBAR (TIDAK TERLIHAT DI WEBSITE)
============================================================ */}
      <div
        id="capture-area"
        style={{
          position: "absolute",
          left: "-99999px",
          top: 0,
          width: "1200px",
          padding: "20px",
          background: "#fff",
        }}
      >
        {/* ====== 4 KPI KOTAK (FULL WIDTH) ====== */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Penjualan (Net)"
                value={`Rp ${formatRupiah(totalPendapatanBersih)}`}
                prefix={<ShopOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Pengunjung"
                value={totals.total_visitors}
                prefix={<UsergroupAddOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Jumlah Transaksi"
                value={totals.total_transactions}
                prefix={<FieldTimeOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Rata-rata Harian"
                value={`Rp ${formatRupiah(totals.avg_daily)}`}
                prefix={<ArrowUpOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* ========== PAYMENT + TENANT CONTRIBUTION  ========== */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {/* PAYMENT */}
          <Col span={12}>
            <Card style={{ height: "100%" }}>
              <Title level={5}>Metode Pembayaran</Title>
              <div style={{ height: 240 }}>
                <Doughnut
                  data={paymentDoughnut}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "bottom" },
                      datalabels: {
                        color: "#fff",
                        font: { weight: "bold" },
                        formatter: (value, ctx) => {
                          const total = ctx.dataset.data.reduce(
                            (s, v) => s + v,
                            0
                          );
                          if (!total) return "0%";
                          return ((value / total) * 100).toFixed(1) + "%";
                        },
                      },
                    },
                  }}
                />
              </div>

              <Divider />

              {paymentBreakdown.map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Text>{p.method}</Text>
                  <Text strong>Rp {formatRupiah(p.total)}</Text>
                </div>
              ))}
            </Card>
          </Col>

          {/* TENANT CONTRIBUTION */}
          <Col span={12}>
            <Card style={{ height: "100%" }}>
              <Title level={5}>Kontribusi Tenant & Working Space</Title>

              <div style={{ height: 260 }}>
                <Doughnut
                  data={tenantPieData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "bottom" },
                      datalabels: {
                        color: "#fff",
                        formatter: (value, ctx) => {
                          const total = ctx.dataset.data.reduce(
                            (a, b) => a + b,
                            0
                          );
                          if (!total) return "0%";
                          return ((value / total) * 100).toFixed(1) + "%";
                        },
                      },
                    },
                  }}
                />
              </div>

              <Divider />

              {tenantContribution.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text>{t.tenant}</Text>
                  <Text strong>Rp {formatRupiah(t.nett)}</Text>
                </div>
              ))}
            </Card>
          </Col>
        </Row>

        {/* ========== TOP 10 FNB + TOP 5 WS ========== */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Top 10 FNB" loading={loading}>
              <Table
                columns={[
                  { title: "Menu", dataIndex: "item", key: "item" },
                  {
                    title: "Tenant",
                    dataIndex: "tenant",
                    key: "tenant",
                    width: 140,
                  },
                  {
                    title: "Jumlah Terjual",
                    dataIndex: "qty",
                    key: "qty",
                    align: "right",
                    render: (v) => formatRupiah(v),
                  },
                  {
                    title: "Total Penjualan (Rp)",
                    dataIndex: "total",
                    key: "total",
                    align: "right",
                    render: (t) => `Rp ${formatRupiah(t)}`,
                  },
                ]}
                dataSource={topFnb}
                rowKey={(r) => `${r.item}-${r.tenant || ""}`}
                pagination={false}
                size="small"
                locale={{ emptyText: <Empty description="Tidak ada data" /> }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Top 5 Working Space" loading={loading}>
              <Table
                columns={[
                  {
                    title: "Kategori - Durasi",
                    dataIndex: "item",
                    key: "item",
                  },
                  {
                    title: "Jumlah Terjual",
                    dataIndex: "qty",
                    key: "qty",
                    align: "right",
                    render: (v) => formatRupiah(v),
                  },
                  {
                    title: "Total Penjualan (Rp)",
                    dataIndex: "total",
                    key: "total",
                    align: "right",
                    render: (t) => `Rp ${formatRupiah(t)}`,
                  },
                ]}
                dataSource={topWs}
                rowKey={(r) =>
                  `${r.item}-${String(r.qty)}-${String(r.total)}`
                }
                pagination={false}
                size="small"
                locale={{ emptyText: <Empty description="Tidak ada data" /> }}
              />
            </Card>
          </Col>
        </Row>
      </div>
      {/* END OF CAPTURE AREA */}
    </ConfigProvider>
  );
};

export default Laporan;