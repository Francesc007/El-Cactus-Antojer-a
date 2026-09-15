export const OPERATING_HOURS = [
  {
    days: [5, 6] as const,
    label: "Vie – Sáb",
    open: "16:00",
    close: "22:00",
    display: "4:00 PM – 10:00 PM",
  },
  {
    days: [0] as const,
    label: "Domingo",
    open: "14:00",
    close: "21:00",
    display: "2:00 PM – 9:00 PM",
  },
] as const;

export const CLOSED_DAYS_LABEL = "Lun – Jue";

export const BUSINESS_INFO = {
  name: "El Cactus Antojería",
  hours: OPERATING_HOURS,
  closedDaysLabel: CLOSED_DAYS_LABEL,
  address: {
    line1: "Calle Coronel Alberto Hernández",
    line2: "Col. San Juan Otlaxpa",
    city: "Tepeji del Río de Ocampo, Hidalgo",
    zip: "42854",
    full: "Calle Coronel Alberto Hernández, Col. San Juan Otlaxpa, Tepeji del Río de Ocampo, Hidalgo, C.P. 42854",
  },
  mapsUrl:
    "https://www.google.com.mx/maps/place/El+cactus+antojeria/@19.8971693,-99.3489132,17z/data=!3m1!4b1!4m6!3m5!1s0x85d22fb80fe79425:0x1aac8cabef808e67!8m2!3d19.8971693!4d-99.3463383!16s%2Fg%2F11ty6yr9mc?entry=ttu",
  social: {
    facebook: "https://www.facebook.com/profile.php?id=100091252825387",
    instagram: "https://www.instagram.com/el_cactus_antojeria/",
    tiktok: "https://www.tiktok.com/@elcactusantojeria",
  },
} as const;
