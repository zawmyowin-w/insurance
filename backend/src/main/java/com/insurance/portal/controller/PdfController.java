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
import com.itextpdf.layout.element.LineSeparator;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.io.image.ImageDataFactory;
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
import com.itextpdf.layout.element.Image;
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
import java.util.Base64;

@RestController
@RequiredArgsConstructor
public class PdfController {

    private final PolicyApplicationRepository appRepo;
    private final ClaimRepository claimRepo;
    private final FormTemplateRepository templateRepo;
    private final UserRepository userRepo;
    private final PaymentRepository paymentRepo;
    private static final ObjectMapper MAPPER = new ObjectMapper();

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
            DeviceRgb purple = new DeviceRgb(109, 40, 217);
            DeviceRgb gray   = new DeviceRgb(71, 85, 105);
            DeviceRgb light  = new DeviceRgb(241, 245, 249);
            DeviceRgb amber  = new DeviceRgb(217, 119, 6);
            DeviceRgb red    = new DeviceRgb(220, 38, 38);
            DeviceRgb greenLight  = new DeviceRgb(240, 253, 244);
            DeviceRgb blueLight   = new DeviceRgb(239, 246, 255);
            DeviceRgb purpleLight = new DeviceRgb(245, 243, 255);

            var pkg      = app.getInsurancePackage();
            var customer = app.getCustomer();
            var agent    = app.getAgent();
            var adminUser = app.getApprovedBy();
            String policyNum = app.getPolicyNumber() != null ? app.getPolicyNumber() : "N/A";
            String issueDate = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy"));
            java.time.format.DateTimeFormatter dtFmt = java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm");

            // Unique document reference hash (visual identifier, not cryptographic)
            String docRef = String.format("DICP-%s-%08X", policyNum,
                    Math.abs(java.util.Objects.hash(policyNum, app.getId(), customer != null ? customer.getEmail() : "")));

            // ─────────────────────────────────────────────────────────────
            // HEADER
            // ─────────────────────────────────────────────────────────────
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{70, 30})).useAllAvailableWidth();
            headerTable.addCell(new Cell()
                    .add(new Paragraph("DIGITAL INSURANCE CLAIMS AND PREMIUMS")
                            .setFont(bold).setFontSize(13).setFontColor(blue).setMarginBottom(2))
                    .add(new Paragraph("PORTAL — MYANMAR")
                            .setFont(bold).setFontSize(10).setFontColor(navy).setMarginBottom(4))
                    .add(new Paragraph("ဒစ်ဂျစ်တယ် အာမခံ တောင်းဆိုမှုနှင့် ကြေးငွေ ပေါ်တယ် — မြန်မာ")
                            .setFont(oblique).setFontSize(8).setFontColor(gray))
                    .setBorder(Border.NO_BORDER).setPadding(4));
            headerTable.addCell(new Cell()
                    .add(new Paragraph("OFFICIAL POLICY CERTIFICATE")
                            .setFont(bold).setFontSize(10).setFontColor(blue)
                            .setTextAlignment(TextAlignment.RIGHT).setMarginBottom(3))
                    .add(new Paragraph("တရားဝင် ပါလစီ လက်မှတ်")
                            .setFont(oblique).setFontSize(8).setFontColor(gray)
                            .setTextAlignment(TextAlignment.RIGHT).setMarginBottom(4))
                    .add(new Paragraph("Policy No: " + policyNum)
                            .setFont(bold).setFontSize(8).setFontColor(navy)
                            .setTextAlignment(TextAlignment.RIGHT).setMarginBottom(2))
                    .add(new Paragraph("Issue Date: " + issueDate)
                            .setFont(regular).setFontSize(8).setFontColor(gray)
                            .setTextAlignment(TextAlignment.RIGHT).setMarginBottom(2))
                    .add(new Paragraph("Ref: " + docRef)
                            .setFont(oblique).setFontSize(7).setFontColor(gray)
                            .setTextAlignment(TextAlignment.RIGHT))
                    .setBorder(Border.NO_BORDER).setPadding(4));
            doc.add(headerTable);

            // Blue header bar
            doc.add(new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth()
                    .addCell(new Cell()
                            .add(new Paragraph("INSURANCE POLICY CERTIFICATE — MYANMAR (မြန်မာ ပါလစီ လက်မှတ်)")
                                    .setFont(bold).setFontSize(10).setFontColor(ColorConstants.WHITE)
                                    .setTextAlignment(TextAlignment.CENTER))
                            .setBackgroundColor(blue).setPadding(6).setBorder(Border.NO_BORDER)));

            // Status banner
            String status = app.getStatus().name();
            DeviceRgb statusColor = "APPROVED".equals(status) ? green : "REJECTED".equals(status) ? red : amber;
            doc.add(new Paragraph("● STATUS: " + status + "   |   Risk Level: " + (app.getRiskLevel() != null ? app.getRiskLevel() : "N/A")
                    + "   |   Policy No: " + policyNum)
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
                    entry("Application Date  (လျှောက်ထားသောနေ့)", app.getCreatedAt() != null ? app.getCreatedAt().format(dtFmt) : "N/A"),
                    entry("Assigned Agent  (တာဝန်ခံ Agent)",  agent != null ? agent.getName() + (agent.getEmail() != null ? "  <" + agent.getEmail() + ">" : "") : "No agent assigned")
            ));
            if (app.getNotes() != null && !app.getNotes().isBlank()) {
                doc.add(new Paragraph("Customer Notes: " + app.getNotes())
                        .setFont(oblique).setFontSize(8.5f).setFontColor(gray).setMarginBottom(4));
            }

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
                    entry("Risk Level  (အန္တရာယ်အဆင့်)",         app.getRiskLevel() != null ? app.getRiskLevel() : "N/A"),
                    entry("Policy Number  (ပါလစီနံပါတ်)",        policyNum)
            ));

            // ─────────────────────────────────────────────────────────────
            // SECTION 3: CUSTOMER APPLICATION FORM DATA
            // ─────────────────────────────────────────────────────────────
            if (pkg != null) {
                Optional<FormTemplate> tmplOpt = templateRepo.findByInsurancePackageIdAndFormType(pkg.getId(), FormType.APPLICATION);
                if (tmplOpt.isPresent()) {
                    FormTemplate tmpl = tmplOpt.get();
                    addContractSection(doc, bold, "SECTION 3: CUSTOMER APPLICATION FORM DATA   (အပိုင်း ၃: Customer ဖြည့်စွက်သော ပုံစံ အချက်အလက်များ)", blue, bold);
                    addFormSection(doc, bold, regular, light, tmpl.getName(), tmpl.getFields(), app.getFormData());
                }
            }

            // ─────────────────────────────────────────────────────────────
            // SECTION 4: PREMIUM PAYMENT DETAILS
            // ─────────────────────────────────────────────────────────────
            addContractSection(doc, bold, "SECTION 4: PREMIUM PAYMENT DETAILS   (အပိုင်း ၄: Premium ငွေပေးချေမှု အချက်အလက်များ)", blue, bold);
            var schedule = PremiumScheduleUtil.buildSchedule(app, payments);
            addMetaTable(doc, bold, regular, light, java.util.List.of(
                    entry("Payment Frequency  (ပေးချေပုံစံ)",     schedule.getPaymentFrequency() != null ? formatFrequency(schedule.getPaymentFrequency()) : "N/A"),
                    entry("Installment Amount  (တစ်ကြိမ်ပမာဏ)",  schedule.getInstallmentAmount() != null ? schedule.getInstallmentAmount().toPlainString() + " MMK" : "N/A"),
                    entry("Total Installments  (စုစုပေါင်းကြိမ်)", String.valueOf(schedule.getTotalInstallments())),
                    entry("Paid Installments  (ပေးပြီးကြိမ်)",    String.valueOf(schedule.getPaidCount())),
                    entry("Remaining  (ကျန်ကြိမ်)",               String.valueOf(schedule.getTotalInstallments() - schedule.getPaidCount()))
            ));

            // Payment schedule table
            if (!schedule.getSchedule().isEmpty()) {
                doc.add(new Paragraph("Payment Schedule  (ပေးချေမှု ဇယား)")
                        .setFont(bold).setFontSize(9.5f).setFontColor(navy).setMarginTop(8).setMarginBottom(4));
                Table schTable = new Table(UnitValue.createPercentArray(new float[]{6, 18, 22, 20, 34})).useAllAvailableWidth();
                for (String h : new String[]{"#", "Period  (ကာလ)", "Due Date  (ရက်)", "Amount (MMK)", "Status  (အခြေအနေ)"}) {
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
            }

            // Verified payment records (detailed)
            List<Payment> verifiedPayments = payments.stream().filter(p -> p.getStatus() == PaymentStatus.VERIFIED).toList();
            if (!verifiedPayments.isEmpty()) {
                doc.add(new Paragraph("\nVerified Payment Records  (စစ်ဆေးပြီး ငွေပေးချေမှု မှတ်တမ်းများ)")
                        .setFont(bold).setFontSize(9.5f).setFontColor(navy).setMarginTop(8).setMarginBottom(4));
                Table histTable = new Table(UnitValue.createPercentArray(new float[]{14, 16, 18, 16, 22, 14})).useAllAvailableWidth();
                for (String h : new String[]{"Amount (MMK)", "Trans. Amount", "Period", "Method", "Verified By", "Date"}) {
                    histTable.addHeaderCell(new Cell().add(new Paragraph(h).setFont(bold).setFontSize(7.5f))
                            .setBackgroundColor(new DeviceRgb(22, 163, 74)).setFontColor(ColorConstants.WHITE).setPadding(4));
                }
                for (Payment p : verifiedPayments) {
                    histTable.addCell(cellOf(p.getAmount() != null ? p.getAmount().toPlainString() : "—", bold, 8, null));
                    histTable.addCell(cellOf(p.getTransactionAmount() != null ? p.getTransactionAmount().toPlainString()
                            + (p.getTransactionLastSixDigits() != null ? "\n(Ref: ..." + p.getTransactionLastSixDigits() + ")" : "") : "—", regular, 7.5f, null));
                    histTable.addCell(cellOf(p.getPeriodLabel() != null ? p.getPeriodLabel() : "—", regular, 8, null));
                    histTable.addCell(cellOf(p.getPaymentMethod() != null ? p.getPaymentMethod().replace("_", " ") : "—", regular, 8, null));
                    histTable.addCell(cellOf(p.getVerifiedBy() != null ? p.getVerifiedBy() : "—", regular, 8, null));
                    histTable.addCell(cellOf(p.getUpdatedAt() != null ? p.getUpdatedAt().format(dtFmt) : "—", regular, 7.5f, null));
                }
                doc.add(histTable);
            }

            // ─────────────────────────────────────────────────────────────
            // SECTION 5: BENEFITS AND COVERAGE
            // ─────────────────────────────────────────────────────────────
            if (pkg != null) {
                addContractSection(doc, bold, "SECTION 5: BENEFITS AND COVERAGE   (အပိုင်း ၅: အကျိုးခံစားခွင့်နှင့် Coverage)", blue, bold);
                if (pkg.getBenefitsJson() != null && !pkg.getBenefitsJson().isBlank()) {
                    try {
                        @SuppressWarnings("unchecked")
                        java.util.List<String> benefits = MAPPER.readValue(pkg.getBenefitsJson(), java.util.List.class);
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
            // SECTION 6: TERMS AND CONDITIONS
            // ─────────────────────────────────────────────────────────────
            addContractSection(doc, bold, "SECTION 6: TERMS AND CONDITIONS   (အပိုင်း ၆: စည်းမျဉ်းနှင့် စည်းကမ်းများ)", blue, bold);
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
            // SECTION 7: DIGITAL SIGNATURES
            // ─────────────────────────────────────────────────────────────
            addContractSection(doc, bold, "SECTION 7: DIGITAL SIGNATURES   (အပိုင်း ၇: ဒစ်ဂျစ်တယ် လက်မှတ်များ)", blue, bold);
            doc.add(new Paragraph(
                    "This certificate is digitally verified and legally binding. Each signature block below certifies the " +
                    "role and identity of the party in this insurance contract. " +
                    "ဤလက်မှတ်သည် ဒစ်ဂျစ်တယ် စစ်ဆေးပြီးဖြစ်ပြီး တရားဝင် ဥပဒေနှင့် ချည်နှောင်မည်ဖြစ်သည်။")
                    .setFont(oblique).setFontSize(8.5f).setFontColor(gray).setMarginBottom(10));

            // --- Row 1: Customer + Agent (side by side) ---
            Table sigRow1 = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();

            // CUSTOMER DIGITAL SIGNATURE BLOCK
            String custName    = customer != null ? customer.getName() : "N/A";
            String custEmail   = customer != null ? customer.getEmail() : "N/A";
            String custPhone   = customer != null && customer.getPhone()   != null ? customer.getPhone()   : "N/A";
            String custAddress = customer != null && customer.getAddress() != null ? customer.getAddress() : "N/A";
            String custSubmitDate = app.getCreatedAt() != null ? app.getCreatedAt().format(dtFmt) : "N/A";
            String custSigRef  = String.format("SIG-C-%08X", Math.abs(java.util.Objects.hash(custEmail, policyNum)));
            String customerSignature = extractCustomerSignature(app.getFormData());

            Cell custSig = new Cell()
                    .add(new Paragraph("POLICYHOLDER / CUSTOMER  (ပါလစီဝင်)").setFont(bold).setFontSize(9).setFontColor(green).setMarginBottom(6))
                    .add(new Paragraph("Name:").setFont(bold).setFontSize(8).setFontColor(gray))
                    .add(new Paragraph(custName).setFont(bold).setFontSize(9.5f).setFontColor(navy).setMarginBottom(4))
                    .add(new Paragraph("Email:  " + custEmail).setFont(regular).setFontSize(8).setFontColor(gray).setMarginBottom(2))
                    .add(new Paragraph("Phone:  " + custPhone).setFont(regular).setFontSize(8).setFontColor(gray).setMarginBottom(2))
                    .add(new Paragraph("Address:  " + custAddress).setFont(regular).setFontSize(8).setFontColor(gray).setMarginBottom(6))
                    .add(new Paragraph("Application Submitted:").setFont(bold).setFontSize(8).setFontColor(gray))
                    .add(new Paragraph(custSubmitDate).setFont(regular).setFontSize(8).setFontColor(navy).setMarginBottom(8))
                    .add(new Paragraph(customerSignature != null ? "[ DIGITALLY SIGNED ]" : "[ NOT SIGNED ]")
                            .setFont(bold).setFontSize(9).setFontColor(green)
                            .setTextAlignment(TextAlignment.CENTER)
                            .setBackgroundColor(greenLight).setPadding(6)
                            .setBorder(new SolidBorder(green, 0.8f)).setMarginBottom(3))
                    .add(new Paragraph("Ref: " + custSigRef).setFont(oblique).setFontSize(7).setFontColor(gray)
                            .setTextAlignment(TextAlignment.CENTER))
                    .setBackgroundColor(greenLight).setBorder(new SolidBorder(green, 1)).setPadding(10).setMarginRight(4);
            addSignatureImage(custSig, customerSignature);

            // AGENT DIGITAL SIGNATURE BLOCK
            String agentName  = agent != null ? agent.getName() : "Not Assigned";
            String agentEmail = agent != null && agent.getEmail() != null ? agent.getEmail() : "N/A";
            String agentPhone = agent != null && agent.getPhone() != null ? agent.getPhone() : "N/A";
            String agentType  = agent != null && agent.getInsuranceType() != null ? agent.getInsuranceType() : "N/A";
            String agentNote  = app.getAgentNote() != null && !app.getAgentNote().isBlank() ? app.getAgentNote() : "—";
            String agentSigRef = String.format("SIG-A-%08X", Math.abs(java.util.Objects.hash(agentEmail, policyNum)));

            Cell agentSig = new Cell()
                    .add(new Paragraph("REVIEWING AGENT  (စစ်ဆေးသော Agent)").setFont(bold).setFontSize(9).setFontColor(purple).setMarginBottom(6))
                    .add(new Paragraph("Name:").setFont(bold).setFontSize(8).setFontColor(gray))
                    .add(new Paragraph(agentName).setFont(bold).setFontSize(9.5f).setFontColor(navy).setMarginBottom(4))
                    .add(new Paragraph("Email:  " + agentEmail).setFont(regular).setFontSize(8).setFontColor(gray).setMarginBottom(2))
                    .add(new Paragraph("Phone:  " + agentPhone).setFont(regular).setFontSize(8).setFontColor(gray).setMarginBottom(2))
                    .add(new Paragraph("Specialty:  " + agentType).setFont(regular).setFontSize(8).setFontColor(gray).setMarginBottom(4))
                    .add(new Paragraph("Agent Remarks:").setFont(bold).setFontSize(8).setFontColor(gray))
                    .add(new Paragraph(agentNote).setFont(oblique).setFontSize(8).setFontColor(navy).setMarginBottom(8))
                     .add(new Paragraph(app.getAgentSignature() != null ? "[ DIGITALLY VERIFIED ]" : "[ NOT SIGNED ]")
                            .setFont(bold).setFontSize(9).setFontColor(purple)
                            .setTextAlignment(TextAlignment.CENTER)
                            .setBackgroundColor(purpleLight).setPadding(6)
                            .setBorder(new SolidBorder(purple, 0.8f)).setMarginBottom(3))
                    .add(new Paragraph("Ref: " + agentSigRef).setFont(oblique).setFontSize(7).setFontColor(gray)
                            .setTextAlignment(TextAlignment.CENTER))
                    .setBackgroundColor(purpleLight).setBorder(new SolidBorder(purple, 1)).setPadding(10).setMarginLeft(4);
            addSignatureImage(agentSig, app.getAgentSignature());

            sigRow1.addCell(custSig).addCell(agentSig);
            doc.add(sigRow1);

            // --- Row 2: Admin (full width) ---
            doc.add(new Paragraph("").setMarginBottom(6));
            String adminName      = adminUser != null ? adminUser.getName() : "Portal Administrator";
            String adminEmail2    = adminUser != null && adminUser.getEmail() != null ? adminUser.getEmail() : "admin@dicp.com.mm";
            String adminPhone     = adminUser != null && adminUser.getPhone() != null ? adminUser.getPhone() : "N/A";
            String adminNote      = app.getAdminNote() != null && !app.getAdminNote().isBlank() ? app.getAdminNote() : "—";
            String adminApproveDate = app.getApprovedAt() != null ? app.getApprovedAt().format(dtFmt)
                    : (app.getUpdatedAt() != null ? app.getUpdatedAt().format(dtFmt) : issueDate);
            String adminSigRef    = String.format("SIG-D-%08X", Math.abs(java.util.Objects.hash(adminEmail2, policyNum)));

            Table adminRow = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth();
            Cell adminSig = new Cell()
                    .add(new Paragraph("APPROVING ADMINISTRATOR  (အတည်ပြုသော Admin)").setFont(bold).setFontSize(9).setFontColor(blue).setMarginBottom(6))
                    .add(new Table(UnitValue.createPercentArray(new float[]{25, 25, 25, 25})).useAllAvailableWidth()
                            .addCell(new Cell().setBorder(Border.NO_BORDER)
                                    .add(new Paragraph("Name:").setFont(bold).setFontSize(8).setFontColor(gray))
                                    .add(new Paragraph(adminName).setFont(bold).setFontSize(9.5f).setFontColor(navy)))
                            .addCell(new Cell().setBorder(Border.NO_BORDER)
                                    .add(new Paragraph("Email:").setFont(bold).setFontSize(8).setFontColor(gray))
                                    .add(new Paragraph(adminEmail2).setFont(regular).setFontSize(8.5f).setFontColor(navy)))
                            .addCell(new Cell().setBorder(Border.NO_BORDER)
                                    .add(new Paragraph("Phone:").setFont(bold).setFontSize(8).setFontColor(gray))
                                    .add(new Paragraph(adminPhone).setFont(regular).setFontSize(8.5f).setFontColor(navy)))
                            .addCell(new Cell().setBorder(Border.NO_BORDER)
                                    .add(new Paragraph("Approval Date:").setFont(bold).setFontSize(8).setFontColor(gray))
                                    .add(new Paragraph(adminApproveDate).setFont(regular).setFontSize(8.5f).setFontColor(navy))))
                    .add(new Paragraph("Admin Remarks:  " + adminNote)
                            .setFont(oblique).setFontSize(8).setFontColor(gray).setMarginTop(6).setMarginBottom(8))
                    .add(new Table(UnitValue.createPercentArray(new float[]{60, 40})).useAllAvailableWidth()
                            .addCell(new Cell().setBorder(Border.NO_BORDER)
                             .add(new Paragraph(app.getAdminSignature() != null ? "[ DIGITALLY APPROVED ]" : "[ NOT SIGNED ]")
                                            .setFont(bold).setFontSize(10).setFontColor(blue)
                                            .setTextAlignment(TextAlignment.CENTER)
                                            .setBackgroundColor(blueLight).setPadding(8)
                                            .setBorder(new SolidBorder(blue, 1))))
                            .addCell(new Cell().setBorder(Border.NO_BORDER).setPaddingLeft(8)
                                    .add(new Paragraph("Document Ref:").setFont(bold).setFontSize(8).setFontColor(gray))
                                    .add(new Paragraph(docRef).setFont(regular).setFontSize(8).setFontColor(navy).setMarginBottom(2))
                                    .add(new Paragraph("Sig Ref:").setFont(bold).setFontSize(8).setFontColor(gray))
                                    .add(new Paragraph(adminSigRef).setFont(regular).setFontSize(8).setFontColor(navy))))
                    .setBackgroundColor(blueLight).setBorder(new SolidBorder(blue, 1)).setPadding(10);
            addSignatureImage(adminSig, app.getAdminSignature());
            adminRow.addCell(adminSig);
            doc.add(adminRow);

            // Footer
            doc.add(new Paragraph(
                    "\nThis certificate was generated by the Digital Insurance Claims and Premiums Portal on " + issueDate +
                    ".\nPolicy Number: " + policyNum + "  |  Status: " + status + "  |  Document Ref: " + docRef +
                    "\nThis is a digitally verified document. For authenticity verification, contact the Insurance Portal administration.")
                    .setFont(oblique).setFontSize(7.5f).setFontColor(gray)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBorderTop(new SolidBorder(light, 0.5f)).setPaddingTop(8).setMarginTop(12));

            doc.close();
            return pdfResponse(baos.toByteArray(), "policy_certificate_" + policyNum + ".pdf");
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
            Document doc = new Document(new PdfDocument(new PdfWriter(baos)));
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

            var pkg      = app.getInsurancePackage();
            var customer = app.getCustomer();
            var agent    = app.getAgent();
            String issueDate  = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy"));
            String policyNum  = app.getPolicyNumber() != null ? app.getPolicyNumber() : "N/A";
            String statusStr  = app.getStatus().name();

            // ── HEADER ──────────────────────────────────────────────────
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{70, 30})).useAllAvailableWidth();
            headerTable.addCell(new Cell()
                    .add(new Paragraph("DIGITAL INSURANCE CLAIMS AND PREMIUMS").setFont(bold).setFontSize(12).setFontColor(blue).setMarginBottom(2))
                    .add(new Paragraph("PORTAL — MYANMAR").setFont(bold).setFontSize(9).setFontColor(navy).setMarginBottom(3))
                    .add(new Paragraph("ဒစ်ဂျစ်တယ် အာမခံ တောင်းဆိုမှုနှင့် ကြေးငွေ ပေါ်တယ် — မြန်မာ").setFont(oblique).setFontSize(8).setFontColor(gray))
                    .setBorder(Border.NO_BORDER).setPadding(4));
            headerTable.addCell(new Cell()
                    .add(new Paragraph("INSURANCE APPLICATION FORM").setFont(bold).setFontSize(10).setFontColor(blue).setTextAlignment(TextAlignment.RIGHT).setMarginBottom(3))
                    .add(new Paragraph("အာမခံ လျှောက်လွှာ ပုံစံ").setFont(oblique).setFontSize(8).setFontColor(gray).setTextAlignment(TextAlignment.RIGHT).setMarginBottom(6))
                    .add(new Paragraph("Policy No: " + policyNum).setFont(bold).setFontSize(8).setFontColor(navy).setTextAlignment(TextAlignment.RIGHT).setMarginBottom(2))
                    .add(new Paragraph("Date: " + issueDate).setFont(regular).setFontSize(8).setFontColor(gray).setTextAlignment(TextAlignment.RIGHT))
                    .setBorder(Border.NO_BORDER).setPadding(4));
            doc.add(headerTable);

            // Blue title bar
            doc.add(new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth()
                    .addCell(new Cell()
                            .add(new Paragraph("INSURANCE APPLICATION — MYANMAR (အာမခံ လျှောက်လွှာ — မြန်မာ)")
                                    .setFont(bold).setFontSize(10).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER))
                            .setBackgroundColor(blue).setPadding(6).setBorder(Border.NO_BORDER)));

            // Status banner
            DeviceRgb statusColor = "APPROVED".equals(statusStr) ? green : "REJECTED".equals(statusStr) ? red : amber;
            doc.add(new Paragraph("● STATUS: " + statusStr
                    + (app.getRiskLevel() != null ? "   |   Risk Level: " + app.getRiskLevel() : "")
                    + (app.getPolicyNumber() != null ? "   |   Policy No: " + policyNum : ""))
                    .setFont(bold).setFontSize(9).setFontColor(statusColor)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBackgroundColor(light).setPaddingTop(4).setPaddingBottom(4).setMarginBottom(8));

            // ── SECTION 1: APPLICANT INFORMATION ────────────────────────
            addContractSection(doc, bold, "SECTION 1: APPLICANT INFORMATION   (အပိုင်း ၁: လျှောက်ထားသူ သတင်းအချက်အလက်)", blue, bold);
            addMetaTable(doc, bold, regular, light, java.util.List.of(
                    entry("Full Name  (နာမည်အပြည့်)",        customer != null ? customer.getName() : "N/A"),
                    entry("Email Address  (အီးမေးလ်)",       customer != null ? customer.getEmail() : "N/A"),
                    entry("Phone  (ဖုန်းနံပါတ်)",            customer != null && customer.getPhone() != null ? customer.getPhone() : "N/A"),
                    entry("Address  (လိပ်စာ)",               customer != null && customer.getAddress() != null ? customer.getAddress() : "N/A"),
                    entry("Assigned Agent  (တာဝန်ခံ Agent)", agent != null ? agent.getName() + (agent.getEmail() != null ? " <" + agent.getEmail() + ">" : "") : "No agent assigned")
            ));

            // ── SECTION 2: INSURANCE PLAN DETAILS ───────────────────────
            addContractSection(doc, bold, "SECTION 2: INSURANCE PLAN DETAILS   (အပိုင်း ၂: အာမခံ Plan အသေးစိတ်)", blue, bold);
            addMetaTable(doc, bold, regular, light, java.util.List.of(
                    entry("Insurance Plan  (အာမခံ Plan)",         pkg != null ? pkg.getName() : "N/A"),
                    entry("Insurance Type  (အာမခံ အမျိုးအစား)",  pkg != null ? pkg.getType() : "N/A"),
                    entry("Coverage Amount  (အာမခံပမာဏ)",        app.getCoverageAmount() != null ? app.getCoverageAmount().toPlainString() + " MMK" : "N/A"),
                    entry("Total Premium  (စုစုပေါင်း Premium)",  app.getPremiumAmount() != null ? app.getPremiumAmount().toPlainString() + " MMK" : "N/A"),
                    entry("Policy Duration  (ကာလသတ်မှတ်)",       app.getDuration() != null ? app.getDuration() + " year(s)  (" + app.getDuration() * 12 + " months)" : "N/A"),
                    entry("Payment Frequency  (ပေးချေပုံစံ)",    pkg != null && pkg.getPaymentFrequency() != null ? formatFrequency(pkg.getPaymentFrequency()) : "N/A"),
                    entry("Max Claim Amount  (အများဆုံး Claim)",  pkg != null && pkg.getMaxClaimAmount() != null ? pkg.getMaxClaimAmount().toPlainString() + " MMK" : "N/A"),
                    entry("Risk Level  (အန္တရာယ်အဆင့်)",         app.getRiskLevel() != null ? app.getRiskLevel() : "N/A"),
                    entry("Application Date  (လျှောက်ထားသောနေ့)", app.getCreatedAt() != null ? app.getCreatedAt().format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm")) : "N/A"),
                    entry("Policy Number  (ပါလစီနံပါတ်)",        policyNum)
            ));

            // ── SECTION 3: APPLICATION FORM DATA ────────────────────────
            if (pkg != null) {
                Optional<FormTemplate> tmplOpt = templateRepo.findByInsurancePackageIdAndFormType(pkg.getId(), FormType.APPLICATION);
                if (tmplOpt.isPresent()) {
                    FormTemplate tmpl = tmplOpt.get();
                    addContractSection(doc, bold, "SECTION 3: APPLICATION FORM DETAILS   (အပိုင်း ၃: လျှောက်လွှာ ပုံစံ အချက်အလက်များ)", blue, bold);
                    addFormSection(doc, bold, regular, light, tmpl.getName(), tmpl.getFields(), app.getFormData());
                }
            }

            addDigitalSignatures(doc, bold, regular, light, blue,
                    extractCustomerSignature(app.getFormData()),
                    app.getAgentSignature(), app.getAdminSignature());

            // ── SECTION 4: NOTES & REMARKS ───────────────────────────────
            boolean hasNotes = (app.getNotes() != null && !app.getNotes().isBlank())
                    || (app.getAgentNote() != null && !app.getAgentNote().isBlank())
                    || (app.getAdminNote() != null && !app.getAdminNote().isBlank());
            if (hasNotes) {
                addContractSection(doc, bold, "SECTION 4: NOTES & REMARKS   (အပိုင်း ၄: မှတ်ချက်များ)", blue, bold);
                addNotesSection(doc, bold, regular, app.getNotes(), app.getAgentNote(), app.getAdminNote());
            }

            // ── FOOTER ───────────────────────────────────────────────────
            doc.add(new Paragraph(
                    "\nThis document was generated by the Digital Insurance Claims and Premiums Portal on " + issueDate +
                    ".\nApplication ID: #" + app.getId() + "  |  Status: " + statusStr +
                    "\nThis is a computer-generated document.")
                    .setFont(oblique).setFontSize(7.5f).setFontColor(gray)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBorderTop(new SolidBorder(light, 0.5f)).setPaddingTop(8).setMarginTop(12));

            doc.close();
            return pdfResponse(baos.toByteArray(), "application_" + app.getId() + ".pdf");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private ResponseEntity<byte[]> buildClaimPdf(Claim claim) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document doc = new Document(new PdfDocument(new PdfWriter(baos)));
            doc.setMargins(36, 40, 36, 40);

            PdfFont bold    = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont oblique = PdfFontFactory.createFont(StandardFonts.HELVETICA_OBLIQUE);

            DeviceRgb navy   = new DeviceRgb(15, 23, 42);
            DeviceRgb blue   = new DeviceRgb(29, 78, 175);
            DeviceRgb amber  = new DeviceRgb(217, 119, 6);
            DeviceRgb green  = new DeviceRgb(22, 163, 74);
            DeviceRgb red    = new DeviceRgb(220, 38, 38);
            DeviceRgb gray   = new DeviceRgb(71, 85, 105);
            DeviceRgb light  = new DeviceRgb(255, 251, 235);   // amber-50
            DeviceRgb lightB = new DeviceRgb(241, 245, 249);   // slate-100 for tables

            var customer = claim.getCustomer();
            var app      = claim.getApplication();
            var pkg      = app != null ? app.getInsurancePackage() : null;
            var agent    = claim.getAgent();
            String issueDate = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy"));
            String statusStr = claim.getStatus().name();

            // ── HEADER ──────────────────────────────────────────────────
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{70, 30})).useAllAvailableWidth();
            headerTable.addCell(new Cell()
                    .add(new Paragraph("DIGITAL INSURANCE CLAIMS AND PREMIUMS").setFont(bold).setFontSize(12).setFontColor(amber).setMarginBottom(2))
                    .add(new Paragraph("PORTAL — MYANMAR").setFont(bold).setFontSize(9).setFontColor(navy).setMarginBottom(3))
                    .add(new Paragraph("ဒစ်ဂျစ်တယ် အာမခံ တောင်းဆိုမှုနှင့် ကြေးငွေ ပေါ်တယ် — မြန်မာ").setFont(oblique).setFontSize(8).setFontColor(gray))
                    .setBorder(Border.NO_BORDER).setPadding(4));
            headerTable.addCell(new Cell()
                    .add(new Paragraph("INSURANCE CLAIM FORM").setFont(bold).setFontSize(10).setFontColor(amber).setTextAlignment(TextAlignment.RIGHT).setMarginBottom(3))
                    .add(new Paragraph("အာမခံ တောင်းဆိုမှု ပုံစံ").setFont(oblique).setFontSize(8).setFontColor(gray).setTextAlignment(TextAlignment.RIGHT).setMarginBottom(6))
                    .add(new Paragraph("Claim ID: #" + claim.getId()).setFont(bold).setFontSize(8).setFontColor(navy).setTextAlignment(TextAlignment.RIGHT).setMarginBottom(2))
                    .add(new Paragraph("Date: " + issueDate).setFont(regular).setFontSize(8).setFontColor(gray).setTextAlignment(TextAlignment.RIGHT))
                    .setBorder(Border.NO_BORDER).setPadding(4));
            doc.add(headerTable);

            // Amber title bar
            doc.add(new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth()
                    .addCell(new Cell()
                            .add(new Paragraph("INSURANCE CLAIM FORM — MYANMAR (အာမခံ တောင်းဆိုမှု ပုံစံ — မြန်မာ)")
                                    .setFont(bold).setFontSize(10).setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER))
                            .setBackgroundColor(amber).setPadding(6).setBorder(Border.NO_BORDER)));

            // Status banner
            DeviceRgb statusColor = "APPROVED".equals(statusStr) ? green : "REJECTED".equals(statusStr) ? red : amber;
            doc.add(new Paragraph("● STATUS: " + statusStr
                    + (claim.getClaimType() != null ? "   |   Type: " + claim.getClaimType() : "")
                    + (claim.getAmount() != null ? "   |   Amount: " + claim.getAmount().toPlainString() + " MMK" : ""))
                    .setFont(bold).setFontSize(9).setFontColor(statusColor)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBackgroundColor(lightB).setPaddingTop(4).setPaddingBottom(4).setMarginBottom(8));

            // ── SECTION 1: CLAIMANT INFORMATION ─────────────────────────
            addContractSection(doc, bold, "SECTION 1: CLAIMANT INFORMATION   (အပိုင်း ၁: တောင်းဆိုသူ သတင်းအချက်အလက်)", amber, bold);
            addMetaTable(doc, bold, regular, lightB, java.util.List.of(
                    entry("Full Name  (နာမည်အပြည့်)",        customer != null ? customer.getName() : "N/A"),
                    entry("Email Address  (အီးမေးလ်)",       customer != null ? customer.getEmail() : "N/A"),
                    entry("Phone  (ဖုန်းနံပါတ်)",            customer != null && customer.getPhone() != null ? customer.getPhone() : "N/A"),
                    entry("Address  (လိပ်စာ)",               customer != null && customer.getAddress() != null ? customer.getAddress() : "N/A"),
                    entry("Assigned Agent  (တာဝန်ခံ Agent)", agent != null ? agent.getName() + (agent.getEmail() != null ? " <" + agent.getEmail() + ">" : "") : "N/A")
            ));

            // ── SECTION 2: CLAIM DETAILS ─────────────────────────────────
            addContractSection(doc, bold, "SECTION 2: CLAIM DETAILS   (အပိုင်း ၂: တောင်းဆိုမှု အသေးစိတ်)", amber, bold);
            String policyNum = app != null && app.getPolicyNumber() != null ? app.getPolicyNumber() : "N/A";
            addMetaTable(doc, bold, regular, lightB, java.util.List.of(
                    entry("Claim ID  (တောင်းဆိုမှု ID)",         "#" + claim.getId()),
                    entry("Insurance Plan  (အာမခံ Plan)",          pkg != null ? pkg.getName() : "N/A"),
                    entry("Insurance Type  (အာမခံ အမျိုးအစား)",   pkg != null ? pkg.getType() : "N/A"),
                    entry("Policy Number  (ပါလစီနံပါတ်)",         policyNum),
                    entry("Claim Type  (တောင်းဆိုမှု အမျိုးအစား)", claim.getClaimType() != null ? claim.getClaimType() : "N/A"),
                    entry("Claim Amount  (တောင်းဆိုသောပမာဏ)",     claim.getAmount() != null ? claim.getAmount().toPlainString() + " MMK" : "N/A"),
                    entry("Incident Date  (ဖြစ်ပွားသောနေ့)",       claim.getIncidentDate() != null ? claim.getIncidentDate().toString() : "N/A"),
                    entry("Submitted Date  (တင်ပြသောနေ့)",        claim.getCreatedAt() != null ? claim.getCreatedAt().format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm")) : "N/A"),
                    entry("Status  (အခြေအနေ)",                    statusStr)
            ));

            // ── SECTION 3: CLAIM FORM DATA ───────────────────────────────
            if (pkg != null) {
                Optional<FormTemplate> tmplOpt = templateRepo.findByInsurancePackageIdAndFormType(pkg.getId(), FormType.CLAIM);
                if (tmplOpt.isPresent()) {
                    FormTemplate tmpl = tmplOpt.get();
                    addContractSection(doc, bold, "SECTION 3: CLAIM FORM DETAILS   (အပိုင်း ၃: တောင်းဆိုမှု ပုံစံ အချက်အလက်များ)", amber, bold);
                    addFormSection(doc, bold, regular, lightB, tmpl.getName(), tmpl.getFields(), claim.getFormData());
                }
            }

            // ── SECTION 4: DESCRIPTION ───────────────────────────────────
            if (claim.getDescription() != null && !claim.getDescription().isBlank()) {
                addContractSection(doc, bold, "SECTION 4: INCIDENT DESCRIPTION   (အပိုင်း ၄: ဖြစ်ရပ် ဖော်ပြချက်)", amber, bold);
                doc.add(new Paragraph(claim.getDescription()).setFont(regular).setFontSize(9.5f).setFontColor(gray).setMarginBottom(6));
            }

            addDigitalSignatures(doc, bold, regular, lightB, amber,
                    extractCustomerSignature(claim.getFormData()),
                    claim.getAgentSignature(), claim.getAdminSignature());

            // ── SECTION 5: NOTES & REMARKS ───────────────────────────────
            boolean hasNotes = (claim.getAgentNote() != null && !claim.getAgentNote().isBlank())
                    || (claim.getAdminNote() != null && !claim.getAdminNote().isBlank());
            if (hasNotes) {
                int secNum = (claim.getDescription() != null && !claim.getDescription().isBlank()) ? 5 : 4;
                addContractSection(doc, bold, "SECTION " + secNum + ": NOTES & REMARKS   (အပိုင်း " + secNum + ": မှတ်ချက်များ)", amber, bold);
                addNotesSection(doc, bold, regular, null, claim.getAgentNote(), claim.getAdminNote());
            }

            // ── FOOTER ───────────────────────────────────────────────────
            doc.add(new Paragraph(
                    "\nThis document was generated by the Digital Insurance Claims and Premiums Portal on " + issueDate +
                    ".\nClaim ID: #" + claim.getId() + "  |  Status: " + statusStr +
                    "\nThis is a computer-generated document.")
                    .setFont(oblique).setFontSize(7.5f).setFontColor(gray)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBorderTop(new SolidBorder(lightB, 0.5f)).setPaddingTop(8).setMarginTop(12));

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

    /**
     * Renders the three independently stored signatures in generated form PDFs.
     * The customer signature remains inside formData for backward compatibility;
     * agent/admin signatures are stored on the record itself.
     */
    private void addDigitalSignatures(Document doc, PdfFont boldFont, PdfFont regularFont,
                                      DeviceRgb background, DeviceRgb accent,
                                      String customerSignature, String agentSignature,
                                      String adminSignature) {
        if (customerSignature == null && agentSignature == null && adminSignature == null) return;

        addContractSection(doc, boldFont,
                "DIGITAL SIGNATURES   (ဒစ်ဂျစ်တယ် လက်မှတ်များ)", accent, boldFont);
        doc.add(new Paragraph(
                "Signatures captured for the customer submission, agent verification, and admin approval."
                        + "  (Customer / Agent / Admin လက်မှတ်များ)")
                .setFont(regularFont).setFontSize(8).setFontColor(new DeviceRgb(71, 85, 105))
                .setMarginBottom(6));

        Table table = new Table(UnitValue.createPercentArray(new float[]{33.33f, 33.33f, 33.34f}))
                .useAllAvailableWidth();
        table.addCell(signatureCell("CUSTOMER  (Customer)", customerSignature, boldFont, regularFont, background, accent));
        table.addCell(signatureCell("AGENT VERIFICATION  (Agent)", agentSignature, boldFont, regularFont, background, accent));
        table.addCell(signatureCell("ADMIN APPROVAL  (Admin)", adminSignature, boldFont, regularFont, background, accent));
        doc.add(table);
    }

    private Cell signatureCell(String label, String signature, PdfFont boldFont,
                               PdfFont regularFont, DeviceRgb background, DeviceRgb accent) {
        Cell cell = new Cell()
                .setBackgroundColor(background)
                .setBorder(new SolidBorder(accent, 0.8f))
                .setPadding(7);
        cell.add(new Paragraph(label).setFont(boldFont).setFontSize(8).setFontColor(accent)
                .setMarginBottom(5));
        Image image = signatureImage(signature);
        if (image != null) {
            image.scaleToFit(150, 78);
            cell.add(image);
            cell.add(new Paragraph("Digitally signed").setFont(regularFont).setFontSize(7)
                    .setFontColor(new DeviceRgb(22, 163, 74)).setMarginTop(3));
        } else {
            cell.add(new Paragraph("[ NOT SIGNED ]").setFont(boldFont).setFontSize(8)
                    .setFontColor(new DeviceRgb(100, 116, 139)).setMarginTop(25).setMarginBottom(25));
        }
        return cell;
    }

    @SuppressWarnings("unchecked")
    private String extractCustomerSignature(String formDataJson) {
        if (formDataJson == null || formDataJson.isBlank()) return null;
        try {
            Map<String, Object> data = MAPPER.readValue(formDataJson, Map.class);
            Object signature = data.get("__signature");
            return signature == null ? null : String.valueOf(signature);
        } catch (Exception ignored) {
            return null;
        }
    }

    private Image signatureImage(String signature) {
        if (signature == null || signature.isBlank()) return null;
        int comma = signature.indexOf(',');
        if (comma <= 0) return null;
        try {
            byte[] bytes = Base64.getDecoder().decode(signature.substring(comma + 1));
            return new Image(ImageDataFactory.create(bytes));
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private void addSignatureImage(Cell cell, String signature) {
        Image image = signatureImage(signature);
        if (image != null) {
            image.scaleToFit(180, 72);
            cell.add(image);
        }
    }

    @SuppressWarnings("unchecked")
    private void addFormSection(Document doc, PdfFont boldFont, PdfFont regularFont,
                                 DeviceRgb labelBg, String title, List<FormField> fields, String formDataJson) {
        if (fields == null || fields.isEmpty()) return;

        Map<String, Object> dataMap = new HashMap<>();
        if (formDataJson != null && !formDataJson.isBlank()) {
            try { dataMap = MAPPER.readValue(formDataJson, Map.class); } catch (Exception ignored) {}
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
                        List<String> selected = MAPPER.readValue(value, List.class);
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
