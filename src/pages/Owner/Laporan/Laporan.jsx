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
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
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

// ===== Helpers: pilih Top-N & sembunyikan batang lain (untuk PEAK saja) =====
const getTopNIndices = (arr, n = 3) =>
  arr
    .map((v, i) => ({ v: Number(v) || 0, i }))
    .sort((a, b) => b.v - a.v)
    .slice(0, n)
    .map((o) => o.i);

const maskExceptIndices = (arr, indices) => {
  const keep = new Set(indices);
  return arr.map((v, i) => (keep.has(i) ? v : null)); // null => Chart.js tidak menggambar batang
};
const getTenantName = (record) => {
  return record.tenant_name || "—";
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
    total_transactions: 0,
    avg_daily: 0,
    total_days: 0,
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
        setVisitorsByHour(
          Array.isArray(d?.visitors_by_hour) ? d.visitors_by_hour : []
        );
        setBookingsByHour(
          Array.isArray(d?.bookings_by_hour) ? d.bookings_by_hour : []
        );
        setTopFnb(Array.isArray(d?.top_fnb) ? d.top_fnb : []);
        setTopWs(
          Array.isArray(d?.top_ws)
            ? [...d.top_ws].sort(
                (a, b) => Number(b.qty || 0) - Number(a.qty || 0)
              )
            : []
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

  // buat label dan daftar jam sebenarnya (8 s/d 22)
  const hourLabels = Array.from({ length: 15 }, (_, i) => `${8 + i}:00`);
  const hours = Array.from({ length: 15 }, (_, i) => 8 + i); // [8,9,10,...,22]

  // buat map dari data API
  const visitorsMap = new Map(
    visitorsByHour.map((r) => [Number(r.hour), Number(r.count)])
  );
  const bookingsMap = new Map(
    bookingsByHour.map((r) => [Number(r.hour), Number(r.count)])
  );

  // ambil data sesuai jam sebenarnya
  const visitorsData = hours.map((H) => visitorsMap.get(H) || 0);
  const bookingsDataRaw = hours.map((H) => bookingsMap.get(H) || 0);

  const topPeakIdx = useMemo(
    () => getTopNIndices(bookingsDataRaw, 3),
    [bookingsDataRaw]
  );
  const bookingsDataTop3 = useMemo(
    () => maskExceptIndices(bookingsDataRaw, topPeakIdx),
    [bookingsDataRaw, topPeakIdx]
  );

  const trafficBarData = {
    labels: hourLabels,
    datasets: [
      {
        label: "Pengunjung (jumlah transaksi)",
        data: visitorsData,
        backgroundColor: "#2563eb",
      },
    ],
  };
  const peakBarData = {
    labels: hourLabels,
    datasets: [
      {
        label: "Booking (Top 3)",
        data: bookingsDataTop3,
        backgroundColor: "#10B981",
      },
    ],
  };

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
              label += `${formatRupiah(ctx.parsed.y)} pengunjung`;
            return label;
          },
        },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => formatRupiah(v) } },
    },
  };
  const peakBarOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      // Tooltip hanya untuk batang yang ada (bukan null)
      tooltip: {
        filter: (ctx) => ctx.parsed?.y != null,
        callbacks: {
          label: (ctx) => {
            let label = ctx.dataset.label || "";
            if (label) label += ": ";
            if (ctx.parsed?.y != null)
              label += `${formatRupiah(ctx.parsed.y)} booking`;
            return label;
          },
        },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => formatRupiah(v) } },
    },
  };
  const doughnutOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      datalabels: {
        color: "#fff",
        formatter: (value, context) => {
          const total = context.chart.data.datasets[0].data.reduce(
            (a, b) => a + b,
            0
          );
          return total ? ((value / total) * 100).toFixed(1) + "%" : "0%";
        },
        font: { weight: "bold", size: 14 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed || 0;
            const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
            const pct = total ? ((value / total) * 100).toFixed(1) : 0;
            return `${ctx.label}: Rp ${formatRupiah(value)} (${pct}%)`;
          },
        },
      },
    },
  };

  const columns = [
    { title: "Menu/Item", dataIndex: "item", key: "item" },
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
  ];

  const totalDays =
    totals.total_days ||
    Math.max(1, dateRange[1].diff(dateRange[0], "day") + 1);

  // === Capture to Image Handler ===
  const [previewSrc, setPreviewSrc] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleCaptureImage = async () => {
    try {
      const node = reportRef.current;
      if (!node) {
        message.error("Area laporan tidak ditemukan.");
        return;
      }
      console.log("[capture] node found:", node);

      // Pastikan layout settle (tetap dalam user gesture)
      await new Promise((r) => requestAnimationFrame(r));
      console.log("[capture] layout settled");

      // Clone offscreen
      const clone = node.cloneNode(true);
      const w = Math.max(node.scrollWidth, node.clientWidth);
      const h = Math.max(node.scrollHeight, node.clientHeight);

      Object.assign(clone.style, {
        position: "absolute",
        left: "0",
        top: "-100000px",
        width: `${w}px`,
        minWidth: `${w}px`,
        maxWidth: `${w}px`,
        background: "#ffffff",
        zIndex: "-1",
      });

      // Paksa background putih untuk komponen Ant Design
      clone
        .querySelectorAll(
          ".ant-card, .ant-card-body, .ant-statistic, .ant-space, .ant-row, .ant-col"
        )
        .forEach((el) => {
          el.style.background = "#ffffff";
        });

      // === Salin setiap <canvas> (Chart.js) menjadi <img> pada CLONE
      const originalCanvases = node.querySelectorAll("canvas");
      const clonedCanvases = clone.querySelectorAll("canvas");
      console.log("[capture] canvases:", originalCanvases.length);

      originalCanvases.forEach((orig, idx) => {
        try {
          const dataUrl = orig.toDataURL("image/png");
          const img = document.createElement("img");
          img.src = dataUrl;
          img.style.width = orig.style.width || `${orig.width}px`;
          img.style.height = orig.style.height || `${orig.height}px`;
          const cloned = clonedCanvases[idx];
          if (cloned?.parentNode) cloned.parentNode.replaceChild(img, cloned);
        } catch (err) {
          console.warn("[capture] gagal salin canvas:", err);
        }
      });

      document.body.appendChild(clone);
      console.log("[capture] clone appended", { w, h });

      const canvas = await html2canvas(clone, {
        scale: Math.max(2, window.devicePixelRatio || 1),
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: w,
        height: h,
        windowWidth: w,
        windowHeight: h,
        logging: false,
        foreignObjectRendering: false, // kalau hasil tetap blank, coba true
      });

      document.body.removeChild(clone);
      console.log("[capture] html2canvas done", canvas?.width, canvas?.height);

      if (!canvas) {
        message.error("Gagal menangkap canvas.");
        return;
      }

      // Tampilkan preview dulu (membantu debugging kalau blank)
      const dataUrlPreview = canvas.toDataURL("image/png");
      setPreviewSrc(dataUrlPreview);
      setPreviewOpen(true);

      // 1) Coba Blob + ObjectURL (paling stabil)
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png", 1.0)
      );
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `laporan-${dateRange[0].format(
          "YYYYMMDD"
        )}-${dateRange[1].format("YYYYMMDD")}.png`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          URL.revokeObjectURL(url);
          a.remove();
        }, 0);
        console.log("[download] via blob+objectURL OK");
        return;
      }

      // 2) Fallback: dataURL
      const a2 = document.createElement("a");
      a2.href = dataUrlPreview;
      a2.download = `laporan-${dateRange[0].format(
        "YYYYMMDD"
      )}-${dateRange[1].format("YYYYMMDD")}.png`;
      document.body.appendChild(a2);
      a2.click();
      a2.remove();
      console.log("[download] via dataURL OK");
    } catch (e) {
      console.error(e);
      message.error("Gagal membuat gambar laporan. Cek console untuk detail.");
      // 3) Fallback terakhir: buka di tab baru (kalau downloader diblokir)
      try {
        const node = reportRef.current;
        if (!node) return;
        const canvas = await html2canvas(node);
        const dataUrl = canvas.toDataURL("image/png");
        const newWin = window.open();
        if (newWin) {
          newWin.document.write(
            `<img src="${dataUrl}" style="max-width:100%"/>`
          );
        }
      } catch (_) {}
    }
  };

  const handleExportExcel = () => {
    try {
      const startStr = dateRange[0].format("YYYY-MM-DD");
      const endStr = dateRange[1].format("YYYY-MM-DD");
      const tanggalLabel = `${startStr} s.d. ${endStr}`;

      const rows = (topFnb || []).map((r) => {
        const gross = Number(r.gross ?? r.total ?? 0);
        const disc = Number(r.discount ?? 0);
        const nett = Number(r.nett ?? gross - disc);
        return {
          Tanggal: tanggalLabel,
          Product: r.item || "-",
          Tenant: r.tenant || "-",
          "Jumlah Qty": Number(r.qty || 0),
          "Total Penjualan (Gross)": gross,
          "Total Discount": disc,
          "Total Penjualan (Nett)": nett,
        };
      });

      if (!rows.length) {
        message.warning("Tidak ada data untuk diekspor.");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 20 },
        { wch: 30 },
        { wch: 22 },
        { wch: 12 },
        { wch: 24 },
        { wch: 18 },
        { wch: 24 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan FNB");
      XLSX.writeFile(wb, `laporan-fnb-${startStr}_to_${endStr}.xlsx`);
      message.success("✅ Laporan berhasil diekspor ke Excel!");
    } catch (e) {
      console.error(e);
      message.error("Gagal mengekspor Excel.");
    }
  };

  return (
    <ConfigProvider locale={locale}>
      <div style={{ padding: 20 }} ref={reportRef}>
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
                onChange={(vals) =>
                  vals &&
                  setDateRange([vals[0].startOf("day"), vals[1].endOf("day")])
                }
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
            {" "}
            PAJAK{" "}
          </a>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="Total Penjualan"
                value={`Rp ${formatRupiah(totals.total_sales)}`}
                prefix={<ShopOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="Total Pengunjung"
                value={formatRupiah(
                  visitorsByHour.reduce((s, r) => s + (r.count || 0), 0)
                )}
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
              <Title level={5}>Trafic Pengunjung</Title>
              <Text type="secondary">
                Akumulasi transaksi per jam dalam periode {totalDays} hari.
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
              <Title level={5}>Peak Hours Booking</Title>
              <Text type="secondary">
                Akumulasi ruangan yang dipesan per jam dalam periode {totalDays}{" "}
                hari.
              </Text>
              <div style={{ height: 220, marginTop: 10 }}>
                <Bar data={peakBarData} options={peakBarOptions} />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card style={{ marginBottom: 16 }} loading={loading}>
              <Title level={5}>Kontribusi Space </Title>
              <div style={{ height: 220 }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
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
                    📄 Cetak Laporan (Gambar)
                  </button>
                </Tooltip>
                <Tooltip title="Unduh data FNB yang tampil dalam format Excel">
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
                    width: 120,
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
                  { title: "Space", dataIndex: "item", key: "item" },
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
                rowKey={(r) => `${r.item}-${String(r.qty)}-${String(r.total)}`}
                pagination={false}
                size="small"
                locale={{ emptyText: <Empty description="Tidak ada data" /> }}
              />
            </Card>
          </Col>
        </Row>
      </div>
      {previewSrc && (
        <div>
          <div
            onClick={() => setPreviewOpen(false)}
            style={{
              display: previewOpen ? "block" : "none",
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 9999,
            }}
          />
          <div
            style={{
              display: previewOpen ? "block" : "none",
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#fff",
              padding: 16,
              borderRadius: 8,
              zIndex: 10000,
              maxWidth: "90vw",
              maxHeight: "85vh",
              overflow: "auto",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <strong>Preview Gambar</strong>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                style={{
                  padding: "4px 10px",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Tutup
              </button>
            </div>
            <img src={previewSrc} alt="preview" style={{ maxWidth: "100%" }} />
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <a
                href={previewSrc}
                download={`laporan-${dateRange[0].format(
                  "YYYYMMDD"
                )}-${dateRange[1].format("YYYYMMDD")}.png`}
                style={{ textDecoration: "none" }}
              >
                <button
                  type="button"
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #1677ff",
                    background: "#1677ff",
                    color: "#fff",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Download dari Preview
                </button>
              </a>
            </div>
          </div>
        </div>
      )}
    </ConfigProvider>
  );
};

export default Laporan;