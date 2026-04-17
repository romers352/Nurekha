/**
 * Central config for all 13 business types.
 * Maps business_type string → sidebar items, icons, labels.
 */
import {
  ShoppingBag, Hotel, Plane, Building, Wifi, Smartphone,
  UtensilsCrossed, Scissors, Car, Landmark, PartyPopper,
  GraduationCap, Stethoscope, Database, ClipboardList, Users, RotateCcw,
} from "lucide-react";

const BIZ_CONFIG = {
  ecommerce: {
    label: "E-commerce",
    dataLabel: "Products",
    dataIcon: ShoppingBag,
    outputLabel: "Orders",
    outputIcon: ClipboardList,
    actionType: "order",
    hasRefunds: true,
    extraNav: [
      { icon: ClipboardList, label: "Orders", href: (id) => `/agent/${id}/orders` },
      { icon: RotateCcw, label: "Refunds", href: (id) => `/agent/${id}/refunds` },
    ],
  },
  hotel: {
    label: "Hotel",
    dataLabel: "Rooms",
    dataIcon: Hotel,
    outputLabel: "Bookings",
    outputIcon: ClipboardList,
    actionType: "booking",
    extraNav: [
      { icon: ClipboardList, label: "Bookings", href: (id) => `/agent/${id}/bookings` },
    ],
  },
  travel: {
    label: "Travel",
    dataLabel: "Packages",
    dataIcon: Plane,
    outputLabel: "Bookings",
    outputIcon: ClipboardList,
    actionType: "booking",
    extraNav: [
      { icon: ClipboardList, label: "Bookings", href: (id) => `/agent/${id}/bookings` },
    ],
  },
  real_estate: {
    label: "Real Estate",
    dataLabel: "Properties",
    dataIcon: Building,
    outputLabel: "Leads",
    outputIcon: Users,
    actionType: "lead",
    extraNav: [
      { icon: Users, label: "Leads", href: (id) => `/agent/${id}/leads` },
    ],
  },
  isp: {
    label: "ISP",
    dataLabel: "Plans",
    dataIcon: Wifi,
    outputLabel: "Tickets",
    outputIcon: ClipboardList,
    actionType: "ticket",
    extraNav: [
      { icon: ClipboardList, label: "Tickets", href: (id) => `/agent/${id}/customer-tickets` },
    ],
  },
  telecom: {
    label: "Telecom",
    dataLabel: "Plans",
    dataIcon: Smartphone,
    outputLabel: "Tickets",
    outputIcon: ClipboardList,
    actionType: "ticket",
    extraNav: [
      { icon: ClipboardList, label: "Tickets", href: (id) => `/agent/${id}/customer-tickets` },
    ],
  },
  restaurant: {
    label: "Restaurant",
    dataLabel: "Menu Items",
    dataIcon: UtensilsCrossed,
    outputLabel: "Orders",
    outputIcon: ClipboardList,
    actionType: "order",
    extraNav: [
      { icon: ClipboardList, label: "Orders", href: (id) => `/agent/${id}/orders` },
    ],
  },
  service: {
    label: "Salon / Spa / Service",
    dataLabel: "Services",
    dataIcon: Scissors,
    outputLabel: "Bookings",
    outputIcon: ClipboardList,
    actionType: "booking",
    extraNav: [
      { icon: ClipboardList, label: "Bookings", href: (id) => `/agent/${id}/bookings` },
    ],
  },
  vehicle: {
    label: "Vehicle",
    dataLabel: "Vehicles",
    dataIcon: Car,
    outputLabel: "Leads",
    outputIcon: Users,
    actionType: "lead",
    extraNav: [
      { icon: Users, label: "Leads", href: (id) => `/agent/${id}/leads` },
    ],
  },
  finance: {
    label: "Finance",
    dataLabel: "Financial Products",
    dataIcon: Landmark,
    outputLabel: "Leads",
    outputIcon: Users,
    actionType: "lead",
    extraNav: [
      { icon: Users, label: "Leads", href: (id) => `/agent/${id}/leads` },
    ],
  },
  events: {
    label: "Events",
    dataLabel: "Event Packages",
    dataIcon: PartyPopper,
    outputLabel: "Bookings",
    outputIcon: ClipboardList,
    actionType: "booking",
    extraNav: [
      { icon: ClipboardList, label: "Bookings", href: (id) => `/agent/${id}/bookings` },
    ],
  },
  education: {
    label: "Education",
    dataLabel: "Courses",
    dataIcon: GraduationCap,
    outputLabel: "Leads",
    outputIcon: Users,
    actionType: "lead",
    extraNav: [
      { icon: Users, label: "Leads", href: (id) => `/agent/${id}/leads` },
    ],
  },
  healthcare: {
    label: "Healthcare",
    dataLabel: "Doctors / Services",
    dataIcon: Stethoscope,
    outputLabel: "Bookings",
    outputIcon: ClipboardList,
    actionType: "booking",
    extraNav: [
      { icon: ClipboardList, label: "Bookings", href: (id) => `/agent/${id}/bookings` },
    ],
  },
};

export const ALL_BUSINESS_TYPES = Object.keys(BIZ_CONFIG);

export const getBizConfig = (type) => BIZ_CONFIG[type] || null;

export const getBizLabel = (type) => BIZ_CONFIG[type]?.label || type;

export default BIZ_CONFIG;
