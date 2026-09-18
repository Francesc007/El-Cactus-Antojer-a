import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { StockReportData } from "@/lib/inventory-stock-report";
import type { StockStatus } from "@/lib/inventory";

const BRAND = {
  forest: "#4BA747",
  forestDark: "#1A3D18",
  sunset: "#F7941D",
  cream: "#FDF8F0",
  sand: "#E8DFD0",
  red: "#B91C1C",
  redBg: "#FEF2F2",
  amber: "#B45309",
  amberBg: "#FFFBEB",
  green: "#15803D",
  greenBg: "#F0FDF4",
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1A2318",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: BRAND.forest,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: BRAND.forestDark,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 10,
    color: BRAND.forest,
  },
  dateBox: {
    alignItems: "flex-end",
  },
  dateLabel: {
    fontSize: 8,
    color: "#78716C",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dateValue: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BRAND.forestDark,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BRAND.sand,
    backgroundColor: BRAND.cream,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: BRAND.forestDark,
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: 8,
    color: "#78716C",
    textTransform: "uppercase",
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  sectionSubtitle: {
    fontSize: 8,
    marginTop: 2,
  },
  sectionCount: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F4",
  },
  rowName: {
    flex: 2,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  rowStock: {
    flex: 1,
    textAlign: "right",
    fontSize: 10,
  },
  rowMin: {
    flex: 1,
    textAlign: "right",
    fontSize: 10,
    color: "#78716C",
  },
  empty: {
    padding: 10,
    fontSize: 9,
    color: "#78716C",
    fontStyle: "italic",
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 36,
    right: 36,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BRAND.sand,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#78716C",
  },
});

const SECTION_STYLE: Record<
  StockStatus,
  { headerBg: string; title: string; subtitle: string; accent: string }
> = {
  low: {
    headerBg: BRAND.redBg,
    title: BRAND.red,
    subtitle: "#991B1B",
    accent: BRAND.red,
  },
  warning: {
    headerBg: BRAND.amberBg,
    title: BRAND.amber,
    subtitle: "#92400E",
    accent: BRAND.amber,
  },
  ok: {
    headerBg: BRAND.greenBg,
    title: BRAND.green,
    subtitle: "#166534",
    accent: BRAND.green,
  },
};

type StockReportPdfDocumentProps = {
  data: StockReportData;
  logoUrl: string;
};

export function StockReportPdfDocument({ data, logoUrl }: StockReportPdfDocumentProps) {
  return (
    <Document title="Stock actual — El Cactus Antojería">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image src={logoUrl} style={styles.logo} />
            <View>
              <Text style={styles.title}>{data.businessName}</Text>
              <Text style={styles.subtitle}>Reporte de stock actual</Text>
            </View>
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>Generado</Text>
            <Text style={styles.dateValue}>{data.generatedAtLabel}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{data.totals.products}</Text>
            <Text style={styles.summaryLabel}>Productos</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: BRAND.red }]}>
              {data.totals.low}
            </Text>
            <Text style={styles.summaryLabel}>Stock bajo</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: BRAND.amber }]}>
              {data.totals.warning}
            </Text>
            <Text style={styles.summaryLabel}>En atención</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: BRAND.green }]}>
              {data.totals.ok}
            </Text>
            <Text style={styles.summaryLabel}>OK</Text>
          </View>
        </View>

        {data.sections.map((section) => {
          const palette = SECTION_STYLE[section.status];
          return (
            <View key={section.status} style={styles.section}>
              <View
                style={[
                  styles.sectionHeader,
                  { backgroundColor: palette.headerBg },
                ]}
              >
                <View>
                  <Text style={[styles.sectionTitle, { color: palette.title }]}>
                    {section.title}
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: palette.subtitle }]}>
                    {section.subtitle}
                  </Text>
                </View>
                <Text style={[styles.sectionCount, { color: palette.accent }]}>
                  {section.items.length}
                </Text>
              </View>

              {section.items.length === 0 ? (
                <Text style={styles.empty}>Sin productos en esta categoría.</Text>
              ) : (
                section.items.map((item) => (
                  <View key={`${section.status}-${item.name}`} style={styles.row}>
                    <Text style={styles.rowName}>{item.name}</Text>
                    <Text style={styles.rowStock}>
                      {item.stock} {item.unit}
                    </Text>
                    <Text style={styles.rowMin}>
                      mín. {item.minStock} {item.unit}
                    </Text>
                  </View>
                ))
              )}
            </View>
          );
        })}

        <View style={styles.footer} fixed>
          <Text>El Cactus Antojería — Inventario</Text>
          <Text>Uso interno para compras y reposición</Text>
        </View>
      </Page>
    </Document>
  );
}
