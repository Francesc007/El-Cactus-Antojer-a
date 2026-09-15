function read(name: string): string | undefined {
  return process.env[name];
}

function required(name: string): string {
  const value = read(name);
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

// Next.js solo expone NEXT_PUBLIC_* al navegador con acceso estático (process.env.NOMBRE).
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(NEXT_PUBLIC_SUPABASE_URL && NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getPublicEnv() {
  const supabaseUrl = NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (supabaseUrl.includes("example.supabase.co")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL apunta a example.supabase.co. Revisa .env.local y el entorno del shell."
    );
  }

  return {
    appUrl: NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    supabaseUrl,
    supabaseAnonKey: NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
}

export function getServerEnv() {
  const notificationProvider =
    read("NOTIFICATION_PROVIDER") === "whatsapp_cloud" ? "whatsapp_cloud" : "wa_me";

  return {
    ...getPublicEnv(),
    supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    whatsappBusinessNumber: read("WHATSAPP_BUSINESS_NUMBER") ?? "527731491349",
    notificationProvider,
    whatsappCloudToken: read("WHATSAPP_CLOUD_TOKEN") ?? "",
    whatsappCloudPhoneNumberId: read("WHATSAPP_CLOUD_PHONE_NUMBER_ID") ?? "",
    whatsappCloudTemplateCustomer: read("WHATSAPP_CLOUD_TEMPLATE_CUSTOMER") ?? "",
    whatsappCloudTemplateOwner: read("WHATSAPP_CLOUD_TEMPLATE_OWNER") ?? "",
    whatsappCloudOwnerPhone: read("WHATSAPP_CLOUD_OWNER_PHONE") ?? "",
    sentryDsn: read("SENTRY_DSN") ?? "",
    whatsappWebhookVerifyToken: read("WHATSAPP_WEBHOOK_VERIFY_TOKEN") ?? "",
    reservationRateLimitMax: Number(read("RESERVATION_RATE_LIMIT_MAX") ?? "8"),
    reservationRateLimitWindowMinutes: Number(
      read("RESERVATION_RATE_LIMIT_WINDOW_MINUTES") ?? "15"
    ),
  };
}
