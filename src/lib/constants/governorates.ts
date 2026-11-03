import { GovernorateInfo } from "@/types";

export const EGYPTIAN_GOVERNORATES: GovernorateInfo[] = [
  // Greater Cairo
  { id: "cairo", nameAr: "القاهرة", nameEn: "Cairo", deliveryFee: 45, deliveryDays: "1-2 يوم", region: "greater_cairo" },
  { id: "giza", nameAr: "الجيزة", nameEn: "Giza", deliveryFee: 45, deliveryDays: "1-2 يوم", region: "greater_cairo" },
  { id: "qalyubia", nameAr: "القليوبية", nameEn: "Qalyubia", deliveryFee: 50, deliveryDays: "2-3 أيام", region: "greater_cairo" },

  // Alexandria & North Coast
  { id: "alexandria", nameAr: "الإسكندرية", nameEn: "Alexandria", deliveryFee: 50, deliveryDays: "2-3 أيام", region: "alexandria" },
  { id: "beheira", nameAr: "البحيرة", nameEn: "Beheira", deliveryFee: 55, deliveryDays: "2-3 أيام", region: "delta" },
  { id: "matrouh", nameAr: "مطروح", nameEn: "Matrouh", deliveryFee: 85, deliveryDays: "3-5 أيام", region: "frontier" },

  // Delta
  { id: "dakahlia", nameAr: "الدقهلية (المنصورة)", nameEn: "Dakahlia", deliveryFee: 55, deliveryDays: "2-3 أيام", region: "delta" },
  { id: "gharbia", nameAr: "الغربية (طنطا)", nameEn: "Gharbia", deliveryFee: 55, deliveryDays: "2-3 أيام", region: "delta" },
  { id: "monufia", nameAr: "المنوفية", nameEn: "Monufia", deliveryFee: 55, deliveryDays: "2-3 أيام", region: "delta" },
  { id: "sharqia", nameAr: "الشرقية (الزقازيق)", nameEn: "Sharqia", deliveryFee: 55, deliveryDays: "2-3 أيام", region: "delta" },
  { id: "kafr_el_sheikh", nameAr: "كفر الشيخ", nameEn: "Kafr El Sheikh", deliveryFee: 60, deliveryDays: "2-4 أيام", region: "delta" },
  { id: "damietta", nameAr: "دمياط", nameEn: "Damietta", deliveryFee: 60, deliveryDays: "2-4 أيام", region: "delta" },

  // Canal & Sinai
  { id: "port_said", nameAr: "بورسعيد", nameEn: "Port Said", deliveryFee: 60, deliveryDays: "2-3 أيام", region: "canal" },
  { id: "ismailia", nameAr: "الإسماعيلية", nameEn: "Ismailia", deliveryFee: 60, deliveryDays: "2-3 أيام", region: "canal" },
  { id: "suez", nameAr: "السويس", nameEn: "Suez", deliveryFee: 60, deliveryDays: "2-3 أيام", region: "canal" },
  { id: "north_sinai", nameAr: "شمال سيناء", nameEn: "North Sinai", deliveryFee: 90, deliveryDays: "4-6 أيام", region: "frontier" },
  { id: "south_sinai", nameAr: "جنوب سيناء", nameEn: "South Sinai", deliveryFee: 90, deliveryDays: "4-6 أيام", region: "frontier" },

  // Upper Egypt (Northern & Central)
  { id: "fayoum", nameAr: "الفيوم", nameEn: "Fayoum", deliveryFee: 60, deliveryDays: "2-3 أيام", region: "upper_egypt" },
  { id: "beni_suef", nameAr: "بني سويف", nameEn: "Beni Suef", deliveryFee: 65, deliveryDays: "2-4 أيام", region: "upper_egypt" },
  { id: "minya", nameAr: "المنيا", nameEn: "Minya", deliveryFee: 65, deliveryDays: "3-4 أيام", region: "upper_egypt" },
  { id: "assiut", nameAr: "أسيوط", nameEn: "Assiut", deliveryFee: 70, deliveryDays: "3-5 أيام", region: "upper_egypt" },
  { id: "sohag", nameAr: "سوهاج", nameEn: "Sohag", deliveryFee: 70, deliveryDays: "3-5 أيام", region: "upper_egypt" },

  // Upper Egypt (Southern)
  { id: "qena", nameAr: "قنا", nameEn: "Qena", deliveryFee: 75, deliveryDays: "3-5 أيام", region: "upper_egypt" },
  { id: "luxor", nameAr: "الأقصر", nameEn: "Luxor", deliveryFee: 75, deliveryDays: "3-5 أيام", region: "upper_egypt" },
  { id: "aswan", nameAr: "أسوان", nameEn: "Aswan", deliveryFee: 80, deliveryDays: "4-6 أيام", region: "upper_egypt" },
  { id: "red_sea", nameAr: "البحر الأحمر (الغردقة)", nameEn: "Red Sea", deliveryFee: 85, deliveryDays: "3-5 أيام", region: "frontier" },
  { id: "new_valley", nameAr: "الوادي الجديد", nameEn: "New Valley", deliveryFee: 95, deliveryDays: "4-7 أيام", region: "frontier" },
];

export function getGovernorateDeliveryFee(govNameOrId: string): number {
  const gov = EGYPTIAN_GOVERNORATES.find(
    (g) => g.id.toLowerCase() === govNameOrId.toLowerCase() || g.nameAr === govNameOrId
  );
  return gov ? gov.deliveryFee : 50; // default 50 EGP
}
