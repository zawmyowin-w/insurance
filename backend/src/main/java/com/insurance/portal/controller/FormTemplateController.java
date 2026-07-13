package com.insurance.portal.controller;

import com.insurance.portal.model.FormField;
import com.insurance.portal.model.FormTemplate;
import com.insurance.portal.model.enums.FieldType;
import com.insurance.portal.model.enums.FormType;
import com.insurance.portal.repository.FormTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequiredArgsConstructor
public class FormTemplateController {

    private final FormTemplateRepository templateRepo;

    // ── Admin CRUD ──────────────────────────────────────────────────────
    @GetMapping("/admin/forms")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAll(
            @RequestParam(required = false) String insuranceType,
            @RequestParam(required = false) String formType) {

        List<FormTemplate> templates;
        if (insuranceType != null && !insuranceType.isBlank() && formType != null && !formType.isBlank()) {
            templates = templateRepo.findAllByInsuranceTypeAndFormType(
                    insuranceType, FormType.valueOf(formType));
        } else if (insuranceType != null && !insuranceType.isBlank()) {
            templates = templateRepo.findAllByInsuranceType(insuranceType);
        } else if (formType != null && !formType.isBlank()) {
            templates = templateRepo.findAllByFormType(FormType.valueOf(formType));
        } else {
            templates = templateRepo.findAll();
        }

        return templates.stream()
                .sorted(Comparator.comparing(FormTemplate::getCreatedAt).reversed())
                .map(this::toMap)
                .toList();
    }

    @PostMapping("/admin/forms")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> create(@RequestBody Map<String, Object> req) {
        FormTemplate template = new FormTemplate();
        applyRequest(template, req);
        return ResponseEntity.ok(toMap(templateRepo.save(template)));
    }

    @PutMapping("/admin/forms/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        FormTemplate template = templateRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        template.getFields().clear();          // orphanRemoval deletes old fields
        templateRepo.saveAndFlush(template);   // flush so orphans are removed before re-add
        applyRequest(template, req);
        return ResponseEntity.ok(toMap(templateRepo.save(template)));
    }

    @DeleteMapping("/admin/forms/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Long id) {
        templateRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Template deleted"));
    }

    // ── Public endpoint: active template for a given insurance type + form type ──
    @GetMapping("/forms/public")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getPublic(
            @RequestParam String insuranceType,
            @RequestParam String formType) {
        return templateRepo.findFirstByInsuranceTypeAndFormTypeAndActiveTrue(
                        insuranceType, FormType.valueOf(formType))
                .map(t -> ResponseEntity.ok(toMap(t)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Helpers ─────────────────────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private void applyRequest(FormTemplate template, Map<String, Object> req) {
        template.setName(req.get("name").toString());
        template.setInsuranceType(req.get("insuranceType").toString());
        template.setFormType(FormType.valueOf(req.get("formType").toString()));
        template.setDescription(req.containsKey("description") && req.get("description") != null
                ? req.get("description").toString() : null);
        template.setActive(!req.containsKey("active") || Boolean.TRUE.equals(req.get("active")));

        List<Map<String, Object>> fieldList = req.containsKey("fields") && req.get("fields") != null
                ? (List<Map<String, Object>>) req.get("fields") : List.of();

        for (int i = 0; i < fieldList.size(); i++) {
            Map<String, Object> fd = fieldList.get(i);
            FormField field = new FormField();
            field.setTemplate(template);
            field.setFieldLabel(fd.get("fieldLabel").toString());
            field.setFieldType(FieldType.valueOf(fd.get("fieldType").toString()));
            field.setRequired(Boolean.TRUE.equals(fd.get("required")));
            field.setSortOrder(i);
            template.getFields().add(field);
        }
    }

    private Map<String, Object> toMap(FormTemplate t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("name", t.getName());
        m.put("insuranceType", t.getInsuranceType());
        m.put("formType", t.getFormType().name());
        m.put("description", t.getDescription());
        m.put("active", t.isActive());
        m.put("createdAt", t.getCreatedAt());
        m.put("fields", t.getFields().stream().map(f -> {
            Map<String, Object> fm = new LinkedHashMap<>();
            fm.put("id", f.getId());
            fm.put("fieldLabel", f.getFieldLabel());
            fm.put("fieldType", f.getFieldType().name());
            fm.put("required", f.isRequired());
            fm.put("sortOrder", f.getSortOrder());
            return fm;
        }).toList());
        return m;
    }
}
