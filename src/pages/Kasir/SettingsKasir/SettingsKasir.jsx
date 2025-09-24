import React, { useState } from 'react';

// A reusable Toggle Switch component
const ToggleSwitch = ({ id, checked, onChange }) => {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer">
      <div className="relative">
        <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
        <div className={`block w-12 h-6 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
      </div>
    </label>
  );
};

// Main Settings Page Component
const SettingsKasir = () => {
  // State for the toggle switches
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNetworkIndicator, setIsNetworkIndicator] = useState(true);
  const [isBackgroundTask, setIsBackgroundTask] = useState(false);

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* General Settings Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 flex justify-between items-center border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Dark Mode</h3>
            </div>
            <ToggleSwitch id="darkMode" checked={isDarkMode} onChange={() => setIsDarkMode(!isDarkMode)} />
          </div>
          <div className="p-6 flex justify-between items-center border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Network Indicator</h3>
              <p className="text-sm text-gray-500">Tampilkan indikator jaringan pada aplikasi</p>
            </div>
            <ToggleSwitch id="networkIndicator" checked={isNetworkIndicator} onChange={() => setIsNetworkIndicator(!isNetworkIndicator)} />
          </div>
          <div className="p-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Background Task Indicator</h3>
              <p className="text-sm text-gray-500">Menampilkan indicator data pada pojok kanan atas</p>
            </div>
            <ToggleSwitch id="backgroundTask" checked={isBackgroundTask} onChange={() => setIsBackgroundTask(!isBackgroundTask)} />
          </div>
        </div>

        {/* Hardware Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-2 px-2">Hardware</h2>
          <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Connect to Printer</h3>
              <p className="text-sm text-green-600">Terhubung dengan RPP02</p>
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                Scan
              </button>
              <button className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">
                Disconnect
              </button>
              <button className="px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">
                Test Print
              </button>
            </div>
          </div>
        </div>

        {/* Session Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-2 px-2">Session</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg shadow">
            <div className="p-6 flex justify-between items-center border-b border-red-200">
                <h3 className="text-lg font-semibold text-gray-800">Timezone</h3>
                <div className="flex items-center space-x-2 text-gray-600 cursor-pointer">
                    <span>Asia/Makassar</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
            <div className="p-6 flex justify-between items-center border-b border-red-200">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Export File</h3>
                    <p className="text-sm text-gray-500">Export file sebagai backup dari report</p>
                </div>
                <button className="px-5 py-2 text-sm font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                    Export
                </button>
            </div>
             <div className="p-6 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-red-700">Close Cashier Session</h3>
                <button className="px-5 py-2 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">
                    Close
                </button>
            </div>
          </div>
        </div>
        
        {/* Account Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-2 px-2">Account</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-red-700">Sign Out</h3>
            <button className="px-5 py-2 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">
                Sign Out
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsKasir;