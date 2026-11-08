import { GovernorateInfo } from "@/types";

export const EGYPTIAN_GOVERNORATES: GovernorateInfo[] = [
  // Greater Cairo
  { id: "cairo", nameAr: "القاهرة", nameEn: "Cairo", deliveryFee: 0, deliveryDays: "1-2 يوم", region: "greater_cairo" },
  { id: "giza", nameAr: "الجيزة", nameEn: "Giza", deliveryFee: 0, deliveryDays: "1-2 يوم", region: "greater_cairo" },
  { id: "qalyubia", nameAr: "القليوبية", nameEn: "Qalyubia", deliveryFee: 0, deliveryDays: "2-3 أيام", region: "greater_cairo" },

  // Alexandria & North Coast
  { id: "alexandria", nameAr: "الإسكندرية", nameEn: "Alexandria", deliveryFee: 0, deliveryDays: "2-3 أيام", region: "alexandria" },
  { id: "beheira", nameAr: "البحيرة", nameEn: "Beheira", deliveryFee: 0, deliveryDays: "2-3 أيام", region: "delta" },
  { id: "matrouh", nameAr: "مطروح", nameEn: "Matrouh", deliveryFee: 0, deliveryDays: "3-5 أيام", region: "frontier" },

  // Delta
  { id: "dakahlia", nameAr: "الدقهلية (المنصورة)", nameEn: "Dakahlia", deliveryFee: 0, deliveryDays: "2-3 أيام", region: "delta" },
  { id: "gharbia", nameAr: "الغربية (طنطا)", nameEn: "Gharbia", deliveryFee: 0, deliveryDays: "2-3 أيام", region: "delta" },
  { id: "monufia", nameAr: "المنوفية", nameEn: "Monufia", deliveryFee: 0, deliveryDays: "2-3 أيام", region: "delta" },
  { id: "sharqia", nameAr: "الشرقية (الزقازيق)", nameEn: "Sharqia", deliveryFee: 0, deliveryDays: "2-3 أيام", region: "delta" },
  { id: "kafr_el_sheikh", nameAr: "كفر الشيخ", nameEn: "Kafr El Sheikh", deliveryFee: 0, deliveryDays: "2-4 أيام", region: "delta" },
  { id: "damietta", nameAr: "دمياط", nameEn: "Damietta", deliveryFee: 0, deliveryDays: "2-4 أيام", region: "delta" },

  // Canal & Sinai
  { id: "port_said", nameAr: "بورسعيد", nameEn: "Port Said", deliveryFee: 0, deliveryDays: "2-3 أيام", region: "canal" },
  { id: "ismailia", nameAr: "الإسماعيلية", nameEn: "Ismailia", deliveryFee: 0, deliveryDays: "2-3 أيام", region: "canal" },
  { id: "suez", nameAr: "السويس", nameEn: "Suez", deliveryFee: 0, deliveryDays: "2-3 أيام", region: "canal" },
  { id: "north_sinai", nameAr: "شمال سيناء", nameEn: "North Sinai", deliveryFee: 0, deliveryDays: "4-6 أيام", region: "frontier" },
  { id: "south_sinai", nameAr: "جنوب سيناء", nameEn: "South Sinai", deliveryFee: 0, deliveryDays: "4-6 أيام", region: "frontier" },

  // Upper Egypt (Northern & Central)
  { id: "fayoum", nameAr: "الفيوم", nameEn: "Fayoum", deliveryFee: 0, deliveryDays: "2-3 أيام", region: "upper_egypt" },
  { id: "beni_suef", nameAr: "بني سويف", nameEn: "Beni Suef", deliveryFee: 0, deliveryDays: "2-4 أيام", region: "upper_egypt" },
  { id: "minya", nameAr: "المنيا", nameEn: "Minya", deliveryFee: 0, deliveryDays: "3-4 أيام", region: "upper_egypt" },
  { id: "assiut", nameAr: "أسيوط", nameEn: "Assiut", deliveryFee: 0, deliveryDays: "3-5 أيام", region: "upper_egypt" },
  { id: "sohag", nameAr: "سوهاج", nameEn: "Sohag", deliveryFee: 0, deliveryDays: "3-5 أيام", region: "upper_egypt" },

  // Upper Egypt (Southern)
  { id: "qena", nameAr: "قنا", nameEn: "Qena", deliveryFee: 0, deliveryDays: "3-5 أيام", region: "upper_egypt" },
  { id: "luxor", nameAr: "الأقصر", nameEn: "Luxor", deliveryFee: 0, deliveryDays: "3-5 أيام", region: "upper_egypt" },
  { id: "aswan", nameAr: "أسوان", nameEn: "Aswan", deliveryFee: 0, deliveryDays: "4-6 أيام", region: "upper_egypt" },
  { id: "red_sea", nameAr: "البحر الأحمر (الغردقة)", nameEn: "Red Sea", deliveryFee: 0, deliveryDays: "3-5 أيام", region: "frontier" },
  { id: "new_valley", nameAr: "الوادي الجديد", nameEn: "New Valley", deliveryFee: 0, deliveryDays: "4-7 أيام", region: "frontier" },
];

export function getGovernorateDeliveryFee(govNameOrId: string): number {
  return 0; // الشحن مجاني 100% لجميع محافظات مصر
}
