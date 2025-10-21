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
import { AiOutlineProduct } from "react-icons/ai";
import { MdOutlineProductionQuantityLimits, MdChair, MdCardMembership, MdDiscount, MdEvent } from "react-icons/md";
import { GiPostOffice } from "react-icons/gi";




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
        label: "Kategori Produk",
        icon: AiOutlineProduct,
        component: <ProductKategoriTab />,
    },
    {
        key: "product",
        path: "product",
        label: "Produk",
        icon: MdOutlineProductionQuantityLimits,
        component: <ProductTab />,
    },
    {
        key: "ruangankategori",
        path: "ruangankategori",
        label: "Kategori Ruangan",
        icon: AiOutlineProduct,
        component: <RuanganKategoriTab />,
    },
    {
        key: "ruangan",
        path: "ruangan",
        label: "Ruangan",
        icon: MdChair,
        component: <RuanganTab />,
    },
    {
        key: "paketmembership",
        path: "paketmembership",
        label: "Paket Membership",
        icon: MdCardMembership,
        component: <PaketMembershipTab />,
    },
    {
        key: "paketvirtualoffice",
        path: "paketvirtualoffice",
        label: "Paket Virtual Office",
        icon: GiPostOffice,
        component: <VirtualOfficePackageTab />,
    },
    {
        key: "promo",
        path: "promo",
        label: "Promo",
        icon: MdDiscount,
        component: <PromoTab />,
    },
    {
        key: "eventspaces",
        path: "eventspaces",
        label: "Event Spaces",
        icon: MdEvent,
        component: <EventSpacesTab />,
    },
];

// Helper untuk inisialisasi data awal
export const initialDataSources = tabsConfig.reduce((acc, tab) => {
    acc[tab.key] = tab.initialData || [];
    return acc;
}, {});