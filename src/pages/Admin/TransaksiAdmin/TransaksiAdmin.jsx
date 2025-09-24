import React, { useState } from "react";
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
} from "antd";
import { CalendarOutlined, DatabaseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const TransaksiAdmin = () => {
  const [dateRange, setDateRange] = useState([
    dayjs("2025-09-01", "YYYY-MM-DD"),
    dayjs("2025-09-03", "YYYY-MM-DD"),
  ]);

  const columns = [
    { title: "Datetime", dataIndex: "datetime", key: "datetime" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Table", dataIndex: "table", key: "table" },
    { title: "Sub Total", dataIndex: "subtotal", key: "subtotal" },
    { title: "Discount", dataIndex: "discount", key: "discount" },
    { title: "Tax", dataIndex: "tax", key: "tax" },
    { title: "Total (Rp)", dataIndex: "total", key: "total" },
    {
      title: "#",
      key: "action",
      render: () => (
        <Button type="primary" size="small" icon={<DatabaseOutlined />} />
      ),
    },
  ];

  const data = [
    {
      key: "1",
      datetime: "04/09/2025 15:14",
      name: "Komang",
      table: "Homebro",
      subtotal: "24.000,00",
      discount: "0.00",
      tax: "0.00",
      total: "24.000,00",
    },
    {
      key: "2",
      datetime: "04/09/2025 15:14",
      name: "Nanda",
      table: "Meja Depan Leseh",
      subtotal: "15.000,00",
      discount: "0.00",
      tax: "0.00",
      total: "15.000,00",
    },
    {
      key: "3",
      datetime: "04/09/2025 15:14",
      name: "Nanda",
      table: "Homebro",
      subtotal: "18.000,00",
      discount: "0.00",
      tax: "0.00",
      total: "18.000,00",
    },
    {
      key: "4",
      datetime: "04/09/2025 15:14",
      name: "Krisna",
      table: "Homebro",
      subtotal: "10.000,00",
      discount: "0.00",
      tax: "0.00",
      total: "10.000,00",
    },
    {
      key: "5",
      datetime: "04/09/2025 15:14",
      name: "Dash",
      table: "Homebro",
      subtotal: "10.000,00",
      discount: "0.00",
      tax: "0.00",
      total: "10.000,00",
    },
  ];

  return (
    <div style={{ height: "100vh", background: "#f5f5f5" }}>
      <div style={{ padding: 24, height: "100%", overflowY: "auto" }}>
        {/* Header */}
        <Card style={{ marginBottom: 16 }}>
          <Row
            justify="space-between"
            align="middle"
            gutter={[16, 16]}
          >
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                History Transaksi POS
              </Title>
            </Col>
            <Col>
              <Space>
                <Text strong>Month Period</Text>
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
<Row
  justify="space-between"
  align="middle"
  style={{ marginBottom: 16, padding: "0 8px" }}
>
  <Col>
    <Text
      strong
      style={{ fontSize: "16px", marginRight: 6, fontSize: "20px" }}
    >
      Total Transaction:
    </Text>
    </Col>
    <Col>
    <Text
      style={{ color: "#2f54eb", fontWeight: 600, fontSize: "20px" }}
    >
      Rp 2.421.000
    </Text>
  </Col>

  <Col>
    <Text
      strong
      style={{ fontSize: "16px", marginRight: 6, fontSize: "20px" }}
    >
      Current Balance:
    </Text>
    </Col>
    <Col>
    <Text
      style={{ color: "#2f54eb", fontWeight: 600, fontSize: "20px" }}
    >
      Rp 0
    </Text>
  </Col>

  <Col>
    <Button
      type="primary"
      style={{
        borderRadius: "20px",
        fontWeight: 600,
        fontSize: "16px",
        height: "36px",
        padding: "0 20px",
      }}
    >
      Export
    </Button>
  </Col>
</Row>



        {/* Table Section */}
        <Card title="Space Rental (Today)">
          <Row
            justify="space-between"
            align="middle"
            style={{ marginBottom: 12 }}
          >
            <Col>
              <Select defaultValue="10" style={{ width: 100 }}>
                <Option value="10">10</Option>
                <Option value="20">20</Option>
              </Select>
            </Col>
            <Col>
              <Input.Search placeholder="Cari..." allowClear />
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={data}
            pagination={{ pageSize: 5 }}
            bordered
            size="middle"
            locale={{
              emptyText: "Tidak ada data yang ditemukan - maaf",
            }}
          />
        </Card>
      </div>
    </div>
  );
};

export default TransaksiAdmin;