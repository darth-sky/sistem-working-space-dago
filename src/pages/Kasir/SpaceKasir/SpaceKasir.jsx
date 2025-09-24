import React, { useState } from "react";
import { Input, Button, Tag } from "antd";
import {
  DesktopOutlined,
  HomeOutlined,
  UserOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";

const { Search } = Input;

const SpaceKasir = () => {
  const [status, setStatus] = useState("Active");

  const spaceTypes = [
    { name: "Space Monitor", total: 6, available: 6, icon: <DesktopOutlined /> },
    { name: "Space Lesehan", total: 6, available: 6, icon: <HomeOutlined /> },
    { name: "Meeting Room Kecil", total: 2, available: 2, icon: <UserOutlined /> },
    { name: "Meeting Room Besar", total: 1, available: 1, icon: <UserOutlined /> },
    { name: "Open Space", total: 14, available: 14, icon: <AppstoreOutlined /> },
  ];

  const spaceUnits = ["OS7", "OS8", "OS9", "OS10", "OS11", "OS12", "OS13", "MR3"];

  // Data untuk Space Rental (card list)
  const rentals = [
    {
      id: 1,
      client: "client7",
      unit: "sm1",
      date: "18/09/2025 10:02",
      price: 15000,
      time: "01:45:23",
      level: "green",
    },
    {
      id: 2,
      client: "client6",
      unit: "sm2",
      date: "18/09/2025 09:15",
      price: 20000,
      time: "00:35:10",
      level: "yellow",
    },
    {
      id: 3,
      client: "client5",
      unit: "sm1",
      date: "18/09/2025 08:09",
      price: 30000,
      time: "08:38",
      level: "red",
    },
  ];

  // mapping warna berdasarkan level
  const timeColorMap = {
    green: "bg-green-200 text-black",
    yellow: "bg-yellow-200 text-black",
    red: "bg-red-200 text-black",
  };

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Search bar */}
      <Search placeholder="Search" allowClear className="w-full rounded-md" />

      {/* Top Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-600 text-white p-4 rounded-lg shadow text-center">
          <p className="text-sm">Today Transaction</p>
          <p className="text-2xl font-bold">Rp 22.500</p>
        </div>
        <div className="bg-yellow-400 text-black p-4 rounded-lg shadow text-center">
          <p className="text-sm">Space Rental</p>
          <p className="text-2xl font-bold">1</p>
        </div>
        <div className="bg-green-500 text-white p-4 rounded-lg shadow text-center">
          <p className="text-sm">Space Available</p>
          <p className="text-2xl font-bold">28</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Space Unit Type */}
        <div className="col-span-1">
          <h3 className="font-bold mb-2">Space Unit Type</h3>
          <div className="space-y-2">
            {spaceTypes.map((type, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2 shadow"
              >
                <div className="flex items-center space-x-2">
                  <Tag color="blue">{type.total}</Tag>
                  <Tag color="green">{type.available}</Tag>
                </div>
                <span className="text-sm font-medium">{type.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Space Unit Available + Space Rental */}
        <div className="col-span-3 space-y-4">
          {/* Space Units */}
          <div>
            <h3 className="font-bold mb-2">Space Unit Available (28)</h3>
            <div className="flex flex-wrap gap-2">
              {spaceUnits.map((unit, index) => (
                <div
                  key={index}
                  className="w-16 h-16 bg-white rounded-lg border flex items-center justify-center shadow cursor-pointer hover:bg-blue-50"
                >
                  <span className="font-semibold">{unit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Space Rental (today) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">Space Rental (today)</h3>
              <div className="space-x-2">
                <Button
                  type={status === "Active" ? "primary" : "default"}
                  onClick={() => setStatus("Active")}
                >
                  Active
                </Button>
                <Button
                  type={status === "Finish" ? "primary" : "default"}
                  onClick={() => setStatus("Finish")}
                >
                  Finish
                </Button>
              </div>
            </div>

            {/* Card List */}
            <div className="space-y-4">
              {rentals.map((rental) => (
                <div
                  key={rental.id}
                  className="flex justify-between items-center bg-white rounded-lg shadow p-4"
                >
                  {/* Kiri */}
                  <div className="space-y-1">
                    <p className="font-semibold">{rental.client}</p>
                    <p className="text-sm text-gray-600">{rental.unit}</p>
                    <p className="text-xs text-gray-400">{rental.date}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-3 py-1 text-xs border rounded-full text-blue-600 border-blue-600">
                        BOOKING
                      </span>
                      <span className="px-3 py-1 text-xs border rounded-full text-orange-500 border-orange-500">
                        WAITING
                      </span>
                    </div>
                  </div>

                  {/* Kanan */}
                  <div className="text-right space-y-2">
                    <p className="text-blue-600 font-bold">
                      Rp {rental.price.toLocaleString("id-ID")}
                    </p>
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${timeColorMap[rental.level]}`}
                    >
                      ⏱ <span>{rental.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceKasir;