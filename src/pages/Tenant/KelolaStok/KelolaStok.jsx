// import React, { useMemo, useState } from "react";
// import { Input, Table, Switch, Button } from "antd";
// import {
//   HomeOutlined,
//   AppstoreOutlined,
//   SettingOutlined,
//   MenuOutlined,
//   UserOutlined,
// } from "@ant-design/icons";

// const { Search } = Input;

// const KelolaStok = () => {
//   const [collapsed, setCollapsed] = useState(false);

//   const [products, setProducts] = useState([
//     {
//       id: 1,
//       product: "Danish",
//       merchant: "HomeBro",
//       category: "Bakery & Sweets",
//       hpp: 16000,
//       price: 16000,
//       available: true,
//       updatedAt: new Date("2025-08-11T19:51:00"),
//     },
//     {
//       id: 2,
//       product: "Chicken Sandwich",
//       merchant: "HomeBro",
//       category: "Hearty Bites",
//       hpp: 22000,
//       price: 22000,
//       available: true,
//       updatedAt: new Date("2025-09-02T19:51:00"),
//     },
//     {
//       id: 3,
//       product: "Pisang Goreng",
//       merchant: "HomeBro",
//       category: "Desserts & Local Treats",
//       hpp: 22000,
//       price: 22000,
//       available: false,
//       updatedAt: new Date("2025-09-02T19:51:00"),
//     },
//   ]);

//   const [search, setSearch] = useState("");

//   // filter berdasarkan search (product / merchant / category)
//   const filtered = useMemo(() => {
//     const q = search.trim().toLowerCase();
//     if (!q) return products;
//     return products.filter(
//       (p) =>
//         p.product.toLowerCase().includes(q) ||
//         p.merchant.toLowerCase().includes(q) ||
//         p.category.toLowerCase().includes(q)
//     );
//   }, [products, search]);

//   const toggleAvailability = (id, value) => {
//     setProducts((prev) =>
//       prev.map((p) =>
//         p.id === id ? { ...p, available: value, updatedAt: new Date() } : p
//       )
//     );
//   };

//   // format harga (Rp)
//   const formatRp = (num) => {
//     if (typeof num !== "number") return num;
//     return "Rp " + num.toLocaleString("id-ID");
//   };

//   const dataSource = filtered.map((p, idx) => ({
//     key: p.id,
//     no: idx + 1,
//     ...p,
//   }));

//   const columns = [
//     {
//       title: "No",
//       dataIndex: "no",
//       key: "no",
//       width: 60,
//       render: (v) => <div className="font-medium">{v}</div>,
//     },
//     {
//       title: "Product",
//       dataIndex: "product",
//       key: "product",
//       render: (text) => <div className="font-semibold">{text}</div>,
//     },
//     {
//       title: "Merchant",
//       dataIndex: "merchant",
//       key: "merchant",
//       render: (m) => <div className="text-sm text-gray-600">{m}</div>,
//     },
//     {
//       title: "Category",
//       dataIndex: "category",
//       key: "category",
//       render: (c) => <div className="text-sm text-gray-600">{c}</div>,
//     },
//     {
//       title: "HPP",
//       dataIndex: "hpp",
//       key: "hpp",
//       width: 120,
//       render: (v) => <div className="font-medium">{formatRp(v)}</div>,
//     },
//     {
//       title: "Price",
//       dataIndex: "price",
//       key: "price",
//       width: 120,
//       render: (v) => <div className="font-medium">{formatRp(v)}</div>,
//     },
//     {
//       title: "Ketersediaan",
//       dataIndex: "available",
//       key: "available",
//       width: 120,
//       render: (v, record) => (
//         <Switch
//           checked={v}
//           onChange={(checked) => toggleAvailability(record.id, checked)}
//         />
//       ),
//     },
//     {
//       title: "Update At",
//       dataIndex: "updatedAt",
//       key: "updatedAt",
//       width: 180,
//       render: (d) => (
//         <div className="text-sm text-gray-600">
//           {new Date(d).toLocaleDateString("id-ID", {
//             day: "2-digit",
//             month: "long",
//             year: "numeric",
//           })}{" "}
//           <br />
//           <span className="text-xs text-gray-400">
//             {new Date(d).toLocaleTimeString("en-GB", {
//               hour: "2-digit",
//               minute: "2-digit",
//             })}
//           </span>
//         </div>
//       ),
//     },
//   ];

//   const rowClassName = () => "bg-transparent";

//   return (
//     <div className="h-screen flex flex-col bg-gray-100">
//       {/* Topbar (full width) */}
//       <div className="w-full bg-white shadow-sm flex items-center px-6 py-4 relative">
//         <button
//           onClick={() => setCollapsed(!collapsed)}
//           className="mr-4 text-2xl"
//         >
//           <MenuOutlined />
//         </button>

//         <div className="absolute left-1/2 transform -translate-x-1/2 font-bold text-2xl">
//           <span className="text-orange-500">da</span>
//           <span className="text-green-500">go</span>
//         </div>

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
//         {/* Sidebar (left) */}
//         <aside
//           className={`bg-gray-800 text-white ${
//             collapsed ? "w-20" : "w-28"
//           } transition-all duration-300`}
//         >
//           <nav className="pt-6">
//             <ul>
//               <li className="px-3 py-2">
//                 <a 
//                 href="/dashboard-tenant"
//                 className="flex flex-col items-center gap-3 rounded p-2 hover:bg-gray-700">
//                   <HomeOutlined className="text-3xl" />
//                   {!collapsed && <span className="text-center text-sm">Order</span>}
//                 </a>
//               </li>

//               <li className="px-3 py-2">
//                 <a  href="/kelola-stok"
//                 className="flex flex-col items-center gap-2 rounded p-2 bg-blue-700">
//                   <AppstoreOutlined className="text-3xl" />
//                   {!collapsed &&
//                     <span className="text-center text-sm font-semibold">Kelola Stok</span>
//                   }
//                 </a>
//               </li>
//               <li className="px-3 py-2">
//                 <a  href="/setting-tenant"
//                 className="flex flex-col items-center gap-3 rounded p-2 hover:bg-gray-700">
//                   <SettingOutlined className="text-3xl" />
//                   {!collapsed && <span className="text-center text-sm">Setting & Utility</span>}
//                 </a>
//               </li>
//             </ul>
//           </nav>
//         </aside>

//         {/* Main content */}
//         <main className="flex-1 p-6 overflow-auto">
//           <div className="max-w-full">
//             <div className="mb-6">
//               <h2 className="text-lg font-semibold">My Menu Management</h2>
//               <div className="mt-3">
//                 <Search
//                   placeholder="Search"
//                   allowClear
//                   size="large"
//                   onSearch={(v) => setSearch(v)}
//                   onChange={(e) => setSearch(e.target.value)}
//                   style={{ maxWidth: 520 }}
//                 />
//               </div>
//             </div>

//             {
//               <Table
//                 dataSource={dataSource}
//                 columns={columns}
//                 pagination={false}
//                 rowClassName={rowClassName}
//                 bordered={false}
//               />
//             }
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// export default KelolaStok;
import React, { useMemo, useState } from "react";
import { Input, Table, Switch } from "antd";

const { Search } = Input;

const KelolaStok = () => {
  const [products, setProducts] = useState([
    {
      id: 1,
      product: "Danish",
      merchant: "HomeBro",
      category: "Bakery & Sweets",
      hpp: 16000,
      price: 16000,
      available: true,
      updatedAt: new Date("2025-08-11T19:51:00"),
    },
    {
      id: 2,
      product: "Chicken Sandwich",
      merchant: "HomeBro",
      category: "Hearty Bites",
      hpp: 22000,
      price: 22000,
      available: true,
      updatedAt: new Date("2025-09-02T19:51:00"),
    },
    {
      id: 3,
      product: "Pisang Goreng",
      merchant: "HomeBro",
      category: "Desserts & Local Treats",
      hpp: 22000,
      price: 22000,
      available: false,
      updatedAt: new Date("2025-09-02T19:51:00"),
    },
  ]);

  const [search, setSearch] = useState("");

  // filter berdasarkan search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.product.toLowerCase().includes(q) ||
        p.merchant.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  const toggleAvailability = (id, value) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, available: value, updatedAt: new Date() } : p
      )
    );
  };

  // format harga (Rp)
  const formatRp = (num) => {
    if (typeof num !== "number") return num;
    return "Rp " + num.toLocaleString("id-ID");
  };

  const dataSource = filtered.map((p, idx) => ({
    key: p.id,
    no: idx + 1,
    ...p,
  }));

  const columns = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
      width: 60,
      render: (v) => <div className="font-medium">{v}</div>,
    },
    {
      title: "Product",
      dataIndex: "product",
      key: "product",
      render: (text) => <div className="font-semibold">{text}</div>,
    },
    {
      title: "Merchant",
      dataIndex: "merchant",
      key: "merchant",
      render: (m) => <div className="text-sm text-gray-600">{m}</div>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (c) => <div className="text-sm text-gray-600">{c}</div>,
    },
    {
      title: "HPP",
      dataIndex: "hpp",
      key: "hpp",
      width: 120,
      render: (v) => <div className="font-medium">{formatRp(v)}</div>,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: 120,
      render: (v) => <div className="font-medium">{formatRp(v)}</div>,
    },
    {
      title: "Ketersediaan",
      dataIndex: "available",
      key: "available",
      width: 120,
      render: (v, record) => (
        <Switch
          checked={v}
          onChange={(checked) => toggleAvailability(record.id, checked)}
        />
      ),
    },
    {
      title: "Update At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: (d) => (
        <div className="text-sm text-gray-600">
          {new Date(d).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}{" "}
          <br />
          <span className="text-xs text-gray-400">
            {new Date(d).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 overflow-auto flex-1">
      <div className="max-w-full">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">My Menu Management</h2>
          <div className="mt-3">
            <Search
              placeholder="Search"
              allowClear
              size="large"
              onSearch={(v) => setSearch(v)}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 520 }}
            />
          </div>
        </div>

        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          bordered={false}
          rowClassName={() => "bg-transparent"}
        />
      </div>
    </div>
  );
};

export default KelolaStok;
