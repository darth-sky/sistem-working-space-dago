// import React, { useState } from "react";
// import { Input, Modal, Button } from "antd";
// import {
//   HomeOutlined,
//   AppstoreOutlined,
//   SettingOutlined,
//   MenuOutlined,
//   UserOutlined,
// } from "@ant-design/icons";

// const { Search } = Input;

// const DashboardTenant = () => {
//   const [collapsed, setCollapsed] = useState(false);
//   const [orders, setOrders] = useState([
//     {
//       id: 1,
//       code: "#QWERTY45678",
//       name: "Adi",
//       type: "Dine In",
//       place: "Ruang Meeting 1",
//       status: "NEW",
//       items: [
//         { id: 1, name: "Kopi Latte", qty: 2, note: "Extra shot espresso" },
//         { id: 2, name: "Roti Bakar Coklat", qty: 1, note: "Tanpa Keju" },
//       ],
//     },
//     {
//       id: 2,
//       code: "#QWERTY12345",
//       name: "Budi",
//       type: "Take Away",
//       place: "-",
//       status: "ON PROSES",
//       items: [{ id: 1, name: "Teh Tarik", qty: 1, note: "Less sugar" }],
//     },
//     {
//       id: 3,
//       code: "#QWERTY98765",
//       name: "Citra",
//       type: "Dine In",
//       place: "Table 5",
//       status: "FINISH",
//       items: [{ id: 1, name: "Nasi Goreng", qty: 1, note: "Pedas" }],
//     },
//   ]);
//   const [selectedOrder, setSelectedOrder] = useState(null);

//   const updateStatus = (id, newStatus) => {
//     setOrders((prev) =>
//       prev.map((order) =>
//         order.id === id ? { ...order, status: newStatus } : order
//       )
//     );
//     setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
//   };

//   return (
//     <div className="h-screen flex flex-col bg-gray-100">
//       {/* Topbar (full width, hanya sekali) */}
//       <div className="w-full bg-white shadow-sm flex items-center px-6 py-4 relative">
//         {/* Garis tiga kiri */}
//         <button
//           onClick={() => setCollapsed(!collapsed)}
//           className="mr-4 text-xl"
//         >
//           <MenuOutlined />
//         </button>

//         {/* Logo dago di tengah */}
//         <div className="absolute left-1/2 transform -translate-x-1/2 font-bold text-2xl">
//           <span className="text-orange-500">da</span>
//           <span className="text-green-500">go</span>
//         </div>

//         {/* User info kanan */}
//         <div className="ml-auto flex items-center space-x-3 text-sm">
//           <div className="text-right hidden md:block">
//             <p className="font-semibold">ADMIN TENANT HOMEBRO</p>
//             <p className="text-gray-500">Cashier 04 September 2025</p>
//           </div>
//           <div className="bg-gray-200 rounded-full p-2">
//             <UserOutlined className="text-lg text-gray-600" />
//           </div>
//         </div>
//       </div>

//       <div className="flex flex-1">
//               {/* Sidebar (left) */}
//               <aside
//                 className={`bg-gray-800 text-white ${
//                   collapsed ? "w-20" : "w-28"
//                 } transition-all duration-300`}
//               >
//                 <nav className="pt-6">
//                   <ul>
//                     <li className="px-3 py-2">
//                       <a 
//                       href="/dashbord-tenant"
//                       className="flex flex-col items-center gap-3 rounded p-2  bg-blue-700">
//                         <HomeOutlined className="text-3xl" />
//                         {!collapsed && <span className="text-center text-sm font-semibold">Order</span>}
//                       </a>
//                     </li>
      
//                     <li className="px-3 py-2">
//                       <a 
//                       href="/kelola-stok"
//                       className="flex flex-col items-center gap-2 rounded p-2hover:bg-gray-700">
//                         <AppstoreOutlined className="text-3xl" />
//                         {!collapsed &&
//                           <span className="text-center text-sm">Kelola Stok</span>
//                         }
//                       </a>
//                     </li>
//                     <li className="px-3 py-2">
//                       <a 
//                        href="/setting-tenant"
//                        className="flex flex-col items-center gap-3 rounded p-2 hover:bg-gray-700">
//                         <SettingOutlined className="text-3xl" />
//                         {!collapsed && <span className="text-center text-sm">Setting & Utility</span>}
//                       </a>
//                     </li>
//                   </ul>
//                 </nav>
//               </aside>

//         {/* Main Content */}
//         <div className="flex-1 flex flex-col">
//           <div className="p-6 overflow-y-auto flex-1">
//             <h2 className="text-xl font-semibold mb-1">Welcome</h2>
//             <p className="text-gray-600 mb-6">
//               DagoEng Creative Hub & Caffee Lab
//             </p>

//             {/* Search */}
//             <div className="mb-6">
//               <Search
//                 placeholder="Search"
//                 allowClear
//                 className="w-full md:w-1/2"
//               />
//             </div>

//             {/* Active Orders */}
//             <h3 className="text-lg font-semibold mb-4">Active Order</h3>
//             <div className="space-y-4">
//               {orders.map((order) => (
//                 <div
//                   key={order.id}
//                   className="bg-gray-200 rounded-lg p-4 flex justify-between items-center"
//                 >
//                   <div>
//                     <p className="font-bold uppercase">{order.name}</p>
//                     <p className="text-xs text-gray-600">{order.code}</p>
//                   </div>
//                   <button
//                     onClick={() => setSelectedOrder(order)}
//                     className={`font-bold ${
//                       order.status === "NEW"
//                         ? "text-red-600"
//                         : order.status === "ON PROSES"
//                         ? "text-blue-800"
//                         : "text-green-600"
//                     }`}
//                   >
//                     {order.status}
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Modal detail order */}
//         <Modal
//           open={!!selectedOrder}
//           footer={null}
//           onCancel={() => setSelectedOrder(null)}
//           width={600}
//         >
//           {selectedOrder && (
//             <div>
//               <p>
//                 <b>Nomor Pesanan :</b> {selectedOrder.code}
//               </p>
//               <p>
//                 <b>Nama Pelanggan :</b> {selectedOrder.name}
//               </p>
//               <p>
//                 <b>Jenis Pesanan :</b> {selectedOrder.type}
//               </p>
//               <p>
//                 <b>Tempat :</b> {selectedOrder.place}
//               </p>
//               <hr className="my-3" />

//               <p className="font-semibold mb-2">Rincian Pesanan:</p>
//               <ul className="space-y-2">
//                 {selectedOrder.items.map((item, idx) => (
//                   <li key={item.id}>
//                     {idx + 1}. {item.name} (Qty: {item.qty})<br />
//                     <span className="text-gray-600 text-sm">
//                       Note: {item.note}
//                     </span>
//                   </li>
//                 ))}
//               </ul>

//               {/* Tombol reaksi */}
//               <div className="mt-6 flex gap-4 justify-center">
//                 {selectedOrder.status === "NEW" && (
//                   <>
//                     <Button
//                       type="primary"
//                       style={{ backgroundColor: "blue" }}
//                       onClick={() =>
//                         updateStatus(selectedOrder.id, "ON PROSES")
//                       }
//                     >
//                       Terima Order
//                     </Button>
//                     <Button
//                       type="primary"
//                       style={{ backgroundColor: "green", borderColor: "green" }}
//                       onClick={() => updateStatus(selectedOrder.id, "FINISH")}
//                     >
//                       Selesai
//                     </Button>
//                   </>
//                 )}
//                 {selectedOrder.status === "ON PROSES" && (
//                   <Button
//                     type="primary"
//                     style={{ backgroundColor: "green", borderColor: "green" }}
//                     onClick={() => updateStatus(selectedOrder.id, "FINISH")}
//                   >
//                     Selesai
//                   </Button>
//                 )}
//                 {selectedOrder.status === "FINISH" && (
//                   <div className="text-green-600 font-bold text-lg">
//                     ✅ FINISH
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </Modal>
//       </div>
//     </div>
//   );
// };

// export default DashboardTenant;
import React, { useState } from "react";
import { Input, Modal, Button } from "antd";

const { Search } = Input;

const DashboardTenant = () => {
  const [orders, setOrders] = useState([
    {
      id: 1,
      code: "#QWERTY45678",
      name: "Adi",
      type: "Dine In",
      place: "Ruang Meeting 1",
      status: "NEW",
      items: [
        { id: 1, name: "Kopi Latte", qty: 2, note: "Extra shot espresso" },
        { id: 2, name: "Roti Bakar Coklat", qty: 1, note: "Tanpa Keju" },
      ],
    },
    {
      id: 2,
      code: "#QWERTY12345",
      name: "Budi",
      type: "Take Away",
      place: "-",
      status: "ON PROSES",
      items: [{ id: 1, name: "Teh Tarik", qty: 1, note: "Less sugar" }],
    },
    {
      id: 3,
      code: "#QWERTY98765",
      name: "Citra",
      type: "Dine In",
      place: "Table 5",
      status: "FINISH",
      items: [{ id: 1, name: "Nasi Goreng", qty: 1, note: "Pedas" }],
    },
  ]);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const updateStatus = (id, newStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status: newStatus } : order
      )
    );
    setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
  };

  return (
    <div className="p-6 overflow-y-auto flex-1">
      <h2 className="text-xl font-semibold mb-1">Welcome</h2>
      <p className="text-gray-600 mb-6">DagoEng Creative Hub & Coffee Lab</p>

      {/* Search */}
      <div className="mb-6">
        <Search placeholder="Search" allowClear className="w-full md:w-1/2" />
      </div>

      {/* Active Orders */}
      <h3 className="text-lg font-semibold mb-4">Active Order</h3>
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-gray-200 rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-bold uppercase">{order.name}</p>
              <p className="text-xs text-gray-600">{order.code}</p>
            </div>
            <button
              onClick={() => setSelectedOrder(order)}
              className={`font-bold ${
                order.status === "NEW"
                  ? "text-red-600"
                  : order.status === "ON PROSES"
                  ? "text-blue-800"
                  : "text-green-600"
              }`}
            >
              {order.status}
            </button>
          </div>
        ))}
      </div>

      {/* Modal detail order */}
      <Modal
        open={!!selectedOrder}
        footer={null}
        onCancel={() => setSelectedOrder(null)}
        width={600}
      >
        {selectedOrder && (
          <div>
            <p>
              <b>Nomor Pesanan :</b> {selectedOrder.code}
            </p>
            <p>
              <b>Nama Pelanggan :</b> {selectedOrder.name}
            </p>
            <p>
              <b>Jenis Pesanan :</b> {selectedOrder.type}
            </p>
            <p>
              <b>Tempat :</b> {selectedOrder.place}
            </p>
            <hr className="my-3" />

            <p className="font-semibold mb-2">Rincian Pesanan:</p>
            <ul className="space-y-2">
              {selectedOrder.items.map((item, idx) => (
                <li key={item.id}>
                  {idx + 1}. {item.name} (Qty: {item.qty})<br />
                  <span className="text-gray-600 text-sm">
                    Note: {item.note}
                  </span>
                </li>
              ))}
            </ul>

            {/* Tombol reaksi */}
            <div className="mt-6 flex gap-4 justify-center">
              {selectedOrder.status === "NEW" && (
                <>
                  <Button
                    type="primary"
                    style={{ backgroundColor: "blue" }}
                    onClick={() => updateStatus(selectedOrder.id, "ON PROSES")}
                  >
                    Terima Order
                  </Button>
                  <Button
                    type="primary"
                    style={{ backgroundColor: "green", borderColor: "green" }}
                    onClick={() => updateStatus(selectedOrder.id, "FINISH")}
                  >
                    Selesai
                  </Button>
                </>
              )}
              {selectedOrder.status === "ON PROSES" && (
                <Button
                  type="primary"
                  style={{ backgroundColor: "green", borderColor: "green" }}
                  onClick={() => updateStatus(selectedOrder.id, "FINISH")}
                >
                  Selesai
                </Button>
              )}
              {selectedOrder.status === "FINISH" && (
                <div className="text-green-600 font-bold text-lg">✅ FINISH</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DashboardTenant;
