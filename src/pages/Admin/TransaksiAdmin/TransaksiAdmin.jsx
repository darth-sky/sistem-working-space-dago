import React, { useState, useEffect } from "react";
import {
  DatePicker,
  Table,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Spin,
  Alert,
} from "antd";
import { DatabaseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getTransactionHistory } from "../../../services/service"; // Service tetap sama

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const TransaksiAdmin = () => {
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs()]);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ totalTransaction: 0, currentBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange || dateRange.length !== 2) return;

      setLoading(true);
      try {
        const startDate = dateRange[0].format("YYYY-MM-DD");
        const endDate = dateRange[1].format("YYYY-MM-DD");
        const response = await getTransactionHistory(startDate, endDate);
        
        setData(response.transactions);
        setSummary(response.summary);
        setError(null);
      } catch (err) {
        setError("Gagal memuat data transaksi. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  // PERBAIKAN 1: Update kolom untuk menampilkan kategori yang benar
  const columns = [
    {
      title: "Datetime",
      dataIndex: "tanggal_transaksi",
      key: "datetime",
      render: (text) => dayjs(text).format("DD/MM/YYYY HH:mm"),
      sorter: (a, b) => dayjs(a.tanggal_transaksi).unix() - dayjs(b.tanggal_transaksi).unix(),
    },
    { title: "Name", dataIndex: "name", key: "name", sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: "Category / Details", dataIndex: "category", key: "category" }, // Mengganti "Table"
    {
      title: "Sub Total (Rp)",
      dataIndex: "subtotal",
      key: "subtotal",
      render: (val) => parseInt(val).toLocaleString('id-ID'),
      sorter: (a, b) => a.subtotal - b.subtotal,
    },
    {
      title: "Discount (Rp)",
      dataIndex: "discount",
      key: "discount",
      render: (val) => parseInt(val).toLocaleString('id-ID'),
    },
    {
      title: "Total (Rp)",
      dataIndex: "total",
      key: "total",
      render: (val) => parseInt(val).toLocaleString('id-ID'),
      sorter: (a, b) => a.total - b.total,
    },
  ];

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
  };

  const filteredData = data.filter((item) =>
    Object.values(item).some(
      (val) =>
        val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div style={{ height: "100vh", background: "#f5f5f5" }}>
      <div style={{ padding: 24, height: "100%", overflowY: "auto" }}>
        {/* Header */}
        <Card style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                <DatabaseOutlined style={{ marginRight: 8 }} />
                History Transaksi
              </Title>
            </Col>
            <Col>
              <Space>
                <Text strong>Pilih Rentang Tanggal</Text>
                <RangePicker
                  value={dateRange}
                  onChange={(val) => setDateRange(val)}
                  format="YYYY-MM-DD"
                />
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Stats */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 16, padding: "0 8px" }}>
          <Col flex="1">
            <Space size="large">
                <Text strong style={{ fontSize: "18px" }}>
                  Total Transaksi: 
                  <span style={{ color: "#2f54eb", fontWeight: 600, marginLeft: 8 }}>
                    Rp {summary.totalTransaction.toLocaleString('id-ID')}
                  </span>
                </Text>
                <Text strong style={{ fontSize: "18px" }}>
                  Current Balance: 
                  <span style={{ color: "#2f54eb", fontWeight: 600, marginLeft: 8 }}>
                    Rp {summary.currentBalance.toLocaleString('id-ID')}
                  </span>
                </Text>
            </Space>
          </Col>
          <Col>
            <Button type="primary" style={{ borderRadius: "8px" }}>
              Export
            </Button>
          </Col>
        </Row>

        {/* Table Section */}
        <Card title="Daftar Transaksi">
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Select
                value={pagination.pageSize}
                onChange={(value) => setPagination({ ...pagination, current: 1, pageSize: value })}
                style={{ width: 120 }}
              >
                <Option value={10}>10 / Halaman</Option>
                <Option value={20}>20 / Halaman</Option>
                <Option value={50}>50 / Halaman</Option>
              </Select>
            </Col>
            <Col>
              <Input.Search
                placeholder="Cari transaksi..."
                allowClear
                onSearch={(value) => setSearchTerm(value)}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 300 }}
              />
            </Col>
          </Row>
          
          {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: 16 }} />}

          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id_transaksi"
              pagination={pagination}
              onChange={handleTableChange}
              bordered
              size="middle"
            />
          </Spin>
        </Card>
      </div>
    </div>
  );
};

export default TransaksiAdmin;