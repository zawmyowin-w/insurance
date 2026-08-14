package com.insurance.portal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.insurance.portal.model.Claim;
import com.insurance.portal.model.FormField;
import com.insurance.portal.model.FormTemplate;
import com.insurance.portal.model.PolicyApplication;
import com.insurance.portal.model.PolicyTransfer;
import com.insurance.portal.model.User;
import com.insurance.portal.model.enums.FieldType;
import com.insurance.portal.model.enums.FormType;
import com.insurance.portal.model.enums.Role;
import com.insurance.portal.model.enums.TransferStatus;
import com.insurance.portal.repository.ClaimRepository;
import com.insurance.portal.repository.FormTemplateRepository;
import com.insurance.portal.repository.PolicyApplicationRepository;
import com.insurance.portal.repository.PolicyTransferRepository;
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
import java.io.InputStream;
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
    private final PolicyTransferRepository transferRepo;
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

    // ── Transfer Contract PDF (admin) ─────────────────────────────────
    @GetMapping("/admin/policy-transfers/{id}/pdf")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> adminTransferPdf(@PathVariable Long id) {
        PolicyTransfer transfer = transferRepo.findById(id).orElseThrow();
        return buildTransferContractPdf(transfer);
    }

    // ── Transfer Contract PDF (customer) ──────────────────────────────
    @GetMapping("/customer/policy-transfers/{id}/pdf")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> customerTransferPdf(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User user = userRepo.findByEmail(principal.getUsername()).orElseThrow();
        PolicyTransfer transfer = transferRepo.findById(id).orElseThrow();
        boolean isSender   = transfer.getFromCustomer().getId().equals(user.getId());
        boolean isReceiver = transfer.getToCustomer().getId().equals(user.getId());
        if (!isSender && !isReceiver) return ResponseEntity.status(403).build();
        return buildTransferContractPdf(transfer);
    }

    // ── Payout Voucher PDF (admin) ─────────────────────────────────────
    @GetMapping("/admin/claims/{id}/payout-voucher")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> adminPayoutVoucher(@PathVariable Long id) {
        Claim claim = claimRepo.findById(id).orElseThrow();
        if (claim.getStatus() != com.insurance.portal.model.enums.ClaimStatus.APPROVED)
            return ResponseEntity.badRequest().build();
        return buildPayoutVoucherPdf(claim);
    }

    // ── Payout Voucher PDF (customer) ──────────────────────────────────
    @GetMapping("/customer/claims/{id}/payout-voucher")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> customerPayoutVoucher(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User customer = userRepo.findByEmail(principal.getUsername()).orElseThrow();
        Claim claim = claimRepo.findById(id).orElseThrow();
        if (!claim.getCustomer().getId().equals(customer.getId()))
            return ResponseEntity.status(403).build();
        if (claim.getStatus() != com.insurance.portal.model.enums.ClaimStatus.APPROVED)
            return ResponseEntity.badRequest().build();
        return buildPayoutVoucherPdf(claim);
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
             headerTable.addCell(brandHeaderCell(bold, oblique, blue, 13, 8));
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
            // SECTION 5: PREMIUM WAIVER BENEFIT STATUS (if applicable)
            // ─────────────────────────────────────────────────────────────
            if (pkg != null && pkg.isPremiumWaiverBenefit()) {
                DeviceRgb teal = new DeviceRgb(8, 145, 178);
                DeviceRgb tealLight = new DeviceRgb(224, 242, 254);
                addContractSection(doc, bold, "SECTION 5: PREMIUM WAIVER BENEFIT   (အပိုင်း ၅: Premium ကင်းလွတ်ခွင့် အကျိုးခံစားခွင့်)", teal, bold);
                String emergStatus = app.getEmergencyStatus() != null ? app.getEmergencyStatus().name() : "NONE";
                String waiverInfo = switch (emergStatus) {
                    case "APPROVED" -> "APPROVED — All remaining premium installments have been waived. "
                            + "Policy will mature normally. Waiver granted: "
                            + (app.getWaiverGrantedAt() != null ? app.getWaiverGrantedAt().format(dtFmt) : "N/A");
                    case "PENDING"  -> "PENDING — Emergency declaration submitted, awaiting admin review.";
                    case "REJECTED" -> "REJECTED — Emergency declaration was reviewed and not approved.";
                    default         -> "NOT ACTIVATED — No emergency declaration submitted.";
                };
                addMetaTable(doc, bold, regular, tealLight, java.util.List.of(
                        entry("Benefit Status  (အကျိုးခံစားခွင့် အခြေအနေ)", "ENABLED (ဖွင့်ထားသည်)"),
                        entry("Emergency Status  (အရေးပေါ် အခြေအနေ)",      waiverInfo),
                        entry("Policy Number  (ပါလစီနံပါတ်)",               policyNum),
                        entry("Waiver Note  (ကင်းလွတ်ခွင့် မှတ်ချက်)",
                              "APPROVED".equals(emergStatus)
                                  ? "Premium installments after waiver grant date are exempt from payment. "
                                    + "Policy contract remains valid until original maturity date."
                                  : "This policy package includes Premium Waiver Benefit. "
                                    + "In the event of the payer's death, submit an emergency declaration via your portal.")
                ));
            }

            // ─────────────────────────────────────────────────────────────
            // SECTION 6: BENEFITS AND COVERAGE
            // ─────────────────────────────────────────────────────────────
            if (pkg != null) {
                addContractSection(doc, bold, "SECTION 6: BENEFITS AND COVERAGE   (အပိုင်း ၆: အကျိုးခံစားခွင့်နှင့် Coverage)", blue, bold);
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
             headerTable.addCell(brandHeaderCell(bold, oblique, blue, 12, 8));
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
             headerTable.addCell(brandHeaderCell(bold, oblique, amber, 12, 8));
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
     * Shared PDF brand block. The logo is bundled with the backend so every
     * generated/downloaded PDF carries the same branding as the web portal.
     */
    private Cell brandHeaderCell(PdfFont boldFont, PdfFont obliqueFont, DeviceRgb accent,
                                 float titleSize, float myanmarSize) {
        Table brand = new Table(UnitValue.createPercentArray(new float[]{16, 84}))
                .useAllAvailableWidth();

        Cell logoCell = new Cell().setBorder(Border.NO_BORDER).setPadding(0);
        Image logo = pdfLogo();
        if (logo != null) {
            logo.scaleToFit(32, 32);
            logoCell.add(logo);
        }
        brand.addCell(logoCell);

        Cell textCell = new Cell().setBorder(Border.NO_BORDER).setPadding(0).setPaddingLeft(4);
        textCell.add(new Paragraph("DIGITAL INSURANCE CLAIMS AND PREMIUMS")
                .setFont(boldFont).setFontSize(titleSize).setFontColor(accent).setMarginBottom(2));
        textCell.add(new Paragraph("PORTAL — MYANMAR")
                .setFont(boldFont).setFontSize(9)
                .setFontColor(new DeviceRgb(15, 23, 42)).setMarginBottom(3));
        textCell.add(new Paragraph("ဒစ်ဂျစ်တယ် အာမခံ တောင်းဆိုမှုနှင့် ကြေးငွေ ပေါ်တယ် — မြန်မာ")
                .setFont(obliqueFont).setFontSize(myanmarSize)
                .setFontColor(new DeviceRgb(71, 85, 105)));
        brand.addCell(textCell);

        return new Cell().add(brand).setBorder(Border.NO_BORDER).setPadding(4);
    }

    private Image pdfLogo() {
        try (InputStream input = PdfController.class.getResourceAsStream("/logo-transparent.png")) {
            if (input == null) return null;
            return new Image(ImageDataFactory.create(input.readAllBytes()));
        } catch (Exception ignored) {
            return null;
        }
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

    // ── Transfer Contract PDF builder ──────────────────────────────────
    private ResponseEntity<byte[]> buildTransferContractPdf(PolicyTransfer transfer) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf);
            doc.setMargins(36, 44, 36, 44);

            PdfFont bold    = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont oblique = PdfFontFactory.createFont(StandardFonts.HELVETICA_OBLIQUE);

            DeviceRgb navy      = new DeviceRgb(15, 23, 42);
            DeviceRgb blue      = new DeviceRgb(29, 78, 175);
            DeviceRgb blueLight = new DeviceRgb(239, 246, 255);
            DeviceRgb green     = new DeviceRgb(22, 163, 74);
            DeviceRgb gray      = new DeviceRgb(71, 85, 105);
            DeviceRgb light     = new DeviceRgb(241, 245, 249);
            DeviceRgb amber     = new DeviceRgb(217, 119, 6);
            DeviceRgb red       = new DeviceRgb(220, 38, 38);

            PolicyApplication app = transfer.getApplication();
            User from = transfer.getFromCustomer();
            User to   = transfer.getToCustomer();

            java.time.format.DateTimeFormatter dateFmt = java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy");
            java.time.format.DateTimeFormatter dtFmt   = java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm");
            String issueDate = java.time.LocalDate.now().format(dateFmt);
            String policyNum = app != null && app.getPolicyNumber() != null ? app.getPolicyNumber() : (app != null ? "APP-" + app.getId() : "N/A");
            String contractRef = String.format("TRANSFER-%05d-%s", transfer.getId(),
                    java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")));

            // Determine status label
            String statusStr;
            DeviceRgb statusColor;
            switch (transfer.getStatus()) {
                case APPROVED -> { statusStr = "APPROVED";  statusColor = green; }
                case REJECTED -> { statusStr = "REJECTED";  statusColor = red; }
                case PENDING_ADMIN_APPROVAL -> { statusStr = "PENDING ADMIN APPROVAL"; statusColor = blue; }
                default -> { statusStr = "PENDING TRANSFEREE SIGNATURE"; statusColor = amber; }
            }

            // ── HEADER ─────────────────────────────────────────────────────
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{65, 35})).useAllAvailableWidth();
             headerTable.addCell(brandHeaderCell(bold, oblique, blue, 11, 8));
            headerTable.addCell(new Cell()
                    .add(new Paragraph("POLICY OWNERSHIP TRANSFER CONTRACT")
                            .setFont(bold).setFontSize(10).setFontColor(blue)
                            .setTextAlignment(TextAlignment.RIGHT).setMarginBottom(2))
                    .add(new Paragraph("အာမခံပိုင်ရှင်လွှဲပြောင်းခြင်း စာချုပ်")
                            .setFont(oblique).setFontSize(8).setFontColor(gray)
                            .setTextAlignment(TextAlignment.RIGHT).setMarginBottom(4))
                    .add(new Paragraph("Ref: " + contractRef)
                            .setFont(bold).setFontSize(8).setFontColor(navy)
                            .setTextAlignment(TextAlignment.RIGHT).setMarginBottom(2))
                    .add(new Paragraph("Issued: " + issueDate)
                            .setFont(regular).setFontSize(8).setFontColor(gray)
                            .setTextAlignment(TextAlignment.RIGHT))
                    .setBorder(Border.NO_BORDER).setPadding(4));
            doc.add(headerTable);
            doc.add(new LineSeparator(new SolidLine(1f)).setMarginBottom(8));

            // Status badge
            doc.add(new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth()
                    .addCell(new Cell()
                            .add(new Paragraph("CONTRACT STATUS: " + statusStr)
                                    .setFont(bold).setFontSize(10).setFontColor(statusColor)
                                    .setTextAlignment(TextAlignment.CENTER))
                            .setBackgroundColor(light)
                            .setBorder(new SolidBorder(statusColor, 1.5f))
                            .setPadding(6).setMarginBottom(12)));

            // ── SECTION 1: Policy Details ───────────────────────────────────
            doc.add(new Paragraph("SECTION 1: POLICY INFORMATION   (အပိုင်း ၁: ပါလစီ အချက်အလက်)")
                    .setFont(bold).setFontSize(9.5f).setFontColor(blue)
                    .setBackgroundColor(blueLight).setPadding(5).setMarginBottom(5));

            Table policyTable = new Table(UnitValue.createPercentArray(new float[]{35, 65})).useAllAvailableWidth();
            policyTable.addCell(labelCell("Policy Number", bold, gray, light));
            policyTable.addCell(valueCell(policyNum, regular, navy));
            policyTable.addCell(labelCell("Insurance Package", bold, gray, light));
            policyTable.addCell(valueCell(app != null && app.getInsurancePackage() != null
                    ? app.getInsurancePackage().getName() + " (" + app.getInsurancePackage().getType() + ")" : "N/A", regular, navy));
            policyTable.addCell(labelCell("Coverage Amount", bold, gray, light));
            policyTable.addCell(valueCell(app != null && app.getCoverageAmount() != null
                    ? "MMK " + String.format("%,.2f", app.getCoverageAmount()) : "N/A", regular, navy));
            policyTable.addCell(labelCell("Duration", bold, gray, light));
            policyTable.addCell(valueCell(app != null && app.getDuration() != null
                    ? app.getDuration() + " Year(s)" : "N/A", regular, navy));
            doc.add(policyTable.setMarginBottom(12));

            // ── SECTION 2: Parties ─────────────────────────────────────────
            doc.add(new Paragraph("SECTION 2: TRANSFER PARTIES   (အပိုင်း ၂: လွှဲပြောင်းသူနှင့် လက်ခံသူ)")
                    .setFont(bold).setFontSize(9.5f).setFontColor(blue)
                    .setBackgroundColor(blueLight).setPadding(5).setMarginBottom(5));

            Table partiesTable = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();

            // FROM column
            Table fromTable = new Table(UnitValue.createPercentArray(new float[]{40, 60})).useAllAvailableWidth();
            fromTable.addCell(new Cell(1,2).add(new Paragraph("TRANSFEROR (Current Owner) — လွှဲပြောင်းသူ")
                    .setFont(bold).setFontSize(9).setFontColor(blue)).setBorder(Border.NO_BORDER).setPaddingBottom(3));
            fromTable.addCell(labelCell("Name", bold, gray, light));
            fromTable.addCell(valueCell(from != null ? from.getName() : "N/A", regular, navy));
            fromTable.addCell(labelCell("Email", bold, gray, light));
            fromTable.addCell(valueCell(from != null ? from.getEmail() : "N/A", regular, navy));
            fromTable.addCell(labelCell("Phone", bold, gray, light));
            fromTable.addCell(valueCell(from != null && from.getPhone() != null ? from.getPhone() : "—", regular, navy));

            // TO column
            Table toTable = new Table(UnitValue.createPercentArray(new float[]{40, 60})).useAllAvailableWidth();
            toTable.addCell(new Cell(1,2).add(new Paragraph("TRANSFEREE (New Owner) — လက်ခံသူ")
                    .setFont(bold).setFontSize(9).setFontColor(green)).setBorder(Border.NO_BORDER).setPaddingBottom(3));
            toTable.addCell(labelCell("Name", bold, gray, light));
            toTable.addCell(valueCell(to != null ? to.getName() : "N/A", regular, navy));
            toTable.addCell(labelCell("Email", bold, gray, light));
            toTable.addCell(valueCell(to != null ? to.getEmail() : "N/A", regular, navy));
            toTable.addCell(labelCell("Phone", bold, gray, light));
            toTable.addCell(valueCell(to != null && to.getPhone() != null ? to.getPhone() : "—", regular, navy));

            partiesTable.addCell(new Cell().add(fromTable).setBorder(new SolidBorder(light, 0.5f)).setPadding(6));
            partiesTable.addCell(new Cell().add(toTable).setBorder(new SolidBorder(light, 0.5f)).setPadding(6));
            doc.add(partiesTable.setMarginBottom(12));

            // ── SECTION 3: Transfer Details ────────────────────────────────
            doc.add(new Paragraph("SECTION 3: TRANSFER DETAILS   (အပိုင်း ၃: လွှဲပြောင်းမှု အသေးစိတ်)")
                    .setFont(bold).setFontSize(9.5f).setFontColor(blue)
                    .setBackgroundColor(blueLight).setPadding(5).setMarginBottom(5));

            Table detailsTable = new Table(UnitValue.createPercentArray(new float[]{35, 65})).useAllAvailableWidth();
            detailsTable.addCell(labelCell("Relationship", bold, gray, light));
            detailsTable.addCell(valueCell(transfer.getRelationship(), regular, navy));
            detailsTable.addCell(labelCell("Reason for Transfer", bold, gray, light));
            detailsTable.addCell(valueCell(transfer.getReason(), regular, navy));
            detailsTable.addCell(labelCell("Transfer Requested", bold, gray, light));
            detailsTable.addCell(valueCell(transfer.getCreatedAt() != null
                    ? transfer.getCreatedAt().format(dtFmt) : "—", regular, navy));
            if (transfer.getApprovedAt() != null) {
                detailsTable.addCell(labelCell("Admin Decision", bold, gray, light));
                detailsTable.addCell(valueCell(transfer.getApprovedAt().format(dtFmt)
                        + (transfer.getApprovedBy() != null ? " by " + transfer.getApprovedBy().getName() : ""), regular, navy));
            }
            if (transfer.getAdminNote() != null && !transfer.getAdminNote().isBlank()) {
                detailsTable.addCell(labelCell("Admin Note", bold, gray, light));
                detailsTable.addCell(valueCell(transfer.getAdminNote(), regular, navy));
            }
            doc.add(detailsTable.setMarginBottom(12));

            // ── SECTION 4: Legal Terms ─────────────────────────────────────
            doc.add(new Paragraph("SECTION 4: TERMS & CONDITIONS   (အပိုင်း ၄: စည်းကမ်းချက်များ)")
                    .setFont(bold).setFontSize(9.5f).setFontColor(blue)
                    .setBackgroundColor(blueLight).setPadding(5).setMarginBottom(5));

            String terms =
                    "1. Upon admin approval of this transfer, all ownership rights and obligations under policy " + policyNum +
                    " are permanently transferred to the Transferee named above.\n" +
                    "   ဤလွှဲပြောင်းမှုကို Admin အတည်ပြုသည်နှင့်တပြိုင်နက် ပါလစီ " + policyNum + " ၏ ပိုင်ဆိုင်ခွင့်နှင့် တာဝန်များ အားလုံး လက်ခံသူထံ အပြီးတိုင် ရောက်ရှိသွားမည်ဖြစ်သည်။\n\n" +
                    "2. The Transferor permanently relinquishes all rights to submit claims, receive payouts, or make decisions\n" +
                    "   regarding the above policy upon approval.\n" +
                    "   လွှဲပြောင်းသူသည် ထို ပါလစီနှင့်ပတ်သက်၍ တောင်းဆိုခွင့်၊ ငွေထုတ်ခွင့် နှင့် ဆုံးဖြတ်ပိုင်ခွင့်များကို အပြီးတိုင် စွန့်လွှတ်ပါသည်။\n\n" +
                    "3. The Transferee assumes full responsibility for all remaining premium payment installments.\n" +
                    "   လက်ခံသူသည် ကျန်ရှိသော ပရီမီယမ် ငွေပေးချေမှု အကြိမ်အားလုံးကို ဆက်ခံ တာဝန်ယူမည်ဖြစ်သည်။\n\n" +
                    "4. This contract is legally binding once signed by both parties and approved by the authorized administrator.\n" +
                    "   ဤစာချုပ်သည် နှစ်ဦးနှစ်ဖက် လက်မှတ်ထိုး၍ တာဝန်ရှိသော Admin က အတည်ပြုပြီးသည်နှင့် တရားဝင် အကျုံးဝင်မည်ဖြစ်သည်။";
            doc.add(new Paragraph(terms).setFont(regular).setFontSize(8.5f).setFontColor(gray).setMarginBottom(12));

            // ── SECTION 5: Signatures ──────────────────────────────────────
            doc.add(new Paragraph("SECTION 5: DIGITAL SIGNATURES   (အပိုင်း ၅: ဒစ်ဂျစ်တယ် လက်မှတ်များ)")
                    .setFont(bold).setFontSize(9.5f).setFontColor(blue)
                    .setBackgroundColor(blueLight).setPadding(5).setMarginBottom(8));

            Table sigTable = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();

            // FROM signature
            Cell fromSigCell = new Cell().setBorder(new SolidBorder(light, 0.5f)).setPadding(8);
            fromSigCell.add(new Paragraph("TRANSFEROR SIGNATURE — လွှဲပြောင်းသူ လက်မှတ်")
                    .setFont(bold).setFontSize(8.5f).setFontColor(blue).setMarginBottom(4));
            fromSigCell.add(new Paragraph(from != null ? from.getName() : "N/A").setFont(bold).setFontSize(9).setFontColor(navy));
            fromSigCell.add(new Paragraph(from != null ? from.getEmail() : "").setFont(regular).setFontSize(8).setFontColor(gray).setMarginBottom(4));
            if (transfer.getFromSignature() != null && !transfer.getFromSignature().isBlank()) {
                try {
                    int comma = transfer.getFromSignature().indexOf(',');
                    if (comma > 0) {
                        byte[] imgBytes = java.util.Base64.getDecoder().decode(transfer.getFromSignature().substring(comma + 1));
                        Image sigImg = new Image(ImageDataFactory.create(imgBytes)).setWidth(160).setHeight(60);
                        fromSigCell.add(sigImg);
                    }
                } catch (Exception ignored) {}
                fromSigCell.add(new Paragraph("Signed: " + (transfer.getFromSignedAt() != null
                        ? transfer.getFromSignedAt().format(dtFmt) : "—"))
                        .setFont(oblique).setFontSize(8).setFontColor(green).setMarginTop(2));
            } else {
                fromSigCell.add(new Paragraph("Not yet signed").setFont(oblique).setFontSize(9).setFontColor(amber));
            }
            sigTable.addCell(fromSigCell);

            // TO signature
            Cell toSigCell = new Cell().setBorder(new SolidBorder(light, 0.5f)).setPadding(8);
            toSigCell.add(new Paragraph("TRANSFEREE SIGNATURE — လက်ခံသူ လက်မှတ်")
                    .setFont(bold).setFontSize(8.5f).setFontColor(green).setMarginBottom(4));
            toSigCell.add(new Paragraph(to != null ? to.getName() : "N/A").setFont(bold).setFontSize(9).setFontColor(navy));
            toSigCell.add(new Paragraph(to != null ? to.getEmail() : "").setFont(regular).setFontSize(8).setFontColor(gray).setMarginBottom(4));
            if (transfer.getToSignature() != null && !transfer.getToSignature().isBlank()) {
                try {
                    int comma = transfer.getToSignature().indexOf(',');
                    if (comma > 0) {
                        byte[] imgBytes = java.util.Base64.getDecoder().decode(transfer.getToSignature().substring(comma + 1));
                        Image sigImg = new Image(ImageDataFactory.create(imgBytes)).setWidth(160).setHeight(60);
                        toSigCell.add(sigImg);
                    }
                } catch (Exception ignored) {}
                toSigCell.add(new Paragraph("Signed: " + (transfer.getToSignedAt() != null
                        ? transfer.getToSignedAt().format(dtFmt) : "—"))
                        .setFont(oblique).setFontSize(8).setFontColor(green).setMarginTop(2));
            } else {
                toSigCell.add(new Paragraph("Not yet signed").setFont(oblique).setFontSize(9).setFontColor(amber));
            }
            sigTable.addCell(toSigCell);
            doc.add(sigTable.setMarginBottom(12));

            // ── FOOTER ─────────────────────────────────────────────────────
            doc.add(new Paragraph(
                    "\nThis policy ownership transfer contract was generated by the Digital Insurance Claims and Premiums Portal on " + issueDate +
                    ".\nContract Ref: " + contractRef + "  |  Transfer ID: #" + transfer.getId() +
                    "  |  Policy: " + policyNum + "  |  Status: " + statusStr +
                    "\nThis is an official computer-generated document. Verified by DICP Portal.")
                    .setFont(oblique).setFontSize(7.5f).setFontColor(gray)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBorderTop(new SolidBorder(light, 0.5f)).setPaddingTop(8).setMarginTop(8));

            doc.close();
            return pdfResponse(baos.toByteArray(), "transfer_contract_" + transfer.getId() + ".pdf");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private Cell labelCell(String text, PdfFont font, DeviceRgb color, DeviceRgb bg) {
        return new Cell().add(new Paragraph(text).setFont(font).setFontSize(8.5f).setFontColor(color))
                .setBackgroundColor(bg).setPadding(4).setBorder(new SolidBorder(bg, 0.3f));
    }

    private Cell valueCell(String text, PdfFont font, DeviceRgb color) {
        return new Cell().add(new Paragraph(text != null ? text : "—").setFont(font).setFontSize(9f).setFontColor(color))
                .setPadding(4).setBorder(new SolidBorder(new DeviceRgb(241, 245, 249), 0.3f));
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

    // ── Payout Voucher PDF builder ─────────────────────────────────────
    private ResponseEntity<byte[]> buildPayoutVoucherPdf(Claim claim) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf);
            doc.setMargins(36, 44, 36, 44);

            PdfFont bold    = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont oblique = PdfFontFactory.createFont(StandardFonts.HELVETICA_OBLIQUE);

            DeviceRgb navy        = new DeviceRgb(15, 23, 42);
            DeviceRgb green       = new DeviceRgb(22, 163, 74);
            DeviceRgb greenDark   = new DeviceRgb(14, 116, 52);
            DeviceRgb greenLight  = new DeviceRgb(240, 253, 244);
            DeviceRgb greenBorder = new DeviceRgb(134, 239, 172);
            DeviceRgb gray        = new DeviceRgb(71, 85, 105);
            DeviceRgb lightSlate  = new DeviceRgb(241, 245, 249);
            DeviceRgb blue        = new DeviceRgb(29, 78, 175);
            DeviceRgb red         = new DeviceRgb(220, 38, 38);

            var customer = claim.getCustomer();
            var app      = claim.getApplication();
            var pkg      = app != null ? app.getInsurancePackage() : null;

            java.time.format.DateTimeFormatter dtFmt = java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm");
            java.time.format.DateTimeFormatter dateFmt = java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy");
            String issueDate = java.time.LocalDate.now().format(dateFmt);
            String policyNum = app != null && app.getPolicyNumber() != null ? app.getPolicyNumber() : "N/A";
            String voucherRef = String.format("VOUCHER-%05d-%s", claim.getId(),
                    java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")));
            String approvedDateStr = claim.getUpdatedAt() != null ? claim.getUpdatedAt().format(dtFmt) : issueDate;

            // ── HEADER ───────────────────────────────────────────────────
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{65, 35})).useAllAvailableWidth();
             headerTable.addCell(brandHeaderCell(bold, oblique, green, 11, 8));
            headerTable.addCell(new Cell()
                    .add(new Paragraph("CLAIM PAYOUT VOUCHER").setFont(bold).setFontSize(11).setFontColor(green).setTextAlignment(TextAlignment.RIGHT).setMarginBottom(2))
                    .add(new Paragraph("လျော်ကြေး ငွေထုတ်ရန် ပြေစာ").setFont(oblique).setFontSize(8.5f).setFontColor(gray).setTextAlignment(TextAlignment.RIGHT).setMarginBottom(4))
                    .add(new Paragraph("Voucher: " + voucherRef).setFont(bold).setFontSize(8).setFontColor(navy).setTextAlignment(TextAlignment.RIGHT).setMarginBottom(2))
                    .add(new Paragraph("Issued: " + issueDate).setFont(regular).setFontSize(8).setFontColor(gray).setTextAlignment(TextAlignment.RIGHT))
                    .setBorder(Border.NO_BORDER).setPadding(4));
            doc.add(headerTable);

            // Green title bar
            doc.add(new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth()
                    .addCell(new Cell()
                            .add(new Paragraph("CLAIM PAYOUT VOUCHER — MYANMAR (လျော်ကြေး ငွေထုတ်ရန် ပြေစာ — မြန်မာ)")
                                    .setFont(bold).setFontSize(11).setFontColor(ColorConstants.WHITE)
                                    .setTextAlignment(TextAlignment.CENTER))
                            .setBackgroundColor(green).setPadding(7).setBorder(Border.NO_BORDER)));

            // APPROVED banner
            doc.add(new Paragraph("✓ CLAIM APPROVED — PAYOUT AUTHORISED   (တောင်းဆိုမှု အတည်ပြုပြီး — ငွေထုတ်ပေးရန် ခွင့်ပြုပြီး)")
                    .setFont(bold).setFontSize(9.5f).setFontColor(greenDark)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBackgroundColor(greenLight)
                    .setPaddingTop(5).setPaddingBottom(5).setMarginBottom(12));

            // ── PAYOUT AMOUNT BOX ──────────────────────────────────────
            Table amountBox = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth();
            String amountStr = claim.getAmount() != null
                    ? String.format("%,.0f MMK", claim.getAmount().doubleValue())
                    : "N/A";
            amountBox.addCell(new Cell()
                    .add(new Paragraph("AUTHORISED PAYOUT AMOUNT  (ခွင့်ပြုသော လျော်ကြေးပမာဏ)").setFont(bold).setFontSize(9).setFontColor(greenDark).setMarginBottom(4).setTextAlignment(TextAlignment.CENTER))
                    .add(new Paragraph(amountStr).setFont(bold).setFontSize(26).setFontColor(green).setTextAlignment(TextAlignment.CENTER).setMarginBottom(4))
                    .add(new Paragraph("Claim ID: #" + claim.getId() + "   |   Policy No: " + policyNum + "   |   Type: " + (claim.getClaimType() != null ? claim.getClaimType() : "N/A")).setFont(regular).setFontSize(8).setFontColor(gray).setTextAlignment(TextAlignment.CENTER))
                    .setBackgroundColor(greenLight).setBorder(new SolidBorder(greenBorder, 2)).setPadding(14).setMarginBottom(14));
            doc.add(amountBox);

            // ── SECTION 1: RECIPIENT INFORMATION ─────────────────────────
            doc.add(new Paragraph("SECTION 1: RECIPIENT INFORMATION   (အပိုင်း ၁: ငွေလက်ခံသူ သတင်းအချက်အလက်)")
                    .setFont(bold).setFontSize(9.5f).setFontColor(green)
                    .setBackgroundColor(lightSlate).setPadding(5).setMarginTop(4).setMarginBottom(5));
            addMetaTable(doc, bold, regular, lightSlate, java.util.List.of(
                    entry("Full Name  (နာမည်အပြည့်)",        customer != null ? customer.getName() : "N/A"),
                    entry("Email Address  (အီးမေးလ်)",       customer != null ? customer.getEmail() : "N/A"),
                    entry("Phone  (ဖုန်းနံပါတ်)",            customer != null && customer.getPhone() != null ? customer.getPhone() : "N/A"),
                    entry("Address  (လိပ်စာ)",               customer != null && customer.getAddress() != null ? customer.getAddress() : "N/A"),
                    entry("Claim ID  (တောင်းဆိုမှု ID)",     "#" + claim.getId())
            ));

            // ── SECTION 2: POLICY & CLAIM DETAILS ────────────────────────
            doc.add(new Paragraph("SECTION 2: POLICY & CLAIM DETAILS   (အပိုင်း ၂: ပါလစီနှင့် တောင်းဆိုမှု အသေးစိတ်)")
                    .setFont(bold).setFontSize(9.5f).setFontColor(green)
                    .setBackgroundColor(lightSlate).setPadding(5).setMarginTop(8).setMarginBottom(5));
            addMetaTable(doc, bold, regular, lightSlate, java.util.List.of(
                    entry("Policy Number  (ပါလစီနံပါတ်)",          policyNum),
                    entry("Insurance Plan  (အာမခံ Plan)",           pkg != null ? pkg.getName() : "N/A"),
                    entry("Insurance Type  (အာမခံ အမျိုးအစား)",    pkg != null ? pkg.getType() : "N/A"),
                    entry("Claim ID  (တောင်းဆိုမှု ID)",            "#" + claim.getId()),
                    entry("Claim Type  (တောင်းဆိုမှု အမျိုးအစား)",  claim.getClaimType() != null ? claim.getClaimType() : "N/A"),
                    entry("Incident Date  (ဖြစ်ပွားသောနေ့)",        claim.getIncidentDate() != null ? claim.getIncidentDate().format(dateFmt) : "N/A"),
                    entry("Claim Submitted  (တောင်းဆိုမှု တင်ပြသောနေ့)", claim.getCreatedAt() != null ? claim.getCreatedAt().format(dtFmt) : "N/A"),
                    entry("Approved On  (အတည်ပြုသောနေ့)",           approvedDateStr),
                    entry("Voucher Reference  (ပြေစာ ကိုးကားနံပါတ်)", voucherRef)
            ));

            // ── SECTION 3: ADMIN APPROVAL ─────────────────────────────────
            doc.add(new Paragraph("SECTION 3: APPROVAL AUTHORITY   (အပိုင်း ၃: ခွင့်ပြုချက် ပေးသူ)")
                    .setFont(bold).setFontSize(9.5f).setFontColor(green)
                    .setBackgroundColor(lightSlate).setPadding(5).setMarginTop(8).setMarginBottom(5));
            // Resolve the admin who approved (adminSignedAt / use claim updatedAt)
            String adminNote = claim.getAdminNote() != null && !claim.getAdminNote().isBlank() ? claim.getAdminNote() : "—";
            addMetaTable(doc, bold, regular, lightSlate, java.util.List.of(
                    entry("Approved By  (ခွင့်ပြုသူ)",        "Insurance Portal Administrator"),
                    entry("Organisation  (အဖွဲ့အစည်း)",       "Digital Insurance Claims and Premiums Portal — Myanmar"),
                    entry("Approval Date  (ခွင့်ပြုသောနေ့)",   approvedDateStr),
                    entry("Admin Remarks  (Admin မှတ်ချက်)",   adminNote)
            ));

            // Admin signature
            if (claim.getAdminSignature() != null) {
                doc.add(new Paragraph("").setMarginTop(8));
                Table sigBox = new Table(UnitValue.createPercentArray(new float[]{55, 45})).useAllAvailableWidth();
                Cell sigCell = new Cell()
                        .add(new Paragraph("AUTHORISING SIGNATURE  (ခွင့်ပြုလက်မှတ်)").setFont(bold).setFontSize(9).setFontColor(blue).setMarginBottom(8))
                        .add(new Paragraph("[ DIGITALLY APPROVED ]").setFont(bold).setFontSize(10).setFontColor(green)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setBackgroundColor(new DeviceRgb(239, 246, 255))
                                .setPadding(6).setBorder(new SolidBorder(blue, 0.8f)).setMarginBottom(4))
                        .setBackgroundColor(new DeviceRgb(239, 246, 255))
                        .setBorder(new SolidBorder(blue, 1)).setPadding(10);
                addSignatureImage(sigCell, claim.getAdminSignature());
                sigBox.addCell(sigCell);
                sigBox.addCell(new Cell()
                        .add(new Paragraph("Voucher Ref:").setFont(bold).setFontSize(8).setFontColor(gray))
                        .add(new Paragraph(voucherRef).setFont(regular).setFontSize(8).setFontColor(navy).setMarginBottom(6))
                        .add(new Paragraph("Claim ID:").setFont(bold).setFontSize(8).setFontColor(gray))
                        .add(new Paragraph("#" + claim.getId()).setFont(regular).setFontSize(8).setFontColor(navy).setMarginBottom(6))
                        .add(new Paragraph("Policy No:").setFont(bold).setFontSize(8).setFontColor(gray))
                        .add(new Paragraph(policyNum).setFont(regular).setFontSize(8).setFontColor(navy).setMarginBottom(6))
                        .add(new Paragraph("Issued:").setFont(bold).setFontSize(8).setFontColor(gray))
                        .add(new Paragraph(issueDate).setFont(regular).setFontSize(8).setFontColor(navy))
                        .setBorder(Border.NO_BORDER).setPaddingLeft(12));
                doc.add(sigBox);
            }

            // ── SECTION 4: COLLECTION INSTRUCTIONS ───────────────────────
            doc.add(new Paragraph("SECTION 4: COLLECTION INSTRUCTIONS   (အပိုင်း ၄: ငွေထုတ်ရန် လမ်းညွှန်ချက်)")
                    .setFont(bold).setFontSize(9.5f).setFontColor(green)
                    .setBackgroundColor(lightSlate).setPadding(5).setMarginTop(10).setMarginBottom(5));
            String instructions =
                    "1. Present this original voucher (printed or digital) together with a valid government-issued photo ID (NRC or Passport) " +
                    "at the designated insurance office during working hours (Mon–Fri, 9:00 AM – 5:00 PM).\n" +
                    "   ဤပြေစာ (ပုံနှိပ်ထားသော သို့မဟုတ် ဒစ်ဂျစ်တယ်) နှင့် အစိုးရထုတ် မှတ်ပုံတင် (NRC သို့မဟုတ် နိုင်ငံကူးလက်မှတ်) ကို " +
                    "ရုံးချိန်အတွင်း (တနင်္လာ–သောကြာ၊ နံနက် ၉:၀၀ – ညနေ ၅:၀၀) တင်ပြပါ။\n\n" +
                    "2. This voucher is valid for 30 days from the issue date. Expired vouchers require admin reissuance.\n" +
                    "   ဤပြေစာသည် ထုတ်ပေးသောနေ့မှ ရက် ၃၀ အတွင်း သာ သက်ဆိုင်ပါသည်။ သက်တမ်းကျော်ပါက Admin မှ ပြန်လည်ထုတ်ပေးရမည်။\n\n" +
                    "3. The payout will be made in Myanmar Kyat (MMK) via the method agreed upon during the claims process.\n" +
                    "   လျော်ကြေးငွေကို တောင်းဆိုမှုလုပ်ငန်းစဉ်တွင် သဘောတူထားသော နည်းလမ်းဖြင့် မြန်မာကျပ် (MMK) ဖြင့် ပေးသွားမည်ဖြစ်သည်။\n\n" +
                    "4. Any alterations to this voucher will render it invalid. Contact the portal at admin@dicp.com.mm for queries.\n" +
                    "   ဤပြေစာတွင် မည်သည့် ပြောင်းလဲမှုမဆို ပြုလုပ်ပါက အကျုံးမဝင်ပါ။ မေးမြန်းချက်များအတွက် admin@dicp.com.mm သို့ ဆက်သွယ်ပါ။";
            doc.add(new Paragraph(instructions).setFont(regular).setFontSize(8.5f).setFontColor(gray).setMarginBottom(8));

            // Validity box
            doc.add(new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth()
                    .addCell(new Cell()
                            .add(new Paragraph("⚠  IMPORTANT: This voucher is VALID FOR 30 DAYS from " + issueDate +
                                    ".  Present original ID when collecting payout.")
                                    .setFont(bold).setFontSize(9).setFontColor(new DeviceRgb(146, 64, 14))
                                    .setTextAlignment(TextAlignment.CENTER))
                            .add(new Paragraph("အရေးကြီး: ဤပြေစာသည် " + issueDate + " မှ ရက် ၃၀ သာ သက်ဆိုင်သည်။ ငွေထုတ်ရာတွင် မူရင်း မှတ်ပုံတင် ယူဆောင်လာပါ။")
                                    .setFont(oblique).setFontSize(8).setFontColor(new DeviceRgb(146, 64, 14))
                                    .setTextAlignment(TextAlignment.CENTER))
                            .setBackgroundColor(new DeviceRgb(254, 252, 232))
                            .setBorder(new SolidBorder(new DeviceRgb(253, 211, 77), 1.5f)).setPadding(8).setMarginBottom(10)));

            // ── FOOTER ─────────────────────────────────────────────────
            doc.add(new Paragraph(
                    "\nThis payout voucher was generated by the Digital Insurance Claims and Premiums Portal on " + issueDate +
                    ".\nVoucher Ref: " + voucherRef + "  |  Claim ID: #" + claim.getId() +
                    "  |  Policy No: " + policyNum + "  |  Amount: " + amountStr +
                    "\nThis is an official computer-generated document. Digital signature verified by DICP Portal.")
                    .setFont(oblique).setFontSize(7.5f).setFontColor(gray)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBorderTop(new SolidBorder(lightSlate, 0.5f)).setPaddingTop(8).setMarginTop(8));

            doc.close();
            return pdfResponse(baos.toByteArray(), "payout_voucher_claim_" + claim.getId() + ".pdf");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
