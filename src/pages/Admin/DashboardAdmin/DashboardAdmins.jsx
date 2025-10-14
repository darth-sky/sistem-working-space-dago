import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import { Card, Table, Spin, Alert } from "antd";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, PointElement, LineElement,
} from "chart.js";
import { getAdminDashboardData } from "../../../services/service"; // Import service baru

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, PointElement, LineElement
);

// Helper untuk format data chart
const formatChartData = (label, data, backgroundColors, labelName) => ({
  labels: data.map(d => d[label]),
  datasets: [
    {
      label: labelName,
      data: data.map(d => d.value),
      backgroundColor: backgroundColors,
    },
  ],
});

const DashboardAdmins = () => {
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    // Redirect jika bukan admin
    if (userProfile && userProfile.roles !== "admin_dago") {
      navigate("/");
    }
  }, [userProfile, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getAdminDashboardData();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        setError("Gagal memuat data dasbor. Pastikan Anda terhubung ke server.");
      } finally {
        setLoading(false);
      }
    };

    if (userProfile && userProfile.roles === "admin_dago") {
        fetchData();
    }
  }, [userProfile]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  }

  if (error) {
    return <div className="p-6"><Alert message="Error" description={error} type="error" showIcon /></div>;
  }

  if (!dashboardData) {
    return null; // Atau tampilkan pesan lain jika data kosong
  }

  // Siapkan data untuk charts
  const topSaleData = formatChartData("name", dashboardData.tenantSales, ["#36A2EB", "#FF6384", "#FFCE56"], "Penjualan (IDR)");
  const categoryData = formatChartData("name", dashboardData.categorySales, ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"], "Penjualan (IDR)");
  
  const dailySelling = {
    labels: dashboardData.dailySelling.labels,
    datasets: [{
      label: "Penjualan Harian (IDR)",
      data: dashboardData.dailySelling.data,
      borderColor: "#FF6384",
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      fill: true,
    }],
  };
  
  const monthlySummary = {
    labels: dashboardData.monthlySummary.labels,
    datasets: [{
      label: "Penjualan Bulanan (IDR)",
      data: dashboardData.monthlySummary.data,
      backgroundColor: "#4BC0C0",
    }],
  };

  const topProductsColumns = [
    { title: "Merchant", dataIndex: "merchant", key: "merchant" },
    { title: "Item", dataIndex: "item", key: "item" },
    { title: "Qty", dataIndex: "qty", key: "qty" },
    { title: "Total (IDR)", dataIndex: "total", key: "total", render: (val) => parseInt(val).toLocaleString('id-ID') },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-md">
          <h2 className="text-xl font-bold mb-4">
            Total Penjualan: Rp {dashboardData.topSaleTotal.toLocaleString('id-ID')}
          </h2>
          <Pie data={topSaleData} />
        </Card>
        <Card className="shadow-md">
          <h2 className="text-lg font-semibold mb-4">Penjualan per Kategori</h2>
          <Pie data={categoryData} />
        </Card>
        <Card className="shadow-md overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Top 10 Produk</h2>
          <Table dataSource={dashboardData.topProducts} columns={topProductsColumns} pagination={false} size="small" rowKey="item" />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <h2 className="text-lg font-semibold mb-4">Penjualan Harian (7 Hari)</h2>
          <Line data={dailySelling} />
        </Card>
        <Card className="shadow-md">
          <h2 className="text-lg font-semibold mb-4">Ringkasan Penjualan (6 Bulan)</h2>
          <Bar data={monthlySummary} />
        </Card>
      </div>
    </div>
  );
};

export default DashboardAdmins;