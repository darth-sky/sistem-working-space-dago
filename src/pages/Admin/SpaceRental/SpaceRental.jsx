import React, { useState } from "react";
import {
  DatePicker,
  Table,
  Radio,
  Select,
  Card,
  Row,
  Col,
  List,
  Input,
  Typography,
} from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const SpaceRental = () => {
  const [status, setStatus] = useState("Active");

  const columns = [
    { title: "Product", dataIndex: "product", key: "product" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Unit", dataIndex: "unit", key: "unit" },
    { title: "Start Time", dataIndex: "start", key: "start" },
    { title: "End Time", dataIndex: "end", key: "end" },
    { title: "Total (Rp)", dataIndex: "total", key: "total" },
  ];

  const spaceUnits = [
    { name: "Space Monitor", total: 6, available: 6 },
    { name: "Open Space", total: 14, available: 14 },
    { name: "Meeting Room Kecil", total: 2, available: 2 },
    { name: "Meeting Room Besar", total: 1, available: 1 },
    { name: "Space Lesehan", total: 6, available: 6 },
  ];

  return (
    <div style={{ height: "100vh", width: "100%", background: "#f5f5f5" }}>
      {/* CONTENT */}
      <div style={{ padding: 24, overflowY: "auto", height: "100%" }}>
        {/* Date + Month Period */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle" justify="space-between">
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                  04 September 2025
              </Title>
            </Col>
            <Col>
              <Text strong style={{ marginRight: 8 }}>
                Month Period
              </Text>
              <RangePicker
                defaultValue={[
                  dayjs("2025-09-01", "YYYY-MM-DD"),
                  dayjs("2025-09-03", "YYYY-MM-DD"),
                ]}
                format="YYYY-MM-DD"
              />
            </Col>
          </Row>
        </Card>

        {/* Stats */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Card bordered={false} style={{ background: "#1677ff", color: "#fff" }}>
              <Row justify="space-between">
                <Text style={{ color: "#fff" }}>Today Transaction</Text>
                <Text strong style={{ color: "#fff" }}>
                  Rp. 0
                </Text>
              </Row>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card bordered={false} style={{ background: "#fde68a" }}>
              <Row justify="space-between">
                <Text>Space Rental</Text>
                <Text strong>0</Text>
              </Row>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card bordered={false} style={{ background: "#bbf7d0" }}>
              <Row justify="space-between">
                <Text>Space Available</Text>
                <Text strong>29</Text>
              </Row>
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Left: Space Unit */}
          <Col xs={24} md={6}>
            <Card title="Space Unit Type">
              <List
                dataSource={spaceUnits}
                renderItem={(item) => (
                  <List.Item>
                    <Row
                      style={{ width: "100%" }}
                      justify="space-between"
                      align="middle"
                    >
                      <Col>
                        <Text strong style={{ marginRight: 8 }}>
                          {item.total}
                        </Text>
                        <Text type="success" style={{ marginRight: 8 }}>
                          {item.available}
                        </Text>
                        <Text>{item.name}</Text>
                      </Col>
                      <Col>
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "green",
                          }}
                        />
                      </Col>
                    </Row>
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* Right: Space Rental */}
          <Col xs={24} md={18}>
            <Card
              title="Space Rental (Today)"
              extra={
                <Radio.Group
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="Active">Active</Radio.Button>
                  <Radio.Button value="Finish">Finish</Radio.Button>
                </Radio.Group>
              }
            >
              {/* Filter */}
              <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                <Col>
                  <Select defaultValue="10" style={{ width: 100 }}>
                    <Select.Option value="10">10</Select.Option>
                    <Select.Option value="20">20</Select.Option>
                  </Select>
                </Col>
                <Col>
                  <Input.Search placeholder="Cari..." allowClear />
                </Col>
              </Row>

              {/* Table */}
              <Table
                columns={columns}
                dataSource={[]}
                locale={{ emptyText: "Tidak ada data yang ditemukan - maaf" }}
                pagination={{ pageSize: 5 }}
                bordered
                size="middle"
                rowKey="id"
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default SpaceRental;