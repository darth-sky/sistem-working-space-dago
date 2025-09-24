import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import { Card, Table } from "antd";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

const DashboardAdmins = () => {
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);

  useEffect(() => {
    if (userProfile.roles !== "admin_dago") {
      navigate("/");
    }
  }, [userProfile]);

  // === Dummy Data ===
  const topSale = 150000000;

  const tenantSales = [
    { name: "Tenant Homebro", value: 60000000 },
    { name: "Tenant Dapoer M.S", value: 50000000 },
    { name: "Dago Creative Space", value: 40000000 },
  ];

  const topSaleData = {
    labels: tenantSales.map((t) => t.name),
    datasets: [
      {
        label: "Top Sale (IDR)",
        data: tenantSales.map((t) => t.value),
        backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"],
      },
    ],
  };

  const categoryData = {
    labels: [
      "HB_Coffee & Espresso",
      "HB_Non-Coffee Beverages",
      "HB_Teas & Infusions",
      "HB_Fruity & Refreshing",
      "HB_Salads & Sides",
      "HB_Hearty Bites",
      "HB_Desserts & Local Treats",
      "HB_Snack",
      "DMS_Makanan",
      "DMS_Minuman",
    ],
    datasets: [
      {
        data: [20, 15, 12, 10, 8, 10, 12, 5, 4, 4],
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#C9CBCF",
          "#B5E48C",
          "#76C893",
          "#34A0A4",
        ],
      },
    ],
  };

  const dailySelling = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Daily Sales (IDR)",
        data: [2000000, 2500000, 3000000, 2200000, 2700000, 3200000, 2800000],
        borderColor: "#FF6384",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true,
      },
    ],
  };

  const profitSummary = {
    labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    datasets: [
      {
        label: "Profit (IDR)",
        data: [15000000, 20000000, 18000000, 22000000, 25000000, 27000000],
        backgroundColor: "#4BC0C0",
      },
    ],
  };

  // Table Data
  const dataSource = [
    { key: 1, merchant: "Dapoer M.S", item: "RICE BOWLS CHICKEN BLACKPAPER", qty: 10, total: "225,000" },
    { key: 2, merchant: "HomeBro", item: "OAT LATTE", qty: 8, total: "170,000" },
    { key: 3, merchant: "HomeBro", item: "SOY LATTE", qty: 7, total: "154,000" },
    { key: 4, merchant: "Dapoer M.S", item: "OMLETE", qty: 5, total: "130,000" },
    { key: 5, merchant: "Dapoer M.S", item: "KENTANG GORENG", qty: 10, total: "225,000" },
    { key: 6, merchant: "HomeBro", item: "CAFE LATTE", qty: 8, total: "170,000" },
    { key: 7, merchant: "HomeBro", item: "CAPPUCINO", qty: 7, total: "154,000" },
    { key: 8, merchant: "Dapoer M.S", item: "RICE BOWLS SPICY CHICKEN", qty: 5, total: "130,000" },
    { key: 9, merchant: "HomeBro", item: "DIMSUM", qty: 7, total: "154,000" },
    { key: 10, merchant: "Dapoer M.S", item: "MIE BANGLADESH", qty: 5, total: "130,000" },
  ];

  const columns = [
    { title: "Merchant", dataIndex: "merchant", key: "merchant" },
    { title: "Item", dataIndex: "item", key: "item" },
    { title: "Qty", dataIndex: "qty", key: "qty" },
    { title: "Total (IDR)", dataIndex: "total", key: "total" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-md">
          <h2 className="text-xl font-bold mb-4">
            Top Sale: Rp {topSale.toLocaleString()}
          </h2>
          <Pie data={topSaleData} />
        </Card>
        <Card className="shadow-md">
          <h2 className="text-lg font-semibold mb-4">Category (IDR)</h2>
          <Pie data={categoryData} />
        </Card>
        <Card className="shadow-md overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Top 10 Product</h2>
          <Table dataSource={dataSource} columns={columns} pagination={false} size="small" />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <h2 className="text-lg font-semibold mb-4">Daily Selling</h2>
          <Line data={dailySelling} />
        </Card>
        <Card className="shadow-md">
          <h2 className="text-lg font-semibold mb-4">Profit Summary (6 Months)</h2>
          <Bar data={profitSummary} />
        </Card>
      </div>
    </div>
  );
};

export default DashboardAdmins;
