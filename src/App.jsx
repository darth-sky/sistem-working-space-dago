import React from "react";
import { Router, Routes, Route } from "react-router-dom";
import DashboardWS from "./pages/DashboardWS/DashboardWS/DashboardWS";
import RoomDetail from "./pages/Pelanggan/RoomDetail/RoomDetail";
import BookingRuangan from "./pages/Pelanggan/BookingRuangan/BookingRuangan";
import BookingPayment from "./pages/Pelanggan/BookingPayment/BookingPayment";
import BookingSukses from "./pages/Pelanggan/BookingSukses/BookingSukses";
import DaftarMember from "./pages/Pelanggan/DaftarMember/DaftarMember";
import DashboardAdmin from "./pages/Admin/DashboardAdmin/DashboardAdmin";
import DaftarAkun from "./pages/Pelanggan/DaftarAkun/DaftarAkun";
import Login from "./pages/Login/Login";
import AuthProvider from "./providers/AuthProvider";
import PrivateRoute from "./components/layout/PrivateRoute";
import MengelolaOrderF_B from "./pages/Kasir/MengelolaOrderF&B/MengelolaOrderF&B";
import MainKasir from "./components/layout/MainKasir";
import MengelolaBookingRuangan from "./pages/Kasir/MengelolaBookingRuangan/MengelolaBookingRuangan";
import DaftarVO from "./pages/Pelanggan/DaftarVO/DaftarVO";
import RiwayatTransaksi from "./pages/Pelanggan/RiwayatTransaksi/RiwayatTransaksi";
import CekKreditMembership from "./pages/Pelanggan/CekKreditMembership/CekKreditMembership";
import CekMasaVO from "./pages/Pelanggan/CekMasaVO/CekMasaVO";
import DashboardPengguna from "./pages/Pelanggan/DashboardPengguna/DashboardPengguna";
import InformasiRuangan from "./pages/Pelanggan/InformasiRuangan/InformasiRuangan";
import VirtualOffice from "./pages/Pelanggan/VirtualOffice/VirtualOffice";
import DetailPaket from "./pages/Pelanggan/DetailPaket/DetailPaket";
import InformasiWS from "./pages/DashboardWS/InformasiWS/InformasiWS";
import InformasiVO from "./pages/DashboardWS/InformasiVO/InformasiVO";
import Membership from "./pages/Pelanggan/Membership/Membership";
import SpaceRental from "./pages/Admin/SpaceRental/SpaceRental";
import { TranslationOutlined } from "@ant-design/icons";
import MasterData from "./pages/Admin/MasterData/MasterData";
import SidebarAdmin from "./pages/Admin/DashboardAdmin/SidebarAdmin";
import DashboardAdmins from "./pages/Admin/DashboardAdmin/DashboardAdmins";
import TransaksiAdmin from "./pages/Admin/TransaksiAdmin/TransaksiAdmin";
import SidebarTenant from "./pages/Tenant/SidebarTenant/SidebarTenant";
import DashboardTenant from "./pages/Tenant/DashboardTenant/DashboardTenant";
import SettingTenant from "./pages/Tenant/SettingTenant/SettingTenant";
import KelolaStok from "./pages/Tenant/KelolaStok/KelolaStok";
import SidebarKasir from "./pages/Kasir/SidebarKasir/SidebarKasir";
import TransaksiKasir from "./pages/Kasir/TransaksiKasir/TransaksiKasir";
import MerchantKasir from "./pages/Kasir/MerchantKasir/MerchantKasir";
import ProductKasir from "./pages/Kasir/ProductKasir/ProductKasir";
import HistoryKasir from "./pages/Kasir/HistoryKasir/HistoryKasir";
import SpaceKasir from "./pages/Kasir/SpaceKasir/SpaceKasir";
import SettingsKasir from "./pages/Kasir/SettingsKasir/SettingsKasir";
import Laporan from "./pages/Owner/Laporan/Laporan";
import SidebarOwner from "./pages/Owner/SidebarOwner/SidebarOwner";
import BagiHasil from "./pages/Owner/BagiHasil/BagiHasil";
import ReportKasir from "./pages/Kasir/ReportKasir/ReportKasir";
import EventSpaces from "./pages/DashboardWS/EventSpaces/EventSpaces";
import EventSpacesAdmin from "./pages/Admin/EventSpaces/EventSpaces";
import FNBDashboard from "./pages/Owner/FnbDashboard/FnbDashboard";
import WorkingSpace from "./pages/Owner/WorkingSpace/WorkingSpace";
import EventSpacesPelanggan from "./pages/Pelanggan/EventSpacesPelanggan/EventSpacesPelanggan";
import DetailEventSpaces from "./pages/Pelanggan/DetailEventSpaces/DetailEventSpaces";
import PromoPelanggan from "./pages/Pelanggan/PromoPelanggan/PromoPelanggan";
import { useNavigate } from "react-router-dom";
import Forbidden from "./pages/Forbidden/Forbidden";
import OrderKasir from "./pages/Kasir/OrderKasir/OrderKasir";
import BuatOrderKasir from "./pages/Kasir/BuatOrderKasir/BuatOrderKasir";
import CostBulanan from "./pages/Admin/CostBulanan/CostBulanan";
import VirtualOfficeApproval from "./pages/Admin/VirtualOfficeApproval/VirtualOfficeApproval";
import HutangAdmin from "./pages/Admin/HutangAdmin/HutangAdmin";
import LaporanPembayaran from "./pages/Kasir/LaporanPembayaran/LaporanPembayaran";
import PrivateOffice from "./pages/Pelanggan/PrivateOffice/PrivateOffice";

const App = () => {
  const Navigate = useNavigate();
  return (
    <AuthProvider>
      <Routes>
        <Route path="/forbidden" element={<Forbidden />} />



        <Route path="/" element={<DashboardWS />} />

        {/* <Route path='/dashboardws' element={<DashboardWS/>}/> */}

        <Route path="/roomdetail/:id" element={<RoomDetail />} />



        <Route
          path="/dashboard-pengguna"
          element={
            <PrivateRoute>
              <DashboardPengguna />
            </PrivateRoute>
          }
        />

        <Route path="/daftar-vo/:id" element={<DaftarVO />} />

        <Route
          path="/booking/:id"
          element={
            <PrivateRoute>
              {" "}
              <BookingRuangan />{" "}
            </PrivateRoute>
          }
        />

        <Route
          path="/payment/:id"
          element={
            <PrivateRoute>
              {" "}
              <BookingPayment />{" "}
            </PrivateRoute>
          }
        />

        <Route
          path="/booking-sukses"
          element={
            <PrivateRoute>
              {" "}
              <BookingSukses />
            </PrivateRoute>
          }
        />


        <Route
          path="/detail-paket"
          element={
            <PrivateRoute>
              <DetailPaket />
            </PrivateRoute>
          }
        />

        <Route
          path="/detail-paket/:id"
          element={
            <PrivateRoute>
              <DetailPaket />
            </PrivateRoute>
          }
        />

        <Route
          path="/event-spaces-pelanggan"
          element={
            <PrivateRoute>
              <EventSpacesPelanggan />
            </PrivateRoute>
          }
        />

        <Route
          path="/detail-event-spaces"
          element={
            <PrivateRoute>
              <DetailEventSpaces />
            </PrivateRoute>
          }
        />

        <Route
          path="/detail-event-spaces/:id" // <-- UBAH DI SINI
          element={
            <PrivateRoute>
              <DetailEventSpaces />
            </PrivateRoute>
          }
        />




        <Route path="/daftar-member/:id" element={<DaftarMember />} />


        <Route path="/daftar-vo" element={<DaftarVO />} />

        <Route path="/login" element={<Login />} />

        <Route path="/daftar-akun" element={<DaftarAkun />} />

        <Route path="/informasiws" element={<InformasiWS />} />

        <Route path="/informasivo" element={<InformasiVO />} />

        <Route path="/eventspaces" element={<EventSpaces />} />

        {/* ADMIN */}
        {/* <Route
          path="/dashboardadmin"
          element={
            <PrivateRoute>
              <SidebarAdmin>
                <DashboardAdmins />
              </SidebarAdmin>
            </PrivateRoute>
          }
        /> */}

        <Route
          path="/virtualofficeadmin"
          element={
            <PrivateRoute>
              <SidebarAdmin>
                <VirtualOfficeApproval />
              </SidebarAdmin>
            </PrivateRoute>
          }
        />


        <Route
          path="/eventspacesadmin"
          element={
            <PrivateRoute>
              <SidebarAdmin>
                <EventSpacesAdmin />
              </SidebarAdmin>
            </PrivateRoute>
          }
        />

        <Route
          path="/transaksiadmin"
          element={
            <PrivateRoute>
              <SidebarAdmin>
                <TransaksiAdmin />
              </SidebarAdmin>
            </PrivateRoute>
          }
        />

        <Route
          path="masterdataadmin"
          element={
            <PrivateRoute>
              <SidebarAdmin>
                <MasterData />
              </SidebarAdmin>
            </PrivateRoute>
          }
        />

        <Route
          path="costbulananadmin"
          element={
            <PrivateRoute>
              <SidebarAdmin>
                <CostBulanan />
              </SidebarAdmin>
            </PrivateRoute>
          }
        />
        <Route
          path="hutangadmin"
          element={
            <PrivateRoute>
              <SidebarAdmin>
                <HutangAdmin />
              </SidebarAdmin>
            </PrivateRoute>
          }
        />

        {/* 1. Route dengan :tabKey (lebih spesifik) */}
        <Route
          path="/masterdataadmin/:tabKey"
          element={
            <PrivateRoute>
              <SidebarAdmin>
                <MasterData />
              </SidebarAdmin>
            </PrivateRoute>
          }
        />

        {/* 2. Default redirect kalau user buka /masterdataadmin langsung */}
        <Route
          path="/masterdataadmin"
          element={<Navigate to="/masterdataadmin/user" replace />}
        />

        {/* Admin Tenant */}
        <Route
          path="/ordertenant"
          element={
            <PrivateRoute>
              <SidebarTenant>
                <DashboardTenant />
              </SidebarTenant>
            </PrivateRoute>
          }
        />
        <Route
          path="/stoktenant"
          element={
            <PrivateRoute>
              <SidebarTenant>
                <KelolaStok />
              </SidebarTenant>
            </PrivateRoute>
          }
        />
        <Route
          path="/settingstenant"
          element={
            <PrivateRoute>
              <SidebarTenant>
                <SettingTenant />
              </SidebarTenant>
            </PrivateRoute>
          }
        />

        {/* Kasir */}

        <Route
          element={
            <PrivateRoute allowedRoles={['kasir']}>
              <SidebarKasir />
            </PrivateRoute>
          }
        >
          {/* Semua rute "anak" di bawah ini sekarang otomatis aman.
      Mereka hanya bisa diakses jika:
      1. User sudah login.
      2. User memiliki role 'kasir'.
    */}
          <Route path="/transaksikasir" element={<TransaksiKasir />} />
          <Route path="/merchantkasir" element={<MerchantKasir />} />
          <Route path="/productkasir" element={<ProductKasir />} />
          <Route path="/historykasir" element={<HistoryKasir />} />
          <Route path="/spacekasir" element={<SpaceKasir />} />
          <Route path="/laporanpembayarankasir" element={<LaporanPembayaran />} />
          <Route path="/settingskasir" element={<SettingsKasir />} />
          <Route path="/buatorderkasir" element={<BuatOrderKasir />} />
          <Route path="/orderkasir" element={<OrderKasir />} />
        </Route>

        <Route
          path="/orderkasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <OrderKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />
        <Route
          path="/buatorderkasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <BuatOrderKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />
        <Route
          path="/transaksikasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <TransaksiKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />
        <Route
          path="/merchantkasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <MerchantKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />
        <Route
          path="/productkasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <ProductKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />
        <Route
          path="/historykasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <HistoryKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />
        <Route
          path="/spacekasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <SpaceKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />

        <Route
          path="/reportkasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <ReportKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />
        <Route
          path="/settingskasir"
          element={
            <PrivateRoute>
              <SidebarKasir>
                <SettingsKasir />
              </SidebarKasir>
            </PrivateRoute>
          }
        />

        {/* Kasir End */}

        {/* Pelanggan */}
        <Route
          path="/informasi-ruangan"
          element={
            <PrivateRoute allowedRoles={["pelanggan"]}>
              <DashboardPengguna>
                <InformasiRuangan />
              </DashboardPengguna>
            </PrivateRoute>
          }
        />
        <Route
          path="/membership"
          element={
            <PrivateRoute>
              <DashboardPengguna>
                <Membership />
              </DashboardPengguna>
            </PrivateRoute>
          }
        />
        <Route
          path="/virtual-office"
          element={
            <DashboardPengguna>
              <VirtualOffice />
            </DashboardPengguna>
          }
        />
        <Route
          path="/cek-kredit-membership"
          element={
            <DashboardPengguna>
              <CekKreditMembership />
            </DashboardPengguna>
          }
        />
        <Route
          path="/cek-masa-vo"
          element={
            <DashboardPengguna>
              <CekMasaVO />
            </DashboardPengguna>
          }
        />
        <Route
          path="/private-office"
          element={
            <DashboardPengguna>
              <PrivateOffice />
            </DashboardPengguna>
          }
        />
        <Route
          path="/riwayat-transaksi"
          element={
            <DashboardPengguna>
              <RiwayatTransaksi />
            </DashboardPengguna>
          }
        />
        <Route
          path="/event-spaces"
          element={
            <DashboardPengguna>
              <EventSpacesPelanggan />
            </DashboardPengguna>
          }
        />
        <Route
          path="/promo-pelanggan"
          element={
            <DashboardPengguna>
              <PromoPelanggan />
            </DashboardPengguna>
          }
        />




        {/* Pelanggan End */}

        {/* Owner */}
        <Route
          path="/laporan"
          element={
            <PrivateRoute>
              <SidebarOwner>
                <Laporan />
              </SidebarOwner>
            </PrivateRoute>
          }
        />

        <Route
          path="/fnbdashboard"
          element={
            <PrivateRoute>
              <SidebarOwner>
                <FNBDashboard />
              </SidebarOwner>
            </PrivateRoute>
          }
        />
        <Route
          path="/workingspace"
          element={
            <PrivateRoute>
              <SidebarOwner>
                <WorkingSpace />
              </SidebarOwner>
            </PrivateRoute>
          }
        />

        <Route
          path="/bagihasil"
          element={
            <PrivateRoute>
              <SidebarOwner>
                <BagiHasil />
              </SidebarOwner>
            </PrivateRoute>
          }
        />

      </Routes>
    </AuthProvider>
  );
};

export default App;
