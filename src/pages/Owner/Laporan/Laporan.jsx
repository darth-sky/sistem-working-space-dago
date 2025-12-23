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
import {
  getDashboardSummary,
  getTransactionReport,
  getTransactionDetailReport,
} from "../../../services/service";

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

  // state dari API
  const [totals, setTotals] = useState({
    total_fnb: 0,
    total_ws: 0,
    total_sales: 0,
    total_tax: 0,
    total_transactions: 0,
    total_visitors: 0,
    total_visitors_unique: 0, // [FIX 1] Tambahkan state untuk visitor unik
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
          total_tax: Number(d?.totals?.total_tax || 0),
          total_transactions: Number(d?.totals?.total_transactions || 0),
          total_visitors: Number(d?.totals?.total_visitors || 0),
          // [FIX 1] Ambil data unik dari backend
          total_visitors_unique: Number(d?.totals?.total_visitors_unique || 0),
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

  // === PERHITUNGAN BERSIH (Global) ===
  const totalPendapatanBersih = totals.total_sales - totals.total_tax;

  // [FIX 2] Hitung Rasio Bersih (Net Ratio)
  // Digunakan untuk membersihkan Pajak dari angka Kontribusi Tenant/WS
  const netRatio =
    totals.total_sales > 0 ? totalPendapatanBersih / totals.total_sales : 1;

  // [FIX 2] Buat dataset kontribusi tenant yang sudah dikonversi ke Net (Excl. Tax)
  const netTenantContribution = useMemo(() => {
    return tenantContribution.map((t) => ({
      ...t,
      // Aplikasikan rasio ke setiap nilai
      nett: t.nett * netRatio,
    }));
  }, [tenantContribution, netRatio]);

  // === Chart builders ===
  const lineLabels = useMemo(
    () => dailySales.map((d) => dayjs(d.tanggal).format("D")),
    [dailySales]
  );

  // [FIX 2] Update grafik harian agar menggunakan angka Net juga (opsional, untuk konsistensi)
  const fnbSeries = useMemo(
    () => dailySales.map((d) => Number(d.fnb || 0) * netRatio),
    [dailySales, netRatio]
  );
  const wsSeries = useMemo(
    () => dailySales.map((d) => Number(d.ws || 0) * netRatio),
    [dailySales, netRatio]
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
        data: [totals.total_fnb * netRatio, totals.total_ws * netRatio],
        backgroundColor: ["#2563eb", "#10B981"],
        hoverOffset: 8,
      },
    ],
  };

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
        ticks: {  
          stepSize: 1,
          precision: 0,
          callback: (v) => `Rp ${formatRupiah(v)}` },
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
        title: { display: true, text: "Jumlah Kunjungan" },
        ticks: {
          stepSize: 1,
          precision: 0,
          callback: (v) => v,
        },
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
        ticks: {
          stepSize: 1,
          precision: 0,
          callback: (v) => v,
        },
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

  // === Export to Excel Handler ===
  // === Export to Excel Handler (REAL DATA) ===
  const handleExportExcel = async () => {
    try {
      setLoading(true); // Tampilkan loading
      message.loading({
        content: "Sedang mengambil data transaksi...",
        key: "export",
      });

      const startDateStr = dateRange[0].format("YYYY-MM-DD");
      const endDateStr = dateRange[1].format("YYYY-MM-DD");

      // 1. Ambil Data List Transaksi (Sheet 1)
      const listResp = await getTransactionReport(startDateStr, endDateStr);
      const transactionList = listResp.datas || [];

      if (transactionList.length === 0) {
        message.warning({
          content: "Tidak ada data transaksi pada periode ini.",
          key: "export",
        });
        setLoading(false);
        return;
      }

      // 2. Ambil Detail untuk SETIAP Transaksi (Sheet 2)
      // Kita menggunakan Promise.all untuk mengambil detail secara paralel
      message.loading({
        content: `Memproses detail ${transactionList.length} transaksi...`,
        key: "export",
      });

      const detailPromises = transactionList.map(
        (trx) =>
          getTransactionDetailReport(trx.id_transaksi)
            .then((res) => ({ id: trx.id_transaksi, data: res.datas }))
            .catch(() => ({ id: trx.id_transaksi, data: { fnb: [], ws: [] } })) // Fallback jika error
      );

      const detailsResults = await Promise.all(detailPromises);

      // Buat Map untuk akses cepat detail berdasarkan ID
      const detailsMap = {};
      detailsResults.forEach((r) => {
        detailsMap[r.id] = r.data;
      });

      // ==========================================
      // MULAI MEMBUAT EXCEL
      // ==========================================
      const workbook = new ExcelJS.Workbook();

      // ====== STYLE DEFINITIONS ======
      const FONT_NAME = "Times New Roman";
      const FONT_SIZE = 12;
      const defaultFont = { name: FONT_NAME, size: FONT_SIZE };
      const boldFont = { name: FONT_NAME, size: FONT_SIZE, bold: true };
      const borderAll = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      const numFmtRp = '"Rp" #,##0';
      const numFmtPct = '0.00"%"';
      const asNumber = (v) => Number(v || 0);

      // Helper Helpers
      const applySheetDefaults = (sheet) => {
        sheet.properties.defaultRowHeight = 18;
        sheet.views = [{ state: "frozen", ySplit: 4 }];
      };

      const addTitle = (sheet, title, colCount) => {
        sheet.mergeCells(1, 1, 1, colCount);
        const cell = sheet.getCell(1, 1);
        cell.value = title;
        cell.font = { name: FONT_NAME, size: 16, bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };

        sheet.mergeCells(2, 1, 2, colCount);
        const p = sheet.getCell(2, 1);
        p.value = `Periode: ${dateRange[0].format(
          "DD/MM/YYYY"
        )} s/d ${dateRange[1].format("DD/MM/YYYY")}`;
        p.font = boldFont;
        p.alignment = { horizontal: "center", vertical: "middle" };
        sheet.addRow([]);
      };

      const styleHeaderRow = (row) => {
        row.eachCell((cell) => {
          cell.font = boldFont;
          cell.border = borderAll;
          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF4A460" },
          };
        });
        row.height = 22;
      };

      const styleBodyRow = (row) => {
        row.eachCell((cell) => {
          cell.font = defaultFont;
          cell.border = borderAll;
          cell.alignment = { vertical: "middle", wrapText: true };
        });
      };

      const setRowHeightByText = (
        row,
        text,
        colWidth,
        { base = 18, perLine = 14, maxLines = 10 } = {}
      ) => {
        const safeText = String(text || "");
        const approxCharsPerLine = Math.max(10, Math.floor(colWidth * 1.2));
        const lineCount = Math.max(
          1,
          safeText
            .split("\n")
            .reduce(
              (acc, part) => acc + Math.ceil(part.length / approxCharsPerLine),
              0
            )
        );
        const capped = Math.min(lineCount, maxLines);
        row.height = base + (capped - 1) * perLine;
      };

      // =====================================================================================
      //                              SHEET 1 — TRANSACTION LIST
      // =====================================================================================
      const sheet1 = workbook.addWorksheet("Transaction");
      applySheetDefaults(sheet1);

      const transHeaders = [
        "ID",
        "Datetime",
        "Tax (%)",
        "Discount (%)",
        "Tax Total",
        "Discount Total",
        "Sub Total",
        "Total (Final)",
        "Customer Name",
        "Note / Type",
        "Payment Status",
        "Payment Method",
      ];

      addTitle(sheet1, "Transaction List", transHeaders.length);
      const headerRow1 = sheet1.addRow(transHeaders);
      styleHeaderRow(headerRow1);
      sheet1.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 4, column: transHeaders.length },
      };

      const SHEET1_WIDTHS = {
        1: 10,
        2: 22,
        3: 10,
        4: 12,
        5: 15,
        6: 15,
        7: 18,
        8: 18,
        9: 20,
        10: 25,
        11: 15,
        12: 15,
      };
      Object.entries(SHEET1_WIDTHS).forEach(([c, w]) => {
        sheet1.getColumn(Number(c)).width = w;
      });

      // Mapping Sheet 1
      transactionList.forEach((t) => {
        const subtotal = asNumber(t.subtotal);
        const taxTotal = asNumber(t.pajak_nominal);
        const grandTotal = asNumber(t.total_harga_final);

        // Hitung Discount Total
        let discountTotal = subtotal + taxTotal - grandTotal;
        if (discountTotal < 0) discountTotal = 0;

        const taxPct = subtotal > 0 ? taxTotal / subtotal : 0;
        // Basis diskon 
        const gross = subtotal + taxTotal;
        const discPct = gross > 0 ? discountTotal / gross : 0;

        const row = sheet1.addRow([
          t.id_transaksi,
          `${t.tanggal} ${t.waktu}`,
          taxPct,
          discPct,
          taxTotal,
          discountTotal,
          subtotal,
          grandTotal,
          t.nama_guest || "Guest",
          `${t.booking_source} (${t.fnb_type || "-"})`,
          t.status_pembayaran,
          t.metode_pembayaran,
        ]);

        // Formatting
        [3, 4].forEach((idx) => (row.getCell(idx).numFmt = numFmtPct));
        [5, 6, 7, 8].forEach((idx) => (row.getCell(idx).numFmt = numFmtRp));

        styleBodyRow(row);
        // Align numbers right
        [1, 3, 4, 5, 6, 7, 8].forEach(
          (c) =>
            (row.getCell(c).alignment = {
              horizontal: "right",
              vertical: "middle",
            })
        );
      });

      // =====================================================================================
      //                              SHEET 2 — TRANSACTION DETAIL
      // =====================================================================================
      const sheet2 = workbook.addWorksheet("Transaction Detail");
      applySheetDefaults(sheet2);

      const transDetailHeaders = [
        "Trx ID",
        "Datetime",
        "Type",
        "Item / Product",
        "Qty",
        "Price (Unit)",
        "Total (Item)",
        "Share Tenant (70%)",
        "Share Owner (30%)",
      ];

      addTitle(sheet2, "Transaction Detail", transDetailHeaders.length);
      const headerRow2 = sheet2.addRow(transDetailHeaders);
      styleHeaderRow(headerRow2);
      sheet2.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 4, column: transDetailHeaders.length },
      };

      const SHEET2_WIDTHS = {
        1: 10,
        2: 22,
        3: 15,
        4: 40,
        5: 10,
        6: 18,
        7: 18,
        8: 18,
        9: 18,
      };
      Object.entries(SHEET2_WIDTHS).forEach(([c, w]) => {
        sheet2.getColumn(Number(c)).width = w;
      });

      // Mapping Sheet 2 
      transactionList.forEach((t) => {
        const details = detailsMap[t.id_transaksi];
        if (!details) return;

        // 1. Process F&B Items
        if (details.fnb && details.fnb.length > 0) {
          details.fnb.forEach((item) => {
            const itemTotal = asNumber(item.subtotal); 
            // Logika Bagi Hasil  
            const shareTenant = itemTotal * 0.7;
            const shareOwner = itemTotal * 0.3;

            const row = sheet2.addRow([
              t.id_transaksi,
              `${t.tanggal} ${t.waktu}`,
              "F&B",
              item.nama_produk,
              asNumber(item.jumlah),
              asNumber(item.harga_saat_order),
              itemTotal,
              shareTenant,
              shareOwner,
            ]);

            styleBodyRow(row);
            [6, 7, 8, 9].forEach((c) => (row.getCell(c).numFmt = numFmtRp));
            [1, 5, 6, 7, 8, 9].forEach(
              (c) =>
                (row.getCell(c).alignment = {
                  horizontal: "right",
                  vertical: "middle",
                })
            );
            setRowHeightByText(row, item.nama_produk, SHEET2_WIDTHS[4]);
          });
        }

        // 2. Process Working Space Items
        if (details.ws && details.ws.length > 0) {
          details.ws.forEach((item) => {

            const row = sheet2.addRow([
              t.id_transaksi,
              `${t.tanggal} ${t.waktu}`,
              "Working Space",
              `${item.nama_ruangan} (${item.durasi_jam} Jam)`,
              1,
              "-", 
              0, 
              "-", 
            ]);

            styleBodyRow(row);
            row.getCell(4).alignment = { wrapText: true, vertical: "middle" };
            [1, 5, 8].forEach(
              (c) =>
                (row.getCell(c).alignment = {
                  horizontal: "right",
                  vertical: "middle",
                })
            );
          });
        }
      });

      // Finalize and Download
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer]),
        `Laporan-Transaksi-${dateRange[0].format(
          "YYYYMMDD"
        )}_to_${dateRange[1].format("YYYYMMDD")}.xlsx`
      );

      message.success({
        content: "Export Excel laporan berhasil!",
        key: "export",
      });
    } catch (e) {
      console.error(e);
      message.error({
        content: "Gagal membuat Excel: " + e.message,
        key: "export",
      });
    } finally {
      setLoading(false);
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

    const values = paymentBreakdown.map((x) => x.total * netRatio);

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
  }, [paymentBreakdown, netRatio]);

  // Menggunakan data yang sudah dibersihkan (Net)
  const tenantPieData = useMemo(() => {
    if (!netTenantContribution || netTenantContribution.length === 0) {
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

    const labels = netTenantContribution.map((t) => t.tenant);
    const values = netTenantContribution.map((t) => t.nett);

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
  }, [netTenantContribution]);

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
        </div>

        {/* KPI cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="Total Penjualan"
                value={`Rp ${formatRupiah(totalPendapatanBersih)}`}
                prefix={<ShopOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="Total Pengunjung"
                value={totals.total_visitors_unique}
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
                value={`Rp ${formatRupiah(
                  totalPendapatanBersih / Math.max(1, totals.total_days)
                )}`}
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
                    Daily Sellings
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
              <Title level={5}>Hourly Visit Traffic</Title>
              <Text type="secondary">
                Akumulasi kunjungan selama periode {totalDays} hari.
              </Text>
              <div style={{ height: 300, marginTop: 10 }}>
                <Bar
                  data={{
                    labels: hourLabels,
                    datasets: [
                      {
                        label: "Pengunjung",
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
              <Title level={5}>Peak Visiting Hours</Title>
              <Text type="secondary">
                Total kunjungan tertinggi pada 3 jam teramai ({totalDays} hari).
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
              <Title level={5}>Metode Pembayaran</Title>
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
                  <Text strong>Rp {formatRupiah(p.total * netRatio)}</Text>
                </div>
              ))}
            </Card>

            <Card style={{ marginBottom: 16 }} loading={loading}>
              <Title level={5}>Kontribusi Tenant & Working Space (Net)</Title>

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
                {/* [FIX 2] Menggunakan list tenant yang sudah di-Net-kan */}
                {netTenantContribution.map((t, i) => (
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
                    title: "Total Penjualan",
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
                    title: "Total Penjualan (Gross)",
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
                title="Total Penjualan"
                value={`Rp ${formatRupiah(totalPendapatanBersih)}`}
                prefix={<ShopOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Pengunjung"
                value={totals.total_visitors_unique}
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
                value={`Rp ${formatRupiah(
                  totalPendapatanBersih / Math.max(1, totals.total_days)
                )}`}
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
                    alignItems: "center",
                  }}
                >
                  <Text>{p.method}</Text>
                  <Text strong>Rp {formatRupiah(p.total * netRatio)}</Text>
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

              {netTenantContribution.map((t, i) => (
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
                    title: "Total Penjualan",
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
                    title: "Total Penjualan (Gross)",
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
      {/* END OF CAPTURE AREA */}
    </ConfigProvider>
  );
};

export default Laporan;
