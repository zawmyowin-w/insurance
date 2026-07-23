package com.insurance.portal.controller;

import com.insurance.portal.model.*;
import com.insurance.portal.model.enums.*;
import com.insurance.portal.repository.*;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class MonthlyReportController {

    private final PaymentRepository paymentRepo;
    private final ClaimRepository claimRepo;
    private final PolicyApplicationRepository appRepo;
    private final UserRepository userRepo;
    private final InsurancePackageRepository packageRepo;
    private final MonthlyReportSnapshotRepository snapshotRepo;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    // ─── Colours shared across builders ──────────────────────────────────────
    private static final DeviceRgb NAVY  = new DeviceRgb(15, 23, 42);
    private static final DeviceRgb BLUE  = new DeviceRgb(29, 78, 175);
    private static final DeviceRgb GREEN = new DeviceRgb(22, 163, 74);
    private static final DeviceRgb RED   = new DeviceRgb(220, 38, 38);
    private static final DeviceRgb AMBER = new DeviceRgb(217, 119, 6);
    private static final DeviceRgb GRAY  = new DeviceRgb(71, 85, 105);
    private static final DeviceRgb LIGHT = new DeviceRgb(241, 245, 249);

    // ─────────────────────────────────────────────────────────────────────────
    // GET /admin/reports/monthly-pdf?year=2026&month=7
    // Streams a generated PDF for any given month (defaults to current month).
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/monthly-pdf")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> downloadMonthlyPdf(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) throws Exception {

        LocalDateTime now = LocalDateTime.now();
        int y = (year != null && year > 0) ? year : now.getYear();
        int m = (month != null && month >= 1 && month <= 12) ? month : now.getMonthValue();

        byte[] pdf = buildMonthlyReportPdf(y, m);
        String filename = String.format("monthly-report-%d-%02d.pdf", y, m);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /admin/reports/monthly-reset
    // Generates the current month's PDF, saves it to disk, records a snapshot,
    // and returns the PDF bytes so the browser can download it immediately.
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/monthly-reset")
    @Transactional
    public ResponseEntity<byte[]> monthlyReset() throws Exception {

        LocalDateTime now = LocalDateTime.now();
        int y = now.getYear();
        int m = now.getMonthValue();

        byte[] pdf = buildMonthlyReportPdf(y, m);

        // ── Compute summary stats for the snapshot record ─────────────────
        LocalDateTime periodStart = LocalDateTime.of(y, m, 1, 0, 0, 0);

        List<Payment>          allPayments = paymentRepo.findAll();
        List<Claim>            allClaims   = claimRepo.findAll();
        List<PolicyApplication> allApps    = appRepo.findAll();

        BigDecimal revenue = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.VERIFIED
                        && p.getAmount() != null
                        && !"CLAIM_PAYOUT".equals(p.getPaymentType())
                        && inMonth(p.getCreatedAt(), y, m))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal claimsPaid = allClaims.stream()
                .filter(c -> c.getStatus() == ClaimStatus.APPROVED
                        && c.getAmount() != null
                        && inMonth(c.getCreatedAt(), y, m))
                .map(Claim::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalApps    = (int) allApps.stream().filter(a -> inMonth(a.getCreatedAt(), y, m)).count();
        int newPolicies  = (int) allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.APPROVED && inMonth(a.getCreatedAt(), y, m)).count();
        int totalClaimsM = (int) allClaims.stream().filter(c -> inMonth(c.getCreatedAt(), y, m)).count();
        int totalCust    = userRepo.findAllByRole(Role.CUSTOMER).size();

        // ── Save PDF to disk ──────────────────────────────────────────────
        String pdfFilename = String.format("monthly-report-%d-%02d-%d.pdf", y, m, System.currentTimeMillis());
        Path dir = Paths.get(uploadDir, "monthly-reports");
        Files.createDirectories(dir);
        Path filePath = dir.resolve(pdfFilename);
        Files.write(filePath, pdf);

        // ── Persist snapshot record ───────────────────────────────────────
        MonthlyReportSnapshot snapshot = MonthlyReportSnapshot.builder()
                .year(y).month(m)
                .periodStart(periodStart)
                .periodEnd(now)
                .totalRevenue(revenue)
                .totalClaimsPaid(claimsPaid)
                .netProfit(revenue.subtract(claimsPaid))
                .totalApplications(totalApps)
                .newPolicies(newPolicies)
                .totalClaims(totalClaimsM)
                .totalCustomers(totalCust)
                .pdfPath(filePath.toAbsolutePath().toString())
                .build();
        snapshotRepo.save(snapshot);

        String attachment = String.format("monthly-report-%d-%02d.pdf", y, m);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /admin/reports/monthly-snapshots
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/monthly-snapshots")
    public List<Map<String, Object>> listSnapshots() {
        return snapshotRepo.findAllByOrderByCreatedAtDesc().stream().map(s -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id",                s.getId());
            map.put("year",              s.getYear());
            map.put("month",             s.getMonth());
            map.put("monthName",         Month.of(s.getMonth()).getDisplayName(TextStyle.FULL, Locale.ENGLISH));
            map.put("periodStart",       s.getPeriodStart());
            map.put("periodEnd",         s.getPeriodEnd());
            map.put("totalRevenue",      s.getTotalRevenue());
            map.put("totalClaimsPaid",   s.getTotalClaimsPaid());
            map.put("netProfit",         s.getNetProfit());
            map.put("totalApplications", s.getTotalApplications());
            map.put("newPolicies",       s.getNewPolicies());
            map.put("totalClaims",       s.getTotalClaims());
            map.put("totalCustomers",    s.getTotalCustomers());
            map.put("createdAt",         s.getCreatedAt());
            return map;
        }).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /admin/reports/monthly-snapshots/{id}/pdf
    // Re-download a previously archived monthly PDF.
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/monthly-snapshots/{id}/pdf")
    public ResponseEntity<byte[]> downloadSnapshotPdf(@PathVariable Long id) throws Exception {
        MonthlyReportSnapshot snapshot = snapshotRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Snapshot not found: " + id));

        if (snapshot.getPdfPath() == null) {
            return ResponseEntity.notFound().build();
        }
        Path file = Paths.get(snapshot.getPdfPath());
        if (!Files.exists(file)) {
            // File was deleted — regenerate on the fly
            byte[] pdf = buildMonthlyReportPdf(snapshot.getYear(), snapshot.getMonth());
            String filename = String.format("monthly-report-%d-%02d.pdf", snapshot.getYear(), snapshot.getMonth());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        }
        byte[] pdf = Files.readAllBytes(file);
        String filename = String.format("monthly-report-%d-%02d.pdf", snapshot.getYear(), snapshot.getMonth());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PDF Builder
    // ─────────────────────────────────────────────────────────────────────────
    private byte[] buildMonthlyReportPdf(int year, int month) throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime periodStart = LocalDateTime.of(year, month, 1, 0, 0, 0);
        LocalDateTime periodEnd   = periodStart.plusMonths(1).minusNanos(1);
        String monthName          = Month.of(month).getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        String periodLabel        = monthName + " " + year;
        String generatedAt        = now.format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm"));

        // ── Data queries ──────────────────────────────────────────────────
        List<Payment>           allPayments = paymentRepo.findAll();
        List<Claim>             allClaims   = claimRepo.findAll();
        List<PolicyApplication> allApps     = appRepo.findAll();
        List<User>              agents      = userRepo.findAllByRole(Role.AGENT);
        List<InsurancePackage>  packages    = packageRepo.findAll();

        List<Payment> monthPayments = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.VERIFIED
                        && p.getAmount() != null
                        && !"CLAIM_PAYOUT".equals(p.getPaymentType())
                        && inMonth(p.getCreatedAt(), year, month))
                .toList();

        List<Claim> monthClaims         = allClaims.stream().filter(c -> inMonth(c.getCreatedAt(), year, month)).toList();
        List<Claim> approvedMonthClaims = monthClaims.stream()
                .filter(c -> c.getStatus() == ClaimStatus.APPROVED && c.getAmount() != null).toList();

        List<PolicyApplication> monthApps = allApps.stream()
                .filter(a -> inMonth(a.getCreatedAt(), year, month)).toList();

        BigDecimal totalRevenue   = monthPayments.stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalClaimsPaid = approvedMonthClaims.stream().map(Claim::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal netProfit      = totalRevenue.subtract(totalClaimsPaid);
        double lossRatio  = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                ? totalClaimsPaid.multiply(BigDecimal.valueOf(100)).divide(totalRevenue, 2, RoundingMode.HALF_UP).doubleValue() : 0;
        double profitMargin = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                ? netProfit.multiply(BigDecimal.valueOf(100)).divide(totalRevenue, 2, RoundingMode.HALF_UP).doubleValue() : 0;

        long approvedApps = monthApps.stream().filter(a -> a.getStatus() == ApplicationStatus.APPROVED).count();
        long pendingApps  = monthApps.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING || a.getStatus() == ApplicationStatus.VERIFIED).count();
        long rejectedApps = monthApps.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count();

        long approvedClaimsCount = monthClaims.stream().filter(c -> c.getStatus() == ClaimStatus.APPROVED).count();
        long pendingClaims       = monthClaims.stream().filter(c -> c.getStatus() == ClaimStatus.PENDING || c.getStatus() == ClaimStatus.VERIFIED).count();
        long rejectedClaims      = monthClaims.stream().filter(c -> c.getStatus() == ClaimStatus.REJECTED).count();

        // ── Revenue by type ───────────────────────────────────────────────
        Map<String, BigDecimal> revenueByType = new TreeMap<>();
        for (Payment p : monthPayments) {
            if (p.getApplication() != null && p.getApplication().getInsurancePackage() != null)
                revenueByType.merge(p.getApplication().getInsurancePackage().getType(), p.getAmount(), BigDecimal::add);
        }
        Map<String, BigDecimal> claimsByType = new TreeMap<>();
        for (Claim c : approvedMonthClaims) {
            String type = (c.getApplication() != null && c.getApplication().getInsurancePackage() != null)
                    ? c.getApplication().getInsurancePackage().getType() : "OTHER";
            claimsByType.merge(type, c.getAmount(), BigDecimal::add);
        }

        // ── Agent performance this month ──────────────────────────────────
        List<Map<String, Object>> agentStats = agents.stream().map(agent -> {
            long handled  = monthApps.stream().filter(a -> a.getAgent() != null && a.getAgent().getId().equals(agent.getId())).count();
            long approved = monthApps.stream().filter(a -> a.getAgent() != null && a.getAgent().getId().equals(agent.getId()) && a.getStatus() == ApplicationStatus.APPROVED).count();
            long claims   = monthClaims.stream().filter(c -> c.getAgent() != null && c.getAgent().getId().equals(agent.getId())).count();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name",     agent.getName());
            m.put("type",     agent.getInsuranceType() != null ? agent.getInsuranceType() : "ALL");
            m.put("handled",  handled);
            m.put("approved", approved);
            m.put("claims",   claims);
            m.put("rate",     handled > 0 ? Math.round((double) approved / handled * 1000.0) / 10.0 : 0.0);
            return m;
        }).filter(m -> (long) m.get("handled") > 0 || (long) m.get("claims") > 0)
          .sorted((a, b) -> Long.compare((long) b.get("handled"), (long) a.get("handled")))
          .toList();

        // ── Package popularity this month ─────────────────────────────────
        List<Map<String, Object>> pkgStats = packages.stream().map(pkg -> {
            long count = monthApps.stream()
                    .filter(a -> a.getInsurancePackage() != null && a.getInsurancePackage().getId().equals(pkg.getId()))
                    .count();
            BigDecimal rev = monthPayments.stream()
                    .filter(p -> p.getApplication() != null && p.getApplication().getInsurancePackage() != null
                            && p.getApplication().getInsurancePackage().getId().equals(pkg.getId()))
                    .map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name",  pkg.getName());
            m.put("type",  pkg.getType());
            m.put("count", count);
            m.put("rev",   rev);
            return m;
        }).filter(m -> (long) m.get("count") > 0)
          .sorted((a, b) -> Long.compare((long) b.get("count"), (long) a.get("count")))
          .toList();

        // ── Build PDF ─────────────────────────────────────────────────────
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdfDoc = new PdfDocument(new PdfWriter(baos));
        Document doc = new Document(pdfDoc);
        doc.setMargins(36, 40, 36, 40);

        PdfFont bold    = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
        PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        PdfFont oblique = PdfFontFactory.createFont(StandardFonts.HELVETICA_OBLIQUE);

        // ── HEADER ────────────────────────────────────────────────────────
        Table header = new Table(UnitValue.createPercentArray(new float[]{65, 35})).useAllAvailableWidth();
        header.addCell(new Cell()
                .add(new Paragraph("DIGITAL INSURANCE CLAIMS AND PREMIUMS").setFont(bold).setFontSize(12).setFontColor(BLUE).setMarginBottom(2))
                .add(new Paragraph("PORTAL — MYANMAR").setFont(bold).setFontSize(9).setFontColor(NAVY).setMarginBottom(3))
                .add(new Paragraph("ဒစ်ဂျစ်တယ် အာမခံ တောင်းဆိုမှုနှင့် ကြေးငွေ ပေါ်တယ် — မြန်မာ").setFont(oblique).setFontSize(7.5f).setFontColor(GRAY))
                .setBorder(Border.NO_BORDER).setPadding(4));
        header.addCell(new Cell()
                .add(new Paragraph("MONTHLY ANALYTICS REPORT").setFont(bold).setFontSize(10).setFontColor(BLUE).setTextAlignment(TextAlignment.RIGHT).setMarginBottom(3))
                .add(new Paragraph("လစဉ် ခွဲခြမ်းစိတ်ဖြာမှု အစီရင်ခံစာ").setFont(oblique).setFontSize(7.5f).setFontColor(GRAY).setTextAlignment(TextAlignment.RIGHT).setMarginBottom(5))
                .add(new Paragraph("Period: " + periodLabel).setFont(bold).setFontSize(8.5f).setFontColor(NAVY).setTextAlignment(TextAlignment.RIGHT).setMarginBottom(2))
                .add(new Paragraph("Generated: " + generatedAt).setFont(regular).setFontSize(8).setFontColor(GRAY).setTextAlignment(TextAlignment.RIGHT))
                .setBorder(Border.NO_BORDER).setPadding(4));
        doc.add(header);

        // Blue title bar
        Table bar = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth();
        bar.addCell(new Cell()
                .add(new Paragraph("MONTHLY REPORT: " + periodLabel.toUpperCase() + "   |   မြန်မာ")
                        .setFont(bold).setFontSize(10).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER))
                .setBackgroundColor(BLUE).setPadding(6).setBorder(Border.NO_BORDER));
        doc.add(bar);
        doc.add(new Paragraph("").setMarginBottom(6));

        // ── SECTION 1: EXECUTIVE SUMMARY ─────────────────────────────────
        sectionHeader(doc, bold, "SECTION 1: EXECUTIVE FINANCIAL SUMMARY   (ဘဏ္ဍာရေး အကျဉ်းချုပ်)");

        Table summary = new Table(UnitValue.createPercentArray(new float[]{34, 33, 33})).useAllAvailableWidth();
        addSummaryCell(summary, bold, regular, "PREMIUM INCOME (ဝင်ငွေ)", fmt(totalRevenue) + " MMK", GREEN);
        addSummaryCell(summary, bold, regular, "CLAIM PAYOUT (ထွက်ငွေ)", fmt(totalClaimsPaid) + " MMK", RED);
        DeviceRgb profitColor = netProfit.compareTo(BigDecimal.ZERO) >= 0 ? GREEN : RED;
        addSummaryCell(summary, bold, regular, "NET PROFIT (အမြတ်/အဆုံး)", (netProfit.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "") + fmt(netProfit) + " MMK", profitColor);
        doc.add(summary);
        doc.add(new Paragraph("").setMarginBottom(4));

        // KPI row
        Table kpi = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();
        DeviceRgb lrColor = lossRatio < 60 ? GREEN : lossRatio < 80 ? AMBER : RED;
        DeviceRgb pmColor = profitMargin >= 20 ? GREEN : profitMargin >= 0 ? AMBER : RED;
        addKpiCell(kpi, bold, regular, "Loss Ratio", String.format("%.1f%%", lossRatio),
                lossRatio < 60 ? "Good" : lossRatio < 80 ? "Caution" : "High Risk", lrColor);
        addKpiCell(kpi, bold, regular, "Profit Margin", String.format("%.1f%%", profitMargin),
                profitMargin >= 20 ? "Good" : profitMargin >= 0 ? "Low" : "Loss", pmColor);
        doc.add(kpi);
        doc.add(new Paragraph("").setMarginBottom(8));

        // ── SECTION 2: APPLICATION & CLAIM STATISTICS ─────────────────────
        sectionHeader(doc, bold, "SECTION 2: APPLICATION & CLAIM STATISTICS   (လျှောက်လွှာနှင့် Claim စာရင်း)");

        Table statsTable = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();

        // Applications sub-table
        Table appsInner = new Table(UnitValue.createPercentArray(new float[]{60, 40})).useAllAvailableWidth();
        tableHeaderRow(appsInner, bold, NAVY, new String[]{"Applications (လျှောက်လွှာ)", "Count"});
        tableRow(appsInner, regular, "Total Applications", String.valueOf(monthApps.size()));
        tableRow(appsInner, regular, "  ✔ Approved",  String.valueOf(approvedApps));
        tableRow(appsInner, regular, "  ⏳ Pending",   String.valueOf(pendingApps));
        tableRow(appsInner, regular, "  ✖ Rejected",  String.valueOf(rejectedApps));

        // Claims sub-table
        Table claimsInner = new Table(UnitValue.createPercentArray(new float[]{60, 40})).useAllAvailableWidth();
        tableHeaderRow(claimsInner, bold, NAVY, new String[]{"Claims (Claim)", "Count"});
        tableRow(claimsInner, regular, "Total Claims",    String.valueOf(monthClaims.size()));
        tableRow(claimsInner, regular, "  ✔ Approved",   String.valueOf(approvedClaimsCount));
        tableRow(claimsInner, regular, "  ⏳ Pending",    String.valueOf(pendingClaims));
        tableRow(claimsInner, regular, "  ✖ Rejected",   String.valueOf(rejectedClaims));

        statsTable.addCell(new Cell().add(appsInner).setBorder(Border.NO_BORDER).setPaddingRight(6));
        statsTable.addCell(new Cell().add(claimsInner).setBorder(Border.NO_BORDER).setPaddingLeft(6));
        doc.add(statsTable);
        doc.add(new Paragraph("").setMarginBottom(8));

        // ── SECTION 3: REVENUE & CLAIMS BY INSURANCE TYPE ────────────────
        if (!revenueByType.isEmpty() || !claimsByType.isEmpty()) {
            sectionHeader(doc, bold, "SECTION 3: FINANCIAL BREAKDOWN BY INSURANCE TYPE   (အာမခံ အမျိုးအစားအလိုက်)");

            Table typeTable = new Table(UnitValue.createPercentArray(new float[]{28, 24, 24, 24})).useAllAvailableWidth();
            tableHeaderRow(typeTable, bold, NAVY, new String[]{"Insurance Type", "Premium Income (MMK)", "Claim Payout (MMK)", "Net Profit (MMK)"});

            Set<String> allTypes = new TreeSet<>();
            allTypes.addAll(revenueByType.keySet());
            allTypes.addAll(claimsByType.keySet());
            BigDecimal grandRev = BigDecimal.ZERO, grandClaim = BigDecimal.ZERO;
            for (String type : allTypes) {
                BigDecimal rev   = revenueByType.getOrDefault(type, BigDecimal.ZERO);
                BigDecimal claim = claimsByType.getOrDefault(type, BigDecimal.ZERO);
                BigDecimal profit = rev.subtract(claim);
                grandRev   = grandRev.add(rev);
                grandClaim = grandClaim.add(claim);
                typeTable.addCell(cellOf(type, bold, 8.5f));
                typeTable.addCell(cellOf(fmt(rev), regular, 8.5f).setFontColor(GREEN));
                typeTable.addCell(cellOf(claim.compareTo(BigDecimal.ZERO) > 0 ? fmt(claim) : "—", regular, 8.5f).setFontColor(claim.compareTo(BigDecimal.ZERO) > 0 ? RED : GRAY));
                typeTable.addCell(cellOf((profit.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "") + fmt(profit), bold, 8.5f).setFontColor(profit.compareTo(BigDecimal.ZERO) >= 0 ? GREEN : RED));
            }
            // Totals row
            BigDecimal grandProfit = grandRev.subtract(grandClaim);
            typeTable.addCell(new Cell().add(new Paragraph("TOTAL").setFont(bold).setFontSize(8.5f)).setBackgroundColor(LIGHT).setPadding(4));
            typeTable.addCell(new Cell().add(new Paragraph(fmt(grandRev)).setFont(bold).setFontSize(8.5f).setFontColor(GREEN)).setBackgroundColor(LIGHT).setPadding(4));
            typeTable.addCell(new Cell().add(new Paragraph(fmt(grandClaim)).setFont(bold).setFontSize(8.5f).setFontColor(RED)).setBackgroundColor(LIGHT).setPadding(4));
            typeTable.addCell(new Cell().add(new Paragraph((grandProfit.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "") + fmt(grandProfit)).setFont(bold).setFontSize(8.5f).setFontColor(grandProfit.compareTo(BigDecimal.ZERO) >= 0 ? GREEN : RED)).setBackgroundColor(LIGHT).setPadding(4));
            doc.add(typeTable);
            doc.add(new Paragraph("").setMarginBottom(8));
        }

        // ── SECTION 4: AGENT PERFORMANCE ─────────────────────────────────
        sectionHeader(doc, bold, "SECTION 4: AGENT PERFORMANCE THIS MONTH   (ဤလအတွင်း Agent လုပ်ဆောင်မှု)");

        if (agentStats.isEmpty()) {
            doc.add(new Paragraph("No agent activity recorded for this period.")
                    .setFont(oblique).setFontSize(9).setFontColor(GRAY).setMarginBottom(8));
        } else {
            Table agentTable = new Table(UnitValue.createPercentArray(new float[]{30, 18, 14, 14, 14, 10})).useAllAvailableWidth();
            tableHeaderRow(agentTable, bold, NAVY, new String[]{"Agent", "Type", "Applications", "Approved", "Claims", "Rate"});
            for (Map<String, Object> a : agentStats) {
                double rate = (double) a.get("rate");
                DeviceRgb rc = rate >= 70 ? GREEN : rate >= 40 ? AMBER : RED;
                agentTable.addCell(cellOf((String) a.get("name"), bold, 8.5f));
                agentTable.addCell(cellOf((String) a.get("type"), regular, 8.5f));
                agentTable.addCell(cellOf(String.valueOf(a.get("handled")), regular, 8.5f));
                agentTable.addCell(cellOf(String.valueOf(a.get("approved")), regular, 8.5f).setFontColor(GREEN));
                agentTable.addCell(cellOf(String.valueOf(a.get("claims")), regular, 8.5f).setFontColor(AMBER));
                agentTable.addCell(new Cell().add(new Paragraph(String.format("%.1f%%", rate)).setFont(bold).setFontSize(8.5f).setFontColor(rc)).setPadding(4));
            }
            doc.add(agentTable);
            doc.add(new Paragraph("").setMarginBottom(8));
        }

        // ── SECTION 5: PACKAGE POPULARITY ────────────────────────────────
        sectionHeader(doc, bold, "SECTION 5: PACKAGE POPULARITY THIS MONTH   (ဤလအတွင်း Plan ရေပန်းစားမှု)");

        if (pkgStats.isEmpty()) {
            doc.add(new Paragraph("No package applications recorded for this period.")
                    .setFont(oblique).setFontSize(9).setFontColor(GRAY).setMarginBottom(8));
        } else {
            Table pkgTable = new Table(UnitValue.createPercentArray(new float[]{40, 22, 18, 20})).useAllAvailableWidth();
            tableHeaderRow(pkgTable, bold, NAVY, new String[]{"Package Name", "Type", "Applications", "Revenue (MMK)"});
            for (Map<String, Object> p : pkgStats) {
                pkgTable.addCell(cellOf((String) p.get("name"), bold, 8.5f));
                pkgTable.addCell(cellOf((String) p.get("type"), regular, 8.5f));
                pkgTable.addCell(cellOf(String.valueOf(p.get("count")), regular, 8.5f));
                pkgTable.addCell(cellOf(fmt((BigDecimal) p.get("rev")), regular, 8.5f).setFontColor(GREEN));
            }
            doc.add(pkgTable);
            doc.add(new Paragraph("").setMarginBottom(8));
        }

        // ── FOOTER ────────────────────────────────────────────────────────
        Table footer = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth();
        footer.addCell(new Cell()
                .add(new Paragraph("This report is auto-generated by the Digital Insurance Claims and Premiums Portal — Myanmar. " +
                        "ဤ အစီရင်ခံစာကို ဒစ်ဂျစ်တယ် အာမခံ ပေါ်တယ်မှ အလိုအလျောက် ထုတ်ပေးပါသည်။\n" +
                        "Generated on: " + generatedAt + "   |   Period: " + periodLabel)
                        .setFont(oblique).setFontSize(7.5f).setFontColor(GRAY).setTextAlignment(TextAlignment.CENTER))
                .setBackgroundColor(LIGHT).setPadding(8).setBorder(new SolidBorder(LIGHT, 1)));
        doc.add(footer);

        doc.close();
        return baos.toByteArray();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private static boolean inMonth(LocalDateTime dt, int year, int month) {
        return dt != null && dt.getYear() == year && dt.getMonthValue() == month;
    }

    private static String fmt(BigDecimal v) {
        if (v == null) return "0";
        return String.format("%,.0f", v.doubleValue());
    }

    private static void sectionHeader(Document doc, PdfFont bold, String title) {
        Table t = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth();
        t.addCell(new Cell()
                .add(new Paragraph(title).setFont(bold).setFontSize(9).setFontColor(ColorConstants.WHITE))
                .setBackgroundColor(NAVY).setPadding(5).setBorder(Border.NO_BORDER)
                .setMarginBottom(0));
        doc.add(t);
        doc.add(new Paragraph("").setMarginBottom(4));
    }

    private static void addSummaryCell(Table t, PdfFont bold, PdfFont regular, String label, String value, DeviceRgb color) {
        t.addCell(new Cell()
                .add(new Paragraph(label).setFont(regular).setFontSize(7.5f).setFontColor(GRAY).setMarginBottom(4))
                .add(new Paragraph(value).setFont(bold).setFontSize(11).setFontColor(color))
                .setBackgroundColor(LIGHT).setPadding(8).setBorder(new SolidBorder(color, 1.5f))
                .setMarginRight(4));
    }

    private static void addKpiCell(Table t, PdfFont bold, PdfFont regular, String label, String value, String note, DeviceRgb color) {
        t.addCell(new Cell()
                .add(new Paragraph(label).setFont(regular).setFontSize(8).setFontColor(GRAY).setMarginBottom(2))
                .add(new Paragraph(value).setFont(bold).setFontSize(14).setFontColor(color).setMarginBottom(2))
                .add(new Paragraph(note).setFont(bold).setFontSize(8).setFontColor(color))
                .setPadding(8).setBorder(new SolidBorder(LIGHT, 1)).setMarginRight(4));
    }

    private static void tableHeaderRow(Table t, PdfFont bold, DeviceRgb bg, String[] headers) {
        for (String h : headers) {
            t.addHeaderCell(new Cell()
                    .add(new Paragraph(h).setFont(bold).setFontSize(8).setFontColor(ColorConstants.WHITE))
                    .setBackgroundColor(bg).setPadding(5));
        }
    }

    private static void tableRow(Table t, PdfFont regular, String label, String value) {
        t.addCell(cellOf(label, regular, 8.5f));
        t.addCell(cellOf(value, regular, 8.5f).setTextAlignment(TextAlignment.RIGHT));
    }

    private static Cell cellOf(String text, PdfFont font, float size) {
        return new Cell().add(new Paragraph(text != null ? text : "—").setFont(font).setFontSize(size)).setPadding(4);
    }
}
