package com.insurance.portal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.insurance.portal.model.Claim;
import com.insurance.portal.model.FormField;
import com.insurance.portal.model.FormTemplate;
import com.insurance.portal.model.PolicyApplication;
import com.insurance.portal.model.User;
import com.insurance.portal.model.enums.FieldType;
import com.insurance.portal.model.enums.FormType;
import com.insurance.portal.repository.ClaimRepository;
import com.insurance.portal.repository.FormTemplateRepository;
import com.insurance.portal.repository.PolicyApplicationRepository;
import com.insurance.portal.repository.UserRepository;
import com.insurance.portal.model.Payment;
import com.insurance.portal.model.enums.PaymentStatus;
import com.insurance.portal.repository.PaymentRepository;
import com.insurance.portal.util.PremiumScheduleUtil;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.util.*;

@RestController
@RequiredArgsConstructor
public class PdfController {

    private final PolicyApplicationRepository appRepo;
    private final ClaimRepository claimRepo;
    private final FormTemplateRepository templateRepo;
    private final UserRepository userRepo;
    private final PaymentRepository paymentRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ── Application PDF (admin) ────────────────────────────────────────
    @GetMapping("/admin/applications/{id}/pdf")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> adminApplicationPdf(@PathVariable Long id) {
        PolicyApplication app = appRepo.findById(id).orElseThrow();
        return buildApplicationPdf(app);
    }

    // ── Application PDF (agent) ────────────────────────────────────────
    @GetMapping("/agent/applications/{id}/pdf")
    @PreAuthorize("hasRole('AGENT')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> agentApplicationPdf(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User agent = userRepo.findByEmail(principal.getUsername()).orElseThrow();
        PolicyApplication app = appRepo.findById(id).orElseThrow();
        if (app.getAgent() == null || !app.getAgent().getId().equals(agent.getId()))
            return ResponseEntity.status(403).build();
        return buildApplicationPdf(app);
    }

    // ── Application PDF (customer) ─────────────────────────────────────
    @GetMapping("/customer/applications/{id}/pdf")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> customerApplicationPdf(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User customer = userRepo.findByEmail(principal.getUsername()).orElseThrow();
        PolicyApplication app = appRepo.findById(id).orElseThrow();
        if (!app.getCustomer().getId().equals(customer.getId()))
            return ResponseEntity.status(403).build();
        return buildApplicationPdf(app);
    }

    // ── Claim PDF (admin) ──────────────────────────────────────────────
    @GetMapping("/admin/claims/{id}/pdf")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> adminClaimPdf(@PathVariable Long id) {
        Claim claim = claimRepo.findById(id).orElseThrow();
        return buildClaimPdf(claim);
    }

    // ── Claim PDF (agent) ──────────────────────────────────────────────
    @GetMapping("/agent/claims/{id}/pdf")
    @PreAuthorize("hasRole('AGENT')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> agentClaimPdf(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User agent = userRepo.findByEmail(principal.getUsername()).orElseThrow();
        Claim claim = claimRepo.findById(id).orElseThrow();
        if (claim.getAgent() == null || !claim.getAgent().getId().equals(agent.getId()))
            return ResponseEntity.status(403).build();
        return buildClaimPdf(claim);
    }

    // ── Claim PDF (customer) ───────────────────────────────────────────
    @GetMapping("/customer/claims/{id}/pdf")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> customerClaimPdf(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User customer = userRepo.findByEmail(principal.getUsername()).orElseThrow();
        Claim claim = claimRepo.findById(id).orElseThrow();
        if (!claim.getCustomer().getId().equals(customer.getId()))
            return ResponseEntity.status(403).build();
        return buildClaimPdf(claim);
    }

    // ── Policy Contract PDF (admin) ────────────────────────────────────
    @GetMapping("/admin/applications/{id}/policy-contract")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> adminPolicyContract(@PathVariable Long id) {
        PolicyApplication app = appRepo.findById(id).orElseThrow();
        List<Payment> payments = paymentRepo.findAllByApplication_Id(id);
        return buildPolicyContractPdf(app, payments);
    }

    // ── Policy Contract PDF (customer) ─────────────────────────────────
    @GetMapping("/customer/applications/{id}/policy-contract")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> customerPolicyContract(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User customer = userRepo.findByEmail(principal.getUsername()).orElseThrow();
        PolicyApplication app = appRepo.findById(id).orElseThrow();
        if (!app.getCustomer().getId().equals(customer.getId()))
            return ResponseEntity.status(403).build();
        List<Payment> payments = paymentRepo.findAllByApplication_Id(id);
        return buildPolicyContractPdf(app, payments);
    }

    // ── Policy Contract PDF (agent) ────────────────────────────────────
    @GetMapping("/agent/applications/{id}/policy-contract")
    @PreAuthorize("hasRole('AGENT')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> agentPolicyContract(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User agent = userRepo.findByEmail(principal.getUsername()).orElseThrow();
        PolicyApplication app = appRepo.findById(id).orElseThrow();
        if (app.getAgent() == null || !app.getAgent().getId().equals(agent.getId()))
            return ResponseEntity.status(403).build();
        List<Payment> payments = paymentRepo.findAllByApplication_Id(id);
        return buildPolicyContractPdf(app, payments);
    }

    // ── Policy Contract PDF builder ────────────────────────────────────
    private ResponseEntity<byte[]> buildPolicyContractPdf(PolicyApplication app, List<Payment> payments) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf);
            doc.setMargins(36, 40, 36, 40);

            PdfFont bold    = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont oblique = PdfFontFactory.createFont(StandardFonts.HELVETICA_OBLIQUE);

            DeviceRgb navy   = new DeviceRgb(15, 23, 42);
            DeviceRgb blue   = new DeviceRgb(29, 78, 175);
            DeviceRgb green  = new DeviceRgb(22, 163, 74);
            DeviceRgb gray   = new DeviceRgb(71, 85, 105);
            DeviceRgb light  = new DeviceRgb(241, 245, 249);
            DeviceRgb amber  = new DeviceRgb(217, 119, 6);
            DeviceRgb red    = new DeviceRgb(220, 38, 38);

            var pkg = app.getInsurancePackage();
            var customer = app.getCustomer();
            var agent = app.getAgent();
            String policyNum = app.getPolicyNumber() != null ? app.getPolicyNumber() : "N/A";
            String issueDate = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy"));

            // ─────────────────────────────────────────────────────────────
            // HEADER
            // ─────────────────────────────────────────────────────────────
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{70, 30})).useAllAvailableWidth();
            Cell logoCell = new Cell()
                    .add(new Paragraph("DIGITAL INSURANCE CLAIMS AND PREMIUMS")
                            .setFont(bold).setFontSize(13).setFontColor(blue).setMarginBottom(2))
                    .add(new Paragraph("PORTAL — MYANMAR")
                            .setFont(bold).setFontSize(10).setFontColor(navy).setMarginBottom(4))
                    .add(new Paragraph("ဒစ်ဂျစ်တယ် အာမခံ တောင်းဆိုမှုနှင့် ကြေးငွေ ပေါ်တယ် — မြန်မာ")
                            .setFont(oblique).setFontSize(8).setFontColor(gray))
                    .setBorder(Border.NO_BORDER).setPadding(4);
            Cell titleCell = new Cell()
                    .add(new Paragraph("OFFICIAL POLICY CONTRACT")
                            .setFont(bold).setFontSize(10).setFontColor(blue)
                            .setTextAlignment(TextAlignment.RIGHT).setMarginBottom(3))
                    .add(new Paragraph("တရားဝင် ပါလစီ စာချုပ်")
                            .setFont(oblique).setFontSize(8).setFontColor(gray)
                            .setTextAlignment(TextAlignment.RIGHT).setMarginBottom(6))
                    .add(new Paragraph("Policy No: " + policyNum)
                            .setFont(bold).setFontSize(8).setFontColor(navy)
                            .setTextAlignment(TextAlignment.RIGHT).setMarginBottom(2))
                    .add(new Paragraph("Issue Date: " + issueDate)
                            .setFont(regular).setFontSize(8).setFontColor(gray)
                            .setTextAlignment(TextAlignment.RIGHT))
                    .setBorder(Border.NO_BORDER).setPadding(4);
            headerTable.addCell(logoCell).addCell(titleCell);
            doc.add(headerTable);

            // Blue header bar
            Table bar = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth();
            bar.addCell(new Cell()
                    .add(new Paragraph("INSURANCE POLICY CONTRACT — MYANMAR (မြန်မာ ပါလစီ စာချုပ်)")
                            .setFont(bold).setFontSize(10).setFontColor(ColorConstants.WHITE)
                            .setTextAlignment(TextAlignment.CENTER))
                    .setBackgroundColor(blue).setPadding(6).setBorder(Border.NO_BORDER));
            doc.add(bar);

            // Status banner
            String status = app.getStatus().name();
            DeviceRgb statusColor = "APPROVED".equals(status) ? green : "REJECTED".equals(status) ? red : amber;
            doc.add(new Paragraph("● STATUS: " + status + "   |   Risk Level: " + (app.getRiskLevel() != null ? app.getRiskLevel() : "N/A"))
                    .setFont(bold).setFontSize(9).setFontColor(statusColor)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBackgroundColor(light).setPaddingTop(4).setPaddingBottom(4).setMarginBottom(8));

            // ─────────────────────────────────────────────────────────────
            // SECTION 1: POLICYHOLDER INFORMATION
            // ─────────────────────────────────────────────────────────────
            addContractSection(doc, bold, "SECTION 1: POLICYHOLDER INFORMATION   (အပိုင်း ၁: ပါလစီဝင် သတင်းအချက်အလက်)", blue, bold);
            addMetaTable(doc, bold, regular, light, java.util.List.of(
                    entry("Full Name  (နာမည်အပြည့်)",         customer != null ? customer.getName() : "N/A"),
                    entry("Email Address  (အီးမေးလ်)",        customer != null ? customer.getEmail() : "N/A"),
                    entry("Phone  (ဖုန်းနံပါတ်)",             customer != null && customer.getPhone() != null ? customer.getPhone() : "N/A"),
                    entry("Address  (လိပ်စာ)",                customer != null && customer.getAddress() != null ? customer.getAddress() : "N/A"),
                    entry("Assigned Agent  (တာဝန်ခံ Agent)",  agent != null ? agent.getName() + (agent.getEmail() != null ? " <" + agent.getEmail() + ">" : "") : "No agent assigned")
            ));

            // ─────────────────────────────────────────────────────────────
            // SECTION 2: INSURANCE PLAN DETAILS
            // ─────────────────────────────────────────────────────────────
            addContractSection(doc, bold, "SECTION 2: INSURANCE PLAN DETAILS   (အပိုင်း ၂: အာမခံ Plan အသေးစိတ်)", blue, bold);
            addMetaTable(doc, bold, regular, light, java.util.List.of(
                    entry("Insurance Plan  (အာမခံ Plan)",         pkg != null ? pkg.getName() : "N/A"),
                    entry("Insurance Type  (အာမခံ အမျိုးအစား)",  pkg != null ? pkg.getType() : "N/A"),
                    entry("Coverage Amount  (အာမခံပမာဏ)",        app.getCoverageAmount() != null ? app.getCoverageAmount().toPlainString() + " MMK" : "N/A"),
                    entry("Policy Duration  (ကာလသတ်မှတ်)",       app.getDuration() != null ? app.getDuration() + " year(s)  (" + app.getDuration() * 12 + " months)" : "N/A"),
                    entry("Max Claim Amount  (အများဆုံး Claim)",  pkg != null && pkg.getMaxClaimAmount() != null ? pkg.getMaxClaimAmount().toPlainString() + " MMK" : "N/A"),
                    entry("Total Premium  (စုစုပေါင်း Premium)",  app.getPremiumAmount() != null ? app.getPremiumAmount().toPlainString() + " MMK" : "N/A"),
                    entry("Payment Frequency  (ပေးချေပုံစံ)",    pkg != null && pkg.getPaymentFrequency() != null ? formatFrequency(pkg.getPaymentFrequency()) : "N/A"),
                    entry("Application Date  (လျှောက်ထားသောနေ့)", app.getCreatedAt() != null ? app.getCreatedAt().format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm")) : "N/A"),
                    entry("Policy Number  (ပါလစီနံပါတ်)",        policyNum)
            ));

            // ─────────────────────────────────────────────────────────────
            // SECTION 3: PREMIUM PAYMENT SCHEDULE
            // ─────────────────────────────────────────────────────────────
            addContractSection(doc, bold, "SECTION 3: PREMIUM PAYMENT SCHEDULE   (အပိုင်း ၃: Premium ပေးသွင်းမှု ဇယား)", blue, bold);
            var schedule = PremiumScheduleUtil.buildSchedule(app, payments);
            doc.add(new Paragraph(String.format(
                    "Payment Frequency: %s  |  Installment Amount: %s MMK  |  Total Installments: %d  |  Paid: %d",
                    schedule.getPaymentFrequency() != null ? formatFrequency(schedule.getPaymentFrequency()) : "N/A",
                    schedule.getInstallmentAmount() != null ? schedule.getInstallmentAmount().toPlainString() : "0",
                    schedule.getTotalInstallments(), schedule.getPaidCount()))
                    .setFont(regular).setFontSize(8.5f).setFontColor(gray).setMarginBottom(6));

            if (!schedule.getSchedule().isEmpty()) {
                Table schTable = new Table(UnitValue.createPercentArray(new float[]{8, 20, 25, 22, 25})).useAllAvailableWidth();
                String[] headers = {"#", "Period  (ကာလ)", "Due Date  (ရက်)", "Amount (MMK)", "Status  (အခြေအနေ)"};
                for (String h : headers) {
                    schTable.addHeaderCell(new Cell().add(new Paragraph(h).setFont(bold).setFontSize(8))
                            .setBackgroundColor(navy).setFontColor(ColorConstants.WHITE).setPadding(4));
                }
                for (var entry2 : schedule.getSchedule()) {
                    String st = entry2.getStatus();
                    DeviceRgb stColor = "PAID".equals(st) ? green : "OVERDUE".equals(st) ? red : "DUE".equals(st) ? amber : gray;
                    schTable.addCell(cellOf(String.valueOf(entry2.getPeriodNumber()), regular, 8, null));
                    schTable.addCell(cellOf(entry2.getPeriodLabel() != null ? entry2.getPeriodLabel() : "—", regular, 8, null));
                    schTable.addCell(cellOf(entry2.getDueDate() != null ? entry2.getDueDate().format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy")) : "—", regular, 8, null));
                    schTable.addCell(cellOf(entry2.getAmount() != null ? entry2.getAmount().toPlainString() : "—", bold, 8, null));
                    schTable.addCell(new Cell().add(new Paragraph(st).setFont(bold).setFontSize(8).setFontColor(stColor)).setPadding(4));
                }
                doc.add(schTable);
            } else {
                doc.add(new Paragraph("No payment schedule available. (ပေးချေမှု ဇယား မရှိသေးပါ)").setFont(regular).setFontSize(9).setFontColor(gray));
            }

            // Payment History
            List<Payment> paidPayments = payments.stream().filter(p -> p.getStatus() == PaymentStatus.VERIFIED).toList();
            if (!paidPayments.isEmpty()) {
                doc.add(new Paragraph("\nPayment History  (ငွေပေးချေမှု မှတ်တမ်း)")
                        .setFont(bold).setFontSize(10).setFontColor(navy).setMarginTop(8).setMarginBottom(4));
                Table histTable = new Table(UnitValue.createPercentArray(new float[]{15, 30, 30, 25})).useAllAvailableWidth();
                for (String h : new String[]{"Amount (MMK)", "Period", "Method", "Date"}) {
                    histTable.addHeaderCell(new Cell().add(new Paragraph(h).setFont(bold).setFontSize(8))
                            .setBackgroundColor(light).setPadding(4));
                }
                for (Payment p : paidPayments) {
                    histTable.addCell(cellOf(p.getAmount() != null ? p.getAmount().toPlainString() : "—", bold, 8, null));
                    histTable.addCell(cellOf(p.getPeriodLabel() != null ? p.getPeriodLabel() : "—", regular, 8, null));
                    histTable.addCell(cellOf(p.getPaymentMethod() != null ? p.getPaymentMethod() : "—", regular, 8, null));
                    histTable.addCell(cellOf(p.getCreatedAt() != null ? p.getCreatedAt().format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy")) : "—", regular, 8, null));
                }
                doc.add(histTable);
            }

            // ─────────────────────────────────────────────────────────────
            // SECTION 4: BENEFITS AND COVERAGE
            // ─────────────────────────────────────────────────────────────
            if (pkg != null) {
                addContractSection(doc, bold, "SECTION 4: BENEFITS AND COVERAGE   (အပိုင်း ၄: အကျိုးခံစားခွင့်နှင့် Coverage)", blue, bold);
                if (pkg.getBenefitsJson() != null && !pkg.getBenefitsJson().isBlank()) {
                    try {
                        @SuppressWarnings("unchecked")
                        java.util.List<String> benefits = objectMapper.readValue(pkg.getBenefitsJson(), java.util.List.class);
                        StringBuilder bsb = new StringBuilder();
                        for (int i = 0; i < benefits.size(); i++) bsb.append((i + 1) + ". " + benefits.get(i) + "\n");
                        doc.add(new Paragraph(bsb.toString().trim()).setFont(regular).setFontSize(9).setFontColor(gray).setMarginBottom(6));
                    } catch (Exception ignored) {
                        doc.add(new Paragraph(pkg.getBenefitsJson()).setFont(regular).setFontSize(9).setFontColor(gray));
                    }
                }
                if (pkg.getExclusions() != null && !pkg.getExclusions().isBlank()) {
                    doc.add(new Paragraph("EXCLUSIONS  (အကျုံးမဝင်သောအရာများ):").setFont(bold).setFontSize(9).setFontColor(red).setMarginTop(4));
                    doc.add(new Paragraph(pkg.getExclusions()).setFont(regular).setFontSize(9).setFontColor(gray));
                }
                if (pkg.getEligibility() != null && !pkg.getEligibility().isBlank()) {
                    doc.add(new Paragraph("ELIGIBILITY  (ကိုက်ညီရမည့်သတ်မှတ်ချက်):").setFont(bold).setFontSize(9).setFontColor(navy).setMarginTop(4));
                    doc.add(new Paragraph(pkg.getEligibility()).setFont(regular).setFontSize(9).setFontColor(gray));
                }
            }

            // ─────────────────────────────────────────────────────────────
            // SECTION 5: TERMS AND CONDITIONS
            // ─────────────────────────────────────────────────────────────
            addContractSection(doc, bold, "SECTION 5: TERMS AND CONDITIONS   (အပိုင်း ၅: စည်းမျဉ်းနှင့် စည်းကမ်းများ)", blue, bold);
            String terms = (pkg != null && pkg.getTermsAndConditions() != null && !pkg.getTermsAndConditions().isBlank())
                    ? pkg.getTermsAndConditions()
                    : "Standard terms and conditions of the Digital Insurance Claims and Premiums Portal apply to this policy. " +
                      "The policyholder agrees to abide by all regulations as stipulated in Myanmar Insurance Law and the " +
                      "Myanmar Insurance Regulatory Authority (MIRA) guidelines. " +
                      "This policy is governed by the laws of the Republic of the Union of Myanmar.\n\n" +
                      "မြန်မာနိုင်ငံ အာမခံဥပဒေနှင့် မြန်မာအာမခံ ကြီးကြပ်ရေးအာဏာပိုင် (MIRA) ၏ လမ်းညွှန်ချက်များအတိုင်း " +
                      "ဤပါလစီ ဆောင်ရွက်မည်ဖြစ်ပါသည်။ ပါလစီဝင်သည် ဤစာချုပ်ပါ စည်းမျဉ်းစည်းကမ်းအားလုံးကို " +
                      "လိုက်နာရန် သဘောတူပါသည်။";
            doc.add(new Paragraph(terms).setFont(regular).setFontSize(8.5f).setFontColor(gray).setMarginBottom(6));

            // ─────────────────────────────────────────────────────────────
            // SECTION 6: DIGITAL SIGNATURES
            // ─────────────────────────────────────────────────────────────
            addContractSection(doc, bold, "SECTION 6: AUTHORIZED SIGNATURES   (အပိုင်း ၆: တရားဝင် လက်မှတ်များ)", blue, bold);
            doc.add(new Paragraph(
                    "This policy contract is legally binding upon both parties upon signature. " +
                    "ဤပါလစီ စာချုပ်သည် နှစ်ဖက် လက်မှတ်ထိုးပြီးသည့် အချိန်မှ တရားဝင် ဥပဒေနှင့် ချည်နှောင်မည်ဖြစ်သည်။")
                    .setFont(oblique).setFontSize(8.5f).setFontColor(gray).setMarginBottom(10));

            Table sigTable = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();

            // Admin / Authorized Officer signature block
            Cell adminSig = new Cell()
                    .add(new Paragraph("AUTHORIZED OFFICER  (တာဝန်ရှိသူ)").setFont(bold).setFontSize(9).setFontColor(blue).setMarginBottom(4))
                    .add(new Paragraph("Name: ___________________________________").setFont(regular).setFontSize(9).setMarginBottom(4))
                    .add(new Paragraph("Designation: _____________________________").setFont(regular).setFontSize(9).setMarginBottom(4))
                    .add(new Paragraph("NRC / ID: ________________________________").setFont(regular).setFontSize(9).setMarginBottom(16))
                    .add(new Paragraph("Signature:").setFont(bold).setFontSize(9).setFontColor(gray).setMarginBottom(2))
                    .add(new Paragraph("________________________").setFont(regular).setFontSize(9).setMarginBottom(2))
                    .add(new Paragraph("Date: _______________").setFont(regular).setFontSize(9).setMarginBottom(6))
                    .add(new Paragraph("[Official Seal  (တံဆိပ်တုံး)]").setFont(oblique).setFontSize(8).setFontColor(gray)
                            .setBorder(new SolidBorder(gray, 0.5f)).setPadding(12).setTextAlignment(TextAlignment.CENTER))
                    .setBorder(new SolidBorder(light, 1)).setPadding(10).setMarginRight(5);

            // Customer signature block
            String custName = customer != null ? customer.getName() : "N/A";
            String custEmail = customer != null ? customer.getEmail() : "N/A";
            Cell custSig = new Cell()
                    .add(new Paragraph("POLICYHOLDER  (ပါလစီဝင်)").setFont(bold).setFontSize(9).setFontColor(green).setMarginBottom(4))
                    .add(new Paragraph("Name: " + custName).setFont(regular).setFontSize(9).setMarginBottom(4))
                    .add(new Paragraph("Email: " + custEmail).setFont(regular).setFontSize(9).setMarginBottom(4))
                    .add(new Paragraph("NRC / ID: ________________________________").setFont(regular).setFontSize(9).setMarginBottom(16))
                    .add(new Paragraph("Signature:").setFont(bold).setFontSize(9).setFontColor(gray).setMarginBottom(2))
                    .add(new Paragraph("________________________").setFont(regular).setFontSize(9).setMarginBottom(2))
                    .add(new Paragraph("Date: _______________").setFont(regular).setFontSize(9).setMarginBottom(6))
                    .add(new Paragraph("Phone: " + (customer != null && customer.getPhone() != null ? customer.getPhone() : "N/A"))
                            .setFont(regular).setFontSize(8).setFontColor(gray))
                    .setBorder(new SolidBorder(light, 1)).setPadding(10).setMarginLeft(5);

            sigTable.addCell(adminSig).addCell(custSig);
            doc.add(sigTable);

            // Footer
            doc.add(new Paragraph(
                    "\nThis document was generated by the Digital Insurance Claims and Premiums Portal on " + issueDate +
                    ".\nPolicy Number: " + policyNum + "  |  Status: " + status +
                    "\nThis is a computer-generated document. For authenticity verification, contact the Insurance Portal administration.")
                    .setFont(oblique).setFontSize(7.5f).setFontColor(gray)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBorderTop(new SolidBorder(light, 0.5f)).setPaddingTop(8).setMarginTop(12));

            doc.close();
            return pdfResponse(baos.toByteArray(), "policy_contract_" + policyNum + ".pdf");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private void addContractSection(Document doc, PdfFont font, String title, DeviceRgb color, PdfFont bold) {
        doc.add(new Paragraph(title)
                .setFont(bold).setFontSize(9.5f).setFontColor(color)
                .setBackgroundColor(new DeviceRgb(241, 245, 249))
                .setPadding(5).setMarginTop(10).setMarginBottom(5));
    }

    private Cell cellOf(String text, PdfFont font, float size, DeviceRgb color) {
        Paragraph p = new Paragraph(text).setFont(font).setFontSize(size);
        if (color != null) p.setFontColor(color);
        return new Cell().add(p).setPadding(4);
    }

    private String formatFrequency(String freq) {
        return switch (freq.toUpperCase()) {
            case "MONTHLY"     -> "Monthly (တစ်လတစ်ကြိမ်)";
            case "QUARTERLY"   -> "Quarterly (သုံးလတစ်ကြိမ်)";
            case "HALF_YEARLY" -> "Half-Yearly (ခြောက်လတစ်ကြိမ်)";
            case "YEARLY"      -> "Yearly (တစ်နှစ်တစ်ကြိမ်)";
            default -> freq;
        };
    }

    // ── PDF builders ──────────────────────────────────────────────────
    private ResponseEntity<byte[]> buildApplicationPdf(PolicyApplication app) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf);

            PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            DeviceRgb headerBg = new DeviceRgb(30, 64, 175);  // blue
            DeviceRgb labelBg  = new DeviceRgb(241, 245, 249); // slate-100

            // Title
            doc.add(new Paragraph("Insurance Application Form")
                    .setFont(boldFont).setFontSize(20)
                    .setFontColor(ColorConstants.WHITE)
                    .setBackgroundColor(headerBg)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(4));

            // Meta section
            String pkgName = app.getInsurancePackage() != null ? app.getInsurancePackage().getName() : "N/A";
            String custName = app.getCustomer() != null ? app.getCustomer().getName() : "N/A";
            addMetaTable(doc, boldFont, regularFont, labelBg, List.of(
                    entry("Policy Number", app.getPolicyNumber()),
                    entry("Customer Name", custName),
                    entry("Insurance Plan", pkgName),
                    entry("Coverage Amount", app.getCoverageAmount() != null ? app.getCoverageAmount().toPlainString() + " MMK" : "N/A"),
                    entry("Duration", app.getDuration() != null ? app.getDuration() + " year(s)" : "N/A"),
                    entry("Premium Amount", app.getPremiumAmount() != null ? app.getPremiumAmount().toPlainString() + " MMK" : "N/A"),
                    entry("Risk Level", app.getRiskLevel()),
                    entry("Status", app.getStatus().name()),
                    entry("Submitted", app.getCreatedAt() != null ? app.getCreatedAt().toString() : "N/A")
            ));

            // Dynamic form data
            if (app.getInsurancePackage() != null) {
                Optional<FormTemplate> tmplOpt = templateRepo.findByInsurancePackageIdAndFormType(
                        app.getInsurancePackage().getId(), FormType.APPLICATION);
                tmplOpt.ifPresent(tmpl -> addFormSection(doc, boldFont, regularFont, labelBg,
                        "Application Details", tmpl.getFields(), app.getFormData()));
            }

            // Notes
            addNotesSection(doc, boldFont, regularFont, app.getNotes(), app.getAgentNote(), app.getAdminNote());

            doc.close();
            return pdfResponse(baos.toByteArray(), "application_" + app.getId() + ".pdf");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private ResponseEntity<byte[]> buildClaimPdf(Claim claim) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf);

            PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            DeviceRgb headerBg = new DeviceRgb(217, 119, 6);  // amber
            DeviceRgb labelBg  = new DeviceRgb(255, 251, 235);

            doc.add(new Paragraph("Insurance Claim Form")
                    .setFont(boldFont).setFontSize(20)
                    .setFontColor(ColorConstants.WHITE)
                    .setBackgroundColor(headerBg)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(4));

            String policyName = claim.getApplication() != null && claim.getApplication().getInsurancePackage() != null
                    ? claim.getApplication().getInsurancePackage().getName() : "N/A";
            String custName = claim.getCustomer() != null ? claim.getCustomer().getName() : "N/A";

            addMetaTable(doc, boldFont, regularFont, labelBg, List.of(
                    entry("Claim ID", "#" + claim.getId()),
                    entry("Customer Name", custName),
                    entry("Insurance Plan", policyName),
                    entry("Claim Type", claim.getClaimType()),
                    entry("Claim Amount", claim.getAmount() != null ? claim.getAmount().toPlainString() + " MMK" : "N/A"),
                    entry("Incident Date", claim.getIncidentDate() != null ? claim.getIncidentDate().toString() : "N/A"),
                    entry("Status", claim.getStatus().name()),
                    entry("Submitted", claim.getCreatedAt() != null ? claim.getCreatedAt().toString() : "N/A")
            ));

            // Dynamic claim form data
            if (claim.getApplication() != null && claim.getApplication().getInsurancePackage() != null) {
                Optional<FormTemplate> tmplOpt = templateRepo.findByInsurancePackageIdAndFormType(
                        claim.getApplication().getInsurancePackage().getId(), FormType.CLAIM);
                tmplOpt.ifPresent(tmpl -> addFormSection(doc, boldFont, regularFont, labelBg,
                        "Claim Details", tmpl.getFields(), claim.getFormData()));
            }

            // Description
            if (claim.getDescription() != null && !claim.getDescription().isBlank()) {
                doc.add(new Paragraph("Description").setFont(boldFont).setFontSize(12).setMarginTop(12).setMarginBottom(4));
                doc.add(new Paragraph(claim.getDescription()).setFont(regularFont).setFontSize(10));
            }

            addNotesSection(doc, boldFont, regularFont, null, claim.getAgentNote(), claim.getAdminNote());

            doc.close();
            return pdfResponse(baos.toByteArray(), "claim_" + claim.getId() + ".pdf");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── PDF helpers ───────────────────────────────────────────────────
    private void addMetaTable(Document doc, PdfFont boldFont, PdfFont regularFont,
                               DeviceRgb labelBg, List<Map.Entry<String, String>> entries) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{35, 65})).useAllAvailableWidth();
        for (Map.Entry<String, String> e : entries) {
            table.addCell(new Cell().add(new Paragraph(e.getKey()).setFont(boldFont).setFontSize(9))
                    .setBackgroundColor(labelBg).setPadding(5));
            table.addCell(new Cell().add(new Paragraph(e.getValue() != null ? e.getValue() : "—").setFont(regularFont).setFontSize(9))
                    .setPadding(5));
        }
        doc.add(table);
    }

    @SuppressWarnings("unchecked")
    private void addFormSection(Document doc, PdfFont boldFont, PdfFont regularFont,
                                 DeviceRgb labelBg, String title, List<FormField> fields, String formDataJson) {
        if (fields == null || fields.isEmpty()) return;

        Map<String, Object> dataMap = new HashMap<>();
        if (formDataJson != null && !formDataJson.isBlank()) {
            try { dataMap = objectMapper.readValue(formDataJson, Map.class); } catch (Exception ignored) {}
        }

        doc.add(new Paragraph(title).setFont(boldFont).setFontSize(13).setMarginTop(16).setMarginBottom(6));

        Table table = new Table(UnitValue.createPercentArray(new float[]{35, 65})).useAllAvailableWidth();

        for (FormField field : fields) {
            if (field.getFieldType() == FieldType.LABEL) {
                // Section label — full row
                table.addCell(new Cell(1, 2)
                        .add(new Paragraph(field.getFieldLabel()).setFont(boldFont).setFontSize(10)
                                .setFontColor(new DeviceRgb(30, 64, 175)))
                        .setBackgroundColor(labelBg).setPadding(6));
                continue;
            }

            String value = dataMap.containsKey(String.valueOf(field.getId()))
                    ? String.valueOf(dataMap.get(String.valueOf(field.getId()))) : "";

            String displayValue;
            if (field.getFieldType() == FieldType.CHECKBOX) {
                // value may be JSON array ["A","B"] or "true"/"false"
                if (value.startsWith("[")) {
                    try {
                        List<String> selected = objectMapper.readValue(value, List.class);
                        displayValue = selected.isEmpty() ? "—" : String.join(", ", selected);
                    } catch (Exception e) { displayValue = value; }
                } else {
                    displayValue = "true".equalsIgnoreCase(value) ? "✓ Yes" : "false".equalsIgnoreCase(value) ? "✗ No" : value;
                }
            } else if (field.getFieldType() == FieldType.IMAGE_UPLOAD || field.getFieldType() == FieldType.PDF_UPLOAD) {
                displayValue = value.isBlank() ? "—" : "[Uploaded file: " + java.nio.file.Paths.get(value).getFileName() + "]";
            } else {
                displayValue = value.isBlank() ? "—" : value;
            }

            table.addCell(new Cell().add(new Paragraph(field.getFieldLabel()).setFont(boldFont).setFontSize(9))
                    .setBackgroundColor(labelBg).setPadding(5));
            table.addCell(new Cell().add(new Paragraph(displayValue).setFont(regularFont).setFontSize(9))
                    .setPadding(5));
        }
        doc.add(table);
    }

    private void addNotesSection(Document doc, PdfFont boldFont, PdfFont regularFont,
                                  String customerNote, String agentNote, String adminNote) {
        boolean hasNotes = (customerNote != null && !customerNote.isBlank())
                || (agentNote != null && !agentNote.isBlank())
                || (adminNote != null && !adminNote.isBlank());
        if (!hasNotes) return;
        doc.add(new Paragraph("Notes & Remarks").setFont(boldFont).setFontSize(12).setMarginTop(12).setMarginBottom(4));
        if (customerNote != null && !customerNote.isBlank())
            doc.add(new Paragraph("Customer: " + customerNote).setFont(regularFont).setFontSize(10));
        if (agentNote != null && !agentNote.isBlank())
            doc.add(new Paragraph("Agent: " + agentNote).setFont(regularFont).setFontSize(10));
        if (adminNote != null && !adminNote.isBlank())
            doc.add(new Paragraph("Admin: " + adminNote).setFont(regularFont).setFontSize(10));
    }

    private ResponseEntity<byte[]> pdfResponse(byte[] data, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    private Map.Entry<String, String> entry(String k, String v) {
        return Map.entry(k, v != null ? v : "—");
    }
}
