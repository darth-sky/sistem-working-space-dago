import {
    UserOutlined,
    ShopOutlined,
} from "@ant-design/icons";

// Import tab pages
import UserTab from "./tabs/UserTab";
import TenantTab from "./tabs/TenantTab";
import ProductKategoriTab from "./tabs/ProductKategoriTab";
import ProductTab from "./tabs/ProductTab";
import RuanganKategoriTab from "./tabs/RuanganKategoriTab";
import RuanganTab from "./tabs/RuanganTab";
import PaketMembershipTab from "./tabs/PaketMembershipTab";
import VirtualOfficePackageTab from "./tabs/VirtualOfficePackageTab";
import PromoTab from "./tabs/PromoTab";
import EventSpacesTab from "./tabs/EventSpacesTab";

// Konfigurasi tab
export const tabsConfig = [
    {
        key: "user",
        path: "user",
        label: "User",
        icon: UserOutlined,
        component: <UserTab />,
    },
    {
        key: "tenant",
        path: "tenant",
        label: "Tenant",
        icon: ShopOutlined,
        component: <TenantTab />,
    },
    {
        key: "productkategori",
        path: "productkategori",
        label: "Produk Kategori",
        icon: ShopOutlined,
        component: <ProductKategoriTab />,
    },
    {
        key: "product",
        path: "product",
        label: "Produk",
        icon: ShopOutlined,
        component: <ProductTab />,
    },
    {
        key: "ruangankategori",
        path: "ruangankategori",
        label: "Kategori Ruangan",
        icon: ShopOutlined,
        component: <RuanganKategoriTab />,
    },
    {
        key: "ruangan",
        path: "ruangan",
        label: "Ruangan",
        icon: ShopOutlined,
        component: <RuanganTab />,
    },
    {
        key: "paketmembership",
        path: "paketmembership",
        label: "Paket Membership",
        icon: ShopOutlined,
        component: <PaketMembershipTab />,
    },
    {
        key: "paketvirtualoffice",
        path: "paketvirtualoffice",
        label: "Paket Virtual Office",
        icon: ShopOutlined,
        component: <VirtualOfficePackageTab />,
    },
    {
        key: "promo",
        path: "promo",
        label: "Promo",
        icon: ShopOutlined,
        component: <PromoTab />,
    },
    {
        key: "eventspaces",
        path: "eventspaces",
        label: "Event Spaces",
        icon: ShopOutlined,
        component: <EventSpacesTab />,
    },
];

// Helper untuk inisialisasi data awal
export const initialDataSources = tabsConfig.reduce((acc, tab) => {
    acc[tab.key] = tab.initialData || [];
    return acc;
}, {});