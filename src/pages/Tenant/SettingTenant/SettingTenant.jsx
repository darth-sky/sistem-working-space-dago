// import React, { useState } from "react";
// import { Input, Modal, Button, Switch } from "antd"; // sudah benar
// import {
//   HomeOutlined,
//   AppstoreOutlined,
//   SettingOutlined,
//   MenuOutlined,
//   UserOutlined,
// } from "@ant-design/icons";

// const { Search } = Input;

// const SettingTenant = () => {
//   const [collapsed, setCollapsed] = useState(false);
//   const [darkMode, setDarkMode] = useState(false);
//   const [networkIndicator, setNetworkIndicator] = useState(false);
//   const [backgroundTask, setBackgroundTask] = useState(false);

//   return (
//     <div
//       className={`h-screen flex flex-col ${
//         darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
//       }`}
//     >
//       {/* Topbar */}
//       <div
//         className={`w-full shadow-sm flex items-center px-6 py-4 relative ${
//           darkMode ? "bg-gray-800 text-white" : "bg-white"
//         }`}
//       >
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
//         {/* Sidebar (left) */}
//         <aside
//           className={`${darkMode ? "bg-gray-700" : "bg-gray-800"} text-white ${
//             collapsed ? "w-20" : "w-28"
//           } transition-all duration-300`}
//         >
//           <nav className="pt-6">
//             <ul>
//               <li className="px-3 py-2">
//                 <a
//                   href="/dashboard-tenant"
//                   className="flex flex-col items-center gap-3 rounded p-2 hover:bg-gray-700"
//                 >
//                   <HomeOutlined className="text-3xl" />
//                   {!collapsed && (
//                     <span className="text-center text-sm">Order</span>
//                   )}
//                 </a>
//               </li>

//               <li className="px-3 py-2">
//                 <a
//                   href="/kelola-stok"
//                   className="flex flex-col items-center gap-2 rounded p-2  hover:bg-gray-700"
//                 >
//                   <AppstoreOutlined className="text-3xl" />
//                   {!collapsed && (
//                     <span className="text-center text-sm">Kelola Stok</span>
//                   )}
//                 </a>
//               </li>
//               <li className="px-3 py-2">
//                 <a className="flex flex-col items-center gap-3 rounded p-2 bg-blue-700">
//                   <SettingOutlined className="text-3xl" />
//                   {!collapsed && (
//                     <span className="text-center text-sm font-semibold">
//                       Setting & Utility
//                     </span>
//                   )}
//                 </a>
//               </li>
//             </ul>
//           </nav>
//         </aside>

//         {/* Main Content */}
//         <main className="flex-1 p-6 overflow-y-auto">
//           <h2 className="text-lg font-semibold mb-4">Setting & Utility</h2>

//           {/* About */}
//           <div
//             className={`border rounded mb-4 ${
//               darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
//             }`}
//           >
//             <div className="flex justify-between items-center px-4 py-3 border-b">
//               <span className="font-medium">About</span>
//               <Button type="primary" size="small">
//                 Beta Information
//               </Button>
//             </div>
//             <div className="px-4 py-3 text-gray-500">Beta Information</div>
//           </div>

//           {/* Utility */}
//           <div
//             className={`border rounded mb-4 ${
//               darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
//             }`}
//           >
//             <div className="flex justify-between items-center px-4 py-3 border-b">
//               <span className="font-medium">Dark Mode</span>
//               <Switch
//                 checked={darkMode}
//                 onChange={() => setDarkMode(!darkMode)}
//               />
//             </div>
//             <div className="flex justify-between items-center px-4 py-3 border-b">
//               <span>
//                 <span className="font-medium">Network Indicator</span>
//                 <p className="text-gray-500 text-sm">
//                   Tampilkan indicator jaringan pada aplikasi
//                 </p>
//               </span>
//               <Switch
//                 checked={networkIndicator}
//                 onChange={() => setNetworkIndicator(!networkIndicator)}
//               />
//             </div>
//             <div className="flex justify-between items-center px-4 py-3">
//               <span>
//                 <span className="font-medium">Background Task Indicator</span>
//                 <p className="text-gray-500 text-sm">
//                   Menampilkan indicator data pada pojok kanan atas
//                 </p>
//               </span>
//               <Switch
//                 checked={backgroundTask}
//                 onChange={() => setBackgroundTask(!backgroundTask)}
//               />
//             </div>
//           </div>

//           {/* Hardware */}
//           <div
//             className={`border rounded mb-4 ${
//               darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
//             }`}
//           >
//             <div className="px-4 py-3 border-b font-medium">Hardware</div>
//             <div className="flex justify-between items-center px-4 py-3">
//               <span>
//                 Connect to Printer
//                 <p className="text-gray-500 text-sm">
//                   Belum terhubung dengan printer
//                 </p>
//               </span>
//               <Button type="primary">Connect</Button>
//             </div>
//           </div>

//           {/* Account */}
//           <div
//             className={`border rounded ${
//               darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
//             }`}
//           >
//             <div className="px-4 py-3 border-b font-medium">Account</div>
//             <div className="flex justify-between items-center px-4 py-3">
//               <span className="text-red-600 font-medium">Sign Out</span>
//               <Button type="primary" danger>
//                 Sign Out
//               </Button>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// export default SettingTenant;
import React, { useState } from "react";
import { Button, Switch } from "antd";

const SettingTenant = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [networkIndicator, setNetworkIndicator] = useState(false);
  const [backgroundTask, setBackgroundTask] = useState(false);

  return (
    <div className="p-6 overflow-y-auto flex-1">
      <h2 className="text-lg font-semibold mb-4">Setting & Utility</h2>

      {/* About */}
      <div
        className={`border rounded mb-4 ${
          darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white"
        }`}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <span className="font-medium">About</span>
          <Button type="primary" size="small">
            Beta Information
          </Button>
        </div>
        <div className="px-4 py-3 text-gray-500">Beta Information</div>
      </div>

      {/* Utility */}
      <div
        className={`border rounded mb-4 ${
          darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white"
        }`}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <span className="font-medium">Dark Mode</span>
          <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
        </div>
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <span>
            <span className="font-medium">Network Indicator</span>
            <p className="text-gray-500 text-sm">
              Tampilkan indicator jaringan pada aplikasi
            </p>
          </span>
          <Switch
            checked={networkIndicator}
            onChange={() => setNetworkIndicator(!networkIndicator)}
          />
        </div>
        <div className="flex justify-between items-center px-4 py-3">
          <span>
            <span className="font-medium">Background Task Indicator</span>
            <p className="text-gray-500 text-sm">
              Menampilkan indicator data pada pojok kanan atas
            </p>
          </span>
          <Switch
            checked={backgroundTask}
            onChange={() => setBackgroundTask(!backgroundTask)}
          />
        </div>
      </div>

      {/* Hardware */}
      <div
        className={`border rounded mb-4 ${
          darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white"
        }`}
      >
        <div className="px-4 py-3 border-b font-medium">Hardware</div>
        <div className="flex justify-between items-center px-4 py-3">
          <span>
            Connect to Printer
            <p className="text-gray-500 text-sm">
              Belum terhubung dengan printer
            </p>
          </span>
          <Button type="primary">Connect</Button>
        </div>
      </div>

      {/* Account */}
      <div
        className={`border rounded ${
          darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white"
        }`}
      >
        <div className="px-4 py-3 border-b font-medium">Account</div>
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-red-600 font-medium">Sign Out</span>
          <Button type="primary" danger>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingTenant;
