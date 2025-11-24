import React, { useEffect, useMemo, useState, useRef } from "react";
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
  Button, // Import Button
} from "antd";
// pisahkan message biar aman dari parser bundler
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
  DownloadOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { getOwnerFnB } from "../../../services/service";
//import { getExpenses, getBagiHasilReport } from "../../../services/service";

// --- MODIFIKASI: Import html2canvas ---
import html2canvas from "html2canvas-pro";
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";

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

// Fungsi loadImage tidak lagi diperlukan untuk html2canvas
// const loadImage = (src) => ...

const getTopNIndices = (arr, n = 3) =>
  arr
    .map((v, i) => ({ v: Number(v) || 0, i }))
    .filter((o) => o.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, n)
    .map((o) => o.i);

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
  const [exportLoading, setExportLoading] = useState(false);

  // --- MODIFIKASI: Filter Tenant Global (Multi-Select) ---
  const [selectedTenantIds, setSelectedTenantIds] = useState([]);

  // --- MODIFIKASI: Tambahkan printRef ---
  const printRef = useRef(null);

  const lineChartRef = useRef(null);
  const doughnutChartRef = useRef(null);
  const trafficBarRef = useRef(null);
  const peakBarRef = useRef(null);

  const [totals, setTotals] = useState({
    total_fnb: 0,
    total_ws: 0,
    total_sales: 0,
    total_transactions: 0,
    avg_daily: 0,
    total_days: 0,
  });

  const [tenantInfo, setTenantInfo] = useState([]); // Daftar tenant {id, name, color}
  const [dailyTenant, setDailyTenant] = useState({}); // Map harian { "2025-11-10": { "3": 123, "4": 456 } }
  const [visitorsByHour, setVisitorsByHour] = useState([]);
  const [peakByHour, setPeakByHour] = useState([]);
  const [topItems, setTopItems] = useState({}); // Map item { "3": [...], "4": [...] }
  const [unpopItems, setUnpopItems] = useState({}); // Map item { "3": [...], "4": [...] }

  const [dailyTarget] = useState(1000000);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);

  // --- Capture to Image handler ---
  const [previewSrc, setPreviewSrc] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // --- MODIFIKASI: Fungsi Download diganti dengan html2canvas ---
  const handleDownloadReport = async () => {
    try {
      const node = printRef.current;
      if (!node) {
        message.error("Area laporan tidak ditemukan.");
        return;
      }

      await new Promise((r) => setTimeout(r, 600));
      // langsung capture
      const canvas = await html2canvas(node, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL("image/png");

      // tampilkan preview
      setPreviewSrc(dataUrl);
      setPreviewOpen(true);

      // auto download PNG
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `laporan-${dateRange[0].format(
        "YYYYMMDD"
      )}-${dateRange[1].format("YYYYMMDD")}.png`;
      link.click();
    } catch (e) {
      console.error(e);
      message.error("Gagal membuat gambar laporan.");
    }
  };

  // Cleaned & Formatted handleExportExcel
  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const startDate = dateRange[0]?.format("YYYY-MM-DD");
      const endDate = dateRange[1]?.format("YYYY-MM-DD");

      const wb = new ExcelJS.Workbook();

      const formatRP = (v) =>
        "Rp " + new Intl.NumberFormat("id-ID").format(Number(v || 0));

      const autoFit = (ws) => {
        ws.columns.forEach((col) => {
          let max = 10;
          col.eachCell({ includeEmpty: true }, (cell) => {
            const val = cell.value ? cell.value.toString() : "";
            max = Math.max(max, val.length);
          });
          col.width = max + 2;
        });
      };

      // Build fallback transaction from dailyTenant
      const allData = [];
      for (const [tanggal, tenants] of Object.entries(dailyTenant)) {
        tenantInfo.forEach((t) => {
          const total = tenants[t.id] || 0;
          if (total > 0) {
            allData.push({
              tanggal,
              tenant: t.name,
              product: "(total harian)",
              qty: "-",
              harga: "-",
              diskon: 0,
              pajak: 0,
              total,
            });
          }
        });
      }

      const totalFnb = allData.reduce((acc, trx) => acc + Number(trx.total), 0);

      // ========================= SUMMARY SHEET =========================
      const ws = wb.addWorksheet("Summary");

      ws.addRow(["SUMMARY FNB"]).font = { bold: true, size: 16 };
      ws.addRow([`Periode: ${startDate} - ${endDate}`]).font = { bold: true };
      ws.addRow([]);

      ws.addRow(["Total Penjualan FNB", formatRP(totalFnb)]).font = {
        bold: true,
      };
      ws.addRow(["Share Tenant 70%", formatRP(totalFnb * 0.7)]);
      ws.addRow([]);

      ws.addRow(["Tanggal", "Tenant", "Penjualan (Total Harian)"]).font = {
        bold: true,
      };

      allData.forEach((d) => {
        ws.addRow([d.tanggal, d.tenant, formatRP(d.total)]);
      });

      ws.addRow([]);
      ws.addRow(["TOTAL FNB", "", formatRP(totalFnb)]).font = { bold: true };

      autoFit(ws);

      // ========================= TENANT SHEETS =========================
      tenantInfo.forEach((t) => {
        const sheet = wb.addWorksheet(t.name.substring(0, 30));

        const trxTenant = allData.filter((d) => d.tenant === t.name);
        const totalTenant = trxTenant.reduce(
          (acc, trx) => acc + Number(trx.total),
          0
        );
        const shareTenant = Math.round(totalTenant * 0.7);

        sheet.addRow(["LAPORAN TENANT", t.name]).font = {
          bold: true,
          size: 14,
        };
        sheet.addRow([`Periode: ${startDate} - ${endDate}`]).font = {
          bold: true,
        };
        sheet.addRow([]);

        sheet.addRow(["Total Penjualan FNB", formatRP(totalFnb)]);
        sheet.addRow([`Total Penjualan ${t.name}`, formatRP(totalTenant)]);
        sheet.addRow(["Share 70%", formatRP(shareTenant)]);
        sheet.addRow(["Hutang Tenant", ""]);
        sheet.addRow(["Jumlah Transfer", ""]);
        sheet.addRow([]);

        sheet.addRow(["Tanggal", "Total Harian"]).font = { bold: true };

        trxTenant.forEach((d) => {
          sheet.addRow([d.tanggal, formatRP(d.total)]);
        });

        sheet.addRow([]);
        sheet.addRow([`TOTAL ${t.name}`, formatRP(totalTenant)]).font = {
          bold: true,
        };

        autoFit(sheet);
      });

      // ========================= SAVE FILE =========================
      const buffer = await wb.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `laporan_fnb_${startDate}_${endDate}.xlsx`
      );

      message.success("Export berhasil!");
    } catch (err) {
      console.error(err);
      message.error("Export gagal.");
    } finally {
      setExportLoading(false);
    }
  };

  // --- AKHIR MODIFIKASI ---

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

        const tenants = Array.isArray(d?.tenant_info) ? d.tenant_info : [];
        setTenantInfo(tenants);

        setDailyTenant(d?.daily_selling_per_tenant || {});
        setVisitorsByHour(
          Array.isArray(d?.visitors_by_hour) ? d.visitors_by_hour : []
        );
        setPeakByHour(Array.isArray(d?.peak_by_hour) ? d.peak_by_hour : []);
        setTopItems(d?.top_fnb || {});
        setUnpopItems(d?.unpopular_fnb || {});
        setPaymentBreakdown(
          Array.isArray(d?.payment_breakdown) ? d.payment_breakdown : []
        );

        const tenantIds = new Set(tenants.map((t) => t.id));
        const currentFilterIsValid = selectedTenantIds.every((id) =>
          tenantIds.has(id)
        );

        if (!currentFilterIsValid) {
          setSelectedTenantIds([]);
        }
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

  const displayTotals = useMemo(() => {
    let base = { ...totals };
    const totalDays = Math.max(1, base.total_days);

    if (selectedTenantIds.length > 0) {
      const selectedSet = new Set(selectedTenantIds);
      let newTotalFnB = 0;

      for (const dayData of Object.values(dailyTenant)) {
        for (const tenantIdStr in dayData) {
          const tenantId = Number(tenantIdStr);
          if (selectedSet.has(tenantId)) {
            newTotalFnB += dayData[tenantIdStr] || 0;
          }
        }
      }

      base.total_fnb = newTotalFnB;
      base.total_sales = newTotalFnB;
      base.avg_daily = Math.round(newTotalFnB / totalDays);
    }

    return base;
  }, [totals, dailyTenant, selectedTenantIds]);

  const totalDays =
    displayTotals.total_days ||
    Math.max(1, dateRange[1].diff(dateRange[0], "day") + 1);

  const totalTarget = dailyTarget * totalDays;
  const pctAchieved = clamp(
    (Number(displayTotals.total_sales || 0) / Math.max(1, totalTarget)) * 100,
    0,
    999
  ).toFixed(1);

  const lineData = useMemo(() => {
    const days = buildDateRangeStrings(dateRange[0], dateRange[1]);
    const labels = days.map((d) => dayjs(d).format("D"));

    const tenantsToRender =
      selectedTenantIds.length === 0
        ? tenantInfo
        : tenantInfo.filter((t) => selectedTenantIds.includes(t.id));

    const datasets = tenantsToRender.map((tenant) => {
      const data = days.map((dayKey) => {
        return Number(dailyTenant[dayKey]?.[tenant.id] || 0);
      });
      return {
        label: tenant.name,
        data: data,
        fill: false,
        borderColor: tenant.color,
        tension: 0.2,
        pointRadius: 3,
        pointHoverRadius: 5,
      };
    });

    return { labels, datasets };
  }, [dailyTenant, dateRange, tenantInfo, selectedTenantIds]);

  const { doughnutData, tenantTotals } = useMemo(() => {
    if (!tenantInfo.length) {
      return { doughnutData: { labels: [], datasets: [] }, tenantTotals: [] };
    }

    const labels = tenantInfo.map((t) => t.name);
    const colors = tenantInfo.map((t) => t.color);

    const totals = tenantInfo.map((tenant) => {
      const total = Object.values(dailyTenant).reduce((sum, dayData) => {
        return sum + (dayData[tenant.id] || 0);
      }, 0);
      return { ...tenant, total };
    });

    const data = totals.map((t) => t.total);
    const allZero = data.every((d) => d === 0);

    const doughnutData = {
      labels: labels,
      datasets: [
        {
          data: allZero ? data.map(() => 1) : data,
          backgroundColor: allZero ? data.map(() => "#E0E0E0") : colors,
          hoverOffset: 8,
        },
      ],
    };

    return { doughnutData, tenantTotals: totals };
  }, [dailyTenant, tenantInfo]);

  const visitorsMap = new Map(
    visitorsByHour.map((r) => [Number(r.hour), Number(r.count)])
  );
  const peakMap = new Map(
    peakByHour.map((r) => [Number(r.hour), Number(r.count)])
  );

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
    if (!topPeakIdx.length) return peakDataRaw.map(() => null);
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
            return `${
              ctx.dataset?.label ? ctx.dataset.label + ": " : ""
            }${formatRupiah(v)}`;
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
          if (!total || total === 0) return "0%";
          const isDummy = ctx.dataset.data.every((v) => v === 1);
          if (isDummy) return "0%";
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
        ticks: {
          callback: (v) => `${Math.trunc(v)}`,
          precision: 0,
          autoSkip: true,
        },
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

  const withTenant = (rows, tenant) =>
    (Array.isArray(rows) ? rows : []).map((r, i) => ({
      ...r,
      tenant: tenant.name,
      tenantId: tenant.id,
      key: `${tenant.id}-${i}-${r.item}`,
      qty: Number(r.qty || 0),
      total: Number(r.total || 0),
    }));

  const allTopItems = useMemo(
    () =>
      tenantInfo.flatMap((tenant) => {
        const items = topItems[tenant.id] || [];
        return withTenant(items, tenant);
      }),
    [topItems, tenantInfo]
  );

  const allUnpopularItems = useMemo(
    () =>
      tenantInfo.flatMap((tenant) => {
        const items = unpopItems[tenant.id] || [];
        return withTenant(items, tenant);
      }),
    [unpopItems, tenantInfo]
  );

  const filteredTopItems = useMemo(() => {
    if (selectedTenantIds.length === 0) return allTopItems;
    const selectedSet = new Set(selectedTenantIds);
    return allTopItems.filter((r) => selectedSet.has(r.tenantId));
  }, [allTopItems, selectedTenantIds]);

  const filteredUnpopItems = useMemo(() => {
    if (selectedTenantIds.length === 0) return allUnpopularItems;
    const selectedSet = new Set(selectedTenantIds);
    return allUnpopularItems.filter((r) => selectedSet.has(r.tenantId));
  }, [allUnpopularItems, selectedTenantIds]);

  const top5 = useMemo(
    () =>
      [...filteredTopItems]
        .filter((r) => (r.total ?? 0) > 0 || (r.qty ?? 0) > 0)
        .sort((a, b) => b.total - a.total || b.qty - a.qty)
        .slice(0, 5),
    [filteredTopItems]
  );

  const unpopular5 = useMemo(
    () =>
      [...filteredUnpopItems]
        .sort((a, b) => a.qty - b.qty || a.total - b.total)
        .slice(0, 5),
    [filteredUnpopItems]
  );

  const topColumns = [
    {
      title: "Tenant",
      dataIndex: "tenant",
      key: "tenant",
      width: 120,
      hidden: selectedTenantIds.length > 0,
      render: (tenantName) => {
        const tenant = tenantInfo.find((t) => t.name === tenantName);
        return (
          <Tag
            color={tenant ? tenant.color : "gray"}
            style={{ marginRight: 0 }}
          >
            {tenantName}
          </Tag>
        );
      },
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
  ].filter((col) => !col.hidden);

  const totalSales = displayTotals.total_sales || 0;
  const avgDaily = displayTotals.avg_daily || 0;
  const totalVisitors = totals.total_transactions || 0;
  const totalTransactions = totals.total_transactions || 0;

  const getDynamicTitle = () => {
    if (selectedTenantIds.length === 0)
      return { kpi: "Total Penjualan", line: "Daily Selling (per tenant)" };
    if (selectedTenantIds.length === 1) {
      const tenantName =
        tenantInfo.find((t) => t.id === selectedTenantIds[0])?.name || "";
      return {
        kpi: `Penjualan ${tenantName}`,
        line: `Daily Selling (${tenantName})`,
      };
    }
    return { kpi: "Penjualan (Filter)", line: "Daily Selling (Filter)" };
  };
  const dynamicTitle = getDynamicTitle();

  const isAllTenantsView = selectedTenantIds.length === 0;
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

  return (
    <ConfigProvider locale={locale}>
      <div style={{ padding: 20 }}>
        {/* Header & controls */}
        <Row
          gutter={[16, 16]}
          justify="space-between"
          align="middle"
          style={{ marginBottom: 14 }}
          className="no-print" // --- MODIFIKASI: Tambah class no-print
        >
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              F&B Dashboard
            </Title>
            <Text type="secondary">
              Dago Creative Hub &amp; Coffee Lab — Food &amp; Beverage
            </Text>
          </Col>
          <Col>
            <Space align="center" wrap>
              <Text type="secondary">Tenant:</Text>
              <Select
                mode="multiple"
                allowClear
                value={selectedTenantIds}
                onChange={setSelectedTenantIds}
                placeholder="Filter Tenant (Default: Semua)"
                style={{ minWidth: 200, width: "auto" }}
                loading={loading}
              >
                {tenantInfo.map((t) => (
                  <Option key={t.id} value={t.id}>
                    {t.name}
                  </Option>
                ))}
              </Select>

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
                    setDateRange([
                      dayjs().subtract(7, "day").startOf("day"),
                      dayjs().endOf("day"),
                    ]);
                  else
                    setDateRange([
                      dayjs().startOf("month").startOf("day"),
                      dayjs().endOf("day"),
                    ]);
                }}
              >
                <Option value="mtm">Month to date</Option>
                <Option value="lw">Last 7d</Option>
              </Select>
            </Space>
          </Col>
        </Row>
        <div className="flex justify-start gap-3 mb-6 no-print">
          {" "}
          {/* --- MODIFIKASI: Tambah class no-print --- */}
          <a
            href="/laporan"
            className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Laporan
          </a>
          <a
            href="/fnbdashboard"
            className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 bg-blue-50 text-blue-600 hover:bg-blue-100"
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
        {/* --- MODIFIKASI: Wrapper div untuk print --- */}
        <div ref={printRef} style={{ backgroundColor: "#ffffff", padding: 1 }}>
          {/* KPI Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card loading={loading}>
                  <Statistic
                    title={dynamicTitle.kpi}
                    value={`Rp ${formatRupiah(totalSales)}`}
                    prefix={<ShopOutlined />}
                  />
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary">
                      Target ({totalDays} hari): Rp{" "}
                      {formatRupiah(dailyTarget * totalDays)}
                    </Text>
                    <Progress
                      percent={Number(pctAchieved)}
                      status={pctAchieved >= 100 ? "success" : "active"}
                    />
                  </div>
                </Card>
              </motion.div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <Card loading={loading}>
                  <Statistic
                    title="Total Pengunjung (F&B)"
                    value={formatRupiah(totalVisitors)}
                    prefix={<UsergroupAddOutlined />}
                  />
                  <Text type="secondary">
                    Rata-rata per hari: {Math.round(totalVisitors / totalDays)}{" "}
                    pengunjung
                  </Text>
                </Card>
              </motion.div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card loading={loading}>
                  <Statistic
                    title="Jumlah Transaksi (F&B)"
                    value={totalTransactions}
                    prefix={<FieldTimeOutlined />}
                  />
                  <Text type="secondary">
                    Rata-rata per hari:{" "}
                    {Math.round(totalTransactions / totalDays)} transaksi
                  </Text>
                </Card>
              </motion.div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card loading={loading}>
                  <Statistic
                    title={
                      !isAllTenantsView
                        ? "Rata-rata Harian (Filter)"
                        : "Rata-rata Harian"
                    }
                    value={`Rp ${formatRupiah(avgDaily)}`}
                    prefix={<ArrowUpOutlined />}
                  />
                  <Text type="secondary">Performa harian rata-rata</Text>
                </Card>
              </motion.div>
            </Col>
          </Row>

          {/* Charts */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={!isAllTenantsView ? 24 : 16}>
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
                      {dynamicTitle.line}
                    </Title>
                    <Text type="secondary">
                      {dateRange[0].format("D MMM")} -{" "}
                      {dateRange[1].format("D MMM YYYY")}
                    </Text>
                  </Col>
                  <Col span={24}>
                    <div style={{ height: 300 }}>
                      <Line
                        ref={lineChartRef}
                        data={lineData}
                        options={{
                          ...commonOptions,
                          animation: false, // --- MODIFIKASI: Matikan animasi untuk print
                          plugins: {
                            ...commonOptions.plugins,
                            legend: { display: lineData.datasets.length > 1 },
                          },
                          scales: {
                            x: {
                              ticks: { autoSkip: true },
                              title: { display: true, text: "Tanggal" },
                            },
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: (v) => `Rp ${formatRupiah(v)}`,
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </Col>
                </Row>
              </Card>

              <div style={{ display: isAllTenantsView ? "block" : "none" }}>
                <Card style={{ marginBottom: 16 }} loading={loading}>
                  <Row gutter={[12, 12]}>
                    <Col span={24}>
                      <Title level={5} style={{ marginTop: 0 }}>
                        Trafik Pengunjung (Total F&B)
                      </Title>
                      <Text type="secondary">
                        Akumulasi pengunjung selama periode {totalDays} hari.
                      </Text>
                      <div style={{ height: 300, marginTop: 10 }}>
                        <Bar
                          ref={trafficBarRef}
                          data={trafficBarData}
                          options={{ ...trafficBarOptions, animation: false }} // Matikan animasi
                        />
                      </div>
                    </Col>
                  </Row>
                </Card>

                <Card style={{ marginBottom: 16 }} loading={loading}>
                  <Row gutter={[12, 12]}>
                    <Col xs={24}>
                      <Title level={5} style={{ marginTop: 0 }}>
                        Peak Hours Menu (Total F&B)
                      </Title>
                      <Text type="secondary">
                        Akumulasi pemesanan selama periode {totalDays} hari.
                      </Text>
                      {!topPeakIdx.length && (
                        <Text type="secondary">
                          Belum ada jam dengan pesanan menu &gt; 0 pada rentang
                          ini.
                        </Text>
                      )}
                      <div style={{ height: 220 }}>
                        <Bar
                          ref={peakBarRef}
                          data={peakBarData}
                          options={{ ...peakBarOptions, animation: false }} // Matikan animasi
                        />
                      </div>
                    </Col>
                  </Row>
                </Card>
              </div>
            </Col>

            <Col xs={24} lg={8}>
              <div style={{ display: isAllTenantsView ? "block" : "none" }}>
                <Card style={{ marginBottom: 16 }} loading={loading}>
                  <Title level={5}>Metode Pembayaran (F&B)</Title>
                  <Text type="secondary">
                    Distribusi metode pembayaran transaksi lunas.
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
                  <Title level={5}>Kontribusi Tenant</Title>
                  <div style={{ height: 220 }}>
                    <Doughnut
                      ref={doughnutChartRef}
                      data={doughnutData}
                      options={{ ...doughnutOptions, animation: false }} // Matikan animasi
                    />
                  </div>
                  <Divider />
                  <Space
                    direction="vertical"
                    size="small"
                    style={{ width: "100%" }}
                  >
                    {tenantTotals.map((tenant) => (
                      <div
                        key={tenant.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text>
                          <span
                            style={{
                              display: "inline-block",
                              width: 10,
                              height: 10,
                              background: tenant.color,
                              borderRadius: 2,
                              marginRight: 6,
                            }}
                          />
                          {tenant.name}
                        </Text>
                        <Text strong>Rp {formatRupiah(tenant.total)}</Text>
                      </div>
                    ))}
                  </Space>
                </Card>

                <Card style={{ marginBottom: 16 }}>
                  <Title level={5}>Target Progress</Title>
                  <Text type="secondary">
                    Total target: Rp {formatRupiah(totalTarget)}
                  </Text>
                  <div style={{ marginTop: 12 }}>
                    <Progress
                      percent={Number(pctAchieved)}
                      status={pctAchieved >= 100 ? "success" : "active"}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 8,
                      }}
                    >
                      <Text type="secondary">
                        Tercapai: Rp {formatRupiah(totalSales)}
                      </Text>
                      <Text type="secondary">
                        Sisa: Rp{" "}
                        {formatRupiah(Math.max(0, totalTarget - totalSales))}
                      </Text>
                    </div>
                  </div>
                </Card>
              </div>

              {/* --- MODIFIKASI: Pindahkan Quick Actions ke sini --- */}
              <Card className="no-print">
                {" "}
                {/* Sembunyikan quick actions dari print */}
                <Title level={5}>Quick Actions</Title>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadReport}
                    style={{ width: "100%" }}
                  >
                    Cetak Gambar
                  </Button>
                  <Button
                    icon={<FileExcelOutlined />}
                    loading={exportLoading}
                    onClick={handleExportExcel}
                    style={{ width: "100%" }}
                  >
                    Cetak Laporan (Excel)
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* TOP + UNPOPULAR tables */}
          <Divider />
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Top 5 Menu" loading={loading}>
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
                title="Unpopular Menu (Paling Jarang Dibeli)"
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
        </div>{" "}
        {/* --- AKHIR MODIFIKASI: Akhir dari div printRef --- */}
      </div>

      {/* Preview modal sederhana */}
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
              ></a>
            </div>
          </div>
        </div>
      )}
    </ConfigProvider>
  );
};

// ===== Tiny dev-time tests (dev only) =====
if (
  typeof process !== "undefined" &&
  process.env &&
  process.env.NODE_ENV !== "production"
) {
  console.assert(
    JSON.stringify(getTopNIndices([0, 5, 2, 9, 1], 3)) ===
      JSON.stringify([3, 1, 2]),
    "getTopNIndices should pick top 3 indices"
  );
  console.assert(
    JSON.stringify(maskExceptIndices([10, 20, 30, 40], [1, 3])) ===
      JSON.stringify([null, 20, null, 40]),
    "maskExceptIndices should null other indices"
  );
}

export default FnBDashboard;
