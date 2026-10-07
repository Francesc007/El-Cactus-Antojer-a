/** Marca en BD para borrar todo el demo de un golpe. No usar en clientes reales. */
export const DEMO_PRIVACY_TAG = "demo-loyalty-panel-2026";

export const DEMO_PHONE_PREFIX = "52999001";

/** Se escribe al sembrar; el script de limpieza lo usa para borrar fotos del bucket. */
export const DEMO_MANIFEST_PATH = "demo/loyalty-panel/manifest.json";

/** Valores de ejemplo que el seed escribe en loyalty_settings (vista Configuración del panel). */
export const DEMO_LOYALTY_SETTINGS = {
  visitsPerReward: 5,
  rewardDescription: "Bebida artesanal o postre de la casa",
  minHoursBetweenVisits: 6,
  birthdayMessage:
    "¡Hola {{1}}! 🎉\n\nEn El Cactus queremos celebrar tu cumpleaños contigo. Pásate esta semana y recibe un detalle especial de la casa.\n\nTe esperamos con gusto,\nEquipo El Cactus 🌵",
} as const;

/** Valores por defecto de la migración; el remove del demo los restaura. */
export const LOYALTY_SETTINGS_BASELINE = {
  visitsPerReward: 5,
  rewardDescription: "Postre de cortesía",
  minHoursBetweenVisits: 6,
  birthdayMessage:
    "¡Feliz cumpleaños! En El Cactus queremos celebrarlo contigo. Ven y disfruta con nosotros. ¡Te esperamos!",
} as const;

export type DemoMemberSpec = {
  id: string;
  memberCode: string;
  folio: string;
  photoId: string;
  fullName: string;
  phoneSuffix: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number | null;
  status: "active" | "inactive";
  marketingConsentAfterSeed: boolean;
};

export const DEMO_MEMBERS: DemoMemberSpec[] = [
  {
    id: "a1000001-0001-4001-8001-000000000001",
    memberCode: "10000000000000000000000000000001",
    folio: "C-9001",
    photoId: "b1000001-0001-4001-8001-000000000001",
    fullName: "Demo · María López",
    phoneSuffix: "0001",
    birthDay: 12,
    birthMonth: 3,
    birthYear: 1992,
    status: "active",
    marketingConsentAfterSeed: true,
  },
  {
    id: "a1000002-0001-4001-8001-000000000002",
    memberCode: "10000000000000000000000000000002",
    folio: "C-9002",
    photoId: "b1000002-0001-4001-8001-000000000002",
    fullName: "Demo · Luis Hernández",
    phoneSuffix: "0002",
    birthDay: 8,
    birthMonth: 7,
    birthYear: 1988,
    status: "active",
    marketingConsentAfterSeed: true,
  },
  {
    id: "a1000003-0001-4001-8001-000000000003",
    memberCode: "10000000000000000000000000000003",
    folio: "C-9003",
    photoId: "b1000003-0001-4001-8001-000000000003",
    fullName: "Demo · Ana Ruiz",
    phoneSuffix: "0003",
    birthDay: 1,
    birthMonth: 1,
    birthYear: null,
    status: "active",
    marketingConsentAfterSeed: true,
  },
  {
    id: "a1000004-0001-4001-8001-000000000004",
    memberCode: "10000000000000000000000000000004",
    folio: "C-9004",
    photoId: "b1000004-0001-4001-8001-000000000004",
    fullName: "Demo · Carlos Mendoza",
    phoneSuffix: "0004",
    birthDay: 20,
    birthMonth: 11,
    birthYear: 1985,
    status: "inactive",
    marketingConsentAfterSeed: true,
  },
  {
    id: "a1000005-0001-4001-8001-000000000005",
    memberCode: "10000000000000000000000000000005",
    folio: "C-9005",
    photoId: "b1000005-0001-4001-8001-000000000005",
    fullName: "Demo · Patricia Vega",
    phoneSuffix: "0005",
    birthDay: 15,
    birthMonth: 6,
    birthYear: 1990,
    status: "active",
    marketingConsentAfterSeed: true,
  },
  {
    id: "a1000006-0001-4001-8001-000000000006",
    memberCode: "10000000000000000000000000000006",
    folio: "C-9006",
    photoId: "b1000006-0001-4001-8001-000000000006",
    fullName: "Demo · Roberto Díaz",
    phoneSuffix: "0006",
    birthDay: 3,
    birthMonth: 9,
    birthYear: 1980,
    status: "active",
    marketingConsentAfterSeed: true,
  },
  {
    id: "a1000007-0001-4001-8001-000000000007",
    memberCode: "10000000000000000000000000000007",
    folio: "C-9007",
    photoId: "b1000007-0001-4001-8001-000000000007",
    fullName: "Demo · Sofía Castillo",
    phoneSuffix: "0007",
    birthDay: 0,
    birthMonth: 0,
    birthYear: 1995,
    status: "active",
    marketingConsentAfterSeed: true,
  },
  {
    id: "a1000008-0001-4001-8001-000000000008",
    memberCode: "10000000000000000000000000000008",
    folio: "C-9008",
    photoId: "b1000008-0001-4001-8001-000000000008",
    fullName: "Demo · Jorge Núñez",
    phoneSuffix: "0008",
    birthDay: 10,
    birthMonth: 4,
    birthYear: 1993,
    status: "active",
    marketingConsentAfterSeed: false,
  },
];
