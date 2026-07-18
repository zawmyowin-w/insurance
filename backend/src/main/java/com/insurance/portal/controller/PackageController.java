package com.insurance.portal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.insurance.portal.dto.PackageResponse;
import com.insurance.portal.model.InsurancePackage;
import com.insurance.portal.repository.InsurancePackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PackageController {

    private final InsurancePackageRepository packageRepository;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    // Public endpoint - no auth required
    @GetMapping("/packages/public")
    public List<PackageResponse> getPublicPackages() {
        return packageRepository.findAllByActive(true).stream()
                .map(PackageResponse::from).toList();
    }

    // Admin endpoints
    @GetMapping("/admin/packages")
    @PreAuthorize("hasRole('ADMIN')")
    public List<PackageResponse> getAllPackages() {
        return packageRepository.findAll().stream().map(PackageResponse::from).toList();
    }

    @PostMapping("/admin/packages")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createPackage(@RequestBody Map<String, Object> req) {
        InsurancePackage pkg = buildPackageFromMap(req, new InsurancePackage());
        return ResponseEntity.ok(PackageResponse.from(packageRepository.save(pkg)));
    }

    @PutMapping("/admin/packages/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updatePackage(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        InsurancePackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Package not found"));
        buildPackageFromMap(req, pkg);
        return ResponseEntity.ok(PackageResponse.from(packageRepository.save(pkg)));
    }

    @PutMapping("/admin/packages/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> togglePackage(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        InsurancePackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));
        pkg.setActive(Boolean.TRUE.equals(req.get("active")));
        return ResponseEntity.ok(PackageResponse.from(packageRepository.save(pkg)));
    }

    @DeleteMapping("/admin/packages/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deletePackage(@PathVariable Long id) {
        packageRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Package deleted"));
    }

    private InsurancePackage buildPackageFromMap(Map<String, Object> req, InsurancePackage pkg) {
        if (req.containsKey("name"))         pkg.setName((String) req.get("name"));
        if (req.containsKey("type"))         pkg.setType((String) req.get("type"));
        if (req.containsKey("description"))  pkg.setDescription((String) req.get("description"));
        if (req.containsKey("coverageMin"))  pkg.setCoverageMin(toBD(req.get("coverageMin")));
        if (req.containsKey("coverageMax"))  pkg.setCoverageMax(toBD(req.get("coverageMax")));
        if (req.containsKey("active"))       pkg.setActive(Boolean.TRUE.equals(req.get("active")));

        // Legacy premiumRate (kept for backward compat; auto-derived from first durationTier if not set)
        if (req.containsKey("premiumRate") && req.get("premiumRate") != null) {
            pkg.setPremiumRate(toBD(req.get("premiumRate")));
        }

        // Duration tiers JSON array [{years, premiumRate}]
        if (req.containsKey("durationTiers")) {
            Object dt = req.get("durationTiers");
            try {
                String json = MAPPER.writeValueAsString(dt);
                pkg.setDurationTiersJson(json);
                // Derive legacy premiumRate from first tier
                if (dt instanceof List<?> list && !list.isEmpty()) {
                    Object first = list.get(0);
                    if (first instanceof Map<?, ?> m && m.containsKey("premiumRate")) {
                        pkg.setPremiumRate(toBD(m.get("premiumRate")));
                    }
                }
                // Also keep legacy durations field in sync
                if (dt instanceof List<?> list) {
                    String durationsStr = list.stream()
                            .filter(t -> t instanceof Map<?,?>)
                            .map(t -> String.valueOf(((Map<?,?>) t).get("years")))
                            .reduce((a, b) -> a + "," + b).orElse("1");
                    pkg.setDurationsJson(durationsStr);
                }
            } catch (Exception ignored) {}
        }

        // Legacy durations field (kept for backward compat)
        if (req.containsKey("durations") && !req.containsKey("durationTiers")) {
            Object d = req.get("durations");
            if (d instanceof List<?> list) pkg.setDurationsJson(list.stream().map(Object::toString).reduce((a, b) -> a + "," + b).orElse("1"));
            else pkg.setDurationsJson(d.toString());
        }

        if (req.containsKey("benefits")) {
            Object b = req.get("benefits");
            if (b instanceof List<?> list) pkg.setBenefitsJson(list.stream().map(Object::toString).reduce((a, bc) -> a + "\n" + bc).orElse(""));
            else pkg.setBenefitsJson(b.toString());
        }

        if (req.containsKey("policyTerm"))    pkg.setPolicyTerm(req.get("policyTerm") != null ? ((Number) req.get("policyTerm")).intValue() : null);
        if (req.containsKey("minPolicyTerm")) pkg.setMinPolicyTerm(req.get("minPolicyTerm") != null ? ((Number) req.get("minPolicyTerm")).intValue() : null);
        if (req.containsKey("eligibility"))   pkg.setEligibility((String) req.get("eligibility"));
        if (req.containsKey("exclusions"))    pkg.setExclusions((String) req.get("exclusions"));

        // New fields
        if (req.containsKey("paymentFrequency"))     pkg.setPaymentFrequency((String) req.get("paymentFrequency"));
        if (req.containsKey("paymentIntervalMonths") && req.get("paymentIntervalMonths") != null)
            pkg.setPaymentIntervalMonths(((Number) req.get("paymentIntervalMonths")).intValue());
        if (req.containsKey("maxClaimAmount") && req.get("maxClaimAmount") != null)
            pkg.setMaxClaimAmount(toBD(req.get("maxClaimAmount")));
        if (req.containsKey("beneficiaryInfo"))  pkg.setBeneficiaryInfo((String) req.get("beneficiaryInfo"));
        if (req.containsKey("termsAndConditions")) pkg.setTermsAndConditions((String) req.get("termsAndConditions"));
        if (req.containsKey("requiredDocuments")) {
            Object docs = req.get("requiredDocuments");
            try { pkg.setRequiredDocumentsJson(MAPPER.writeValueAsString(docs)); } catch (Exception ignored) {}
        }

        return pkg;
    }

    private BigDecimal toBD(Object v) {
        if (v == null) return null;
        return new BigDecimal(v.toString());
    }
}
