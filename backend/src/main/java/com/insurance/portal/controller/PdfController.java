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
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
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
