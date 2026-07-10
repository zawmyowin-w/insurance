package com.insurance.portal.controller;

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
        if (req.containsKey("coverageMin"))  pkg.setCoverageMin(new BigDecimal(req.get("coverageMin").toString()));
        if (req.containsKey("coverageMax"))  pkg.setCoverageMax(new BigDecimal(req.get("coverageMax").toString()));
        if (req.containsKey("premiumRate"))  pkg.setPremiumRate(new BigDecimal(req.get("premiumRate").toString()));
        if (req.containsKey("active"))       pkg.setActive(Boolean.TRUE.equals(req.get("active")));
        if (req.containsKey("durations")) {
            Object d = req.get("durations");
            if (d instanceof List<?> list) pkg.setDurationsJson(list.stream().map(Object::toString).reduce((a, b) -> a + "," + b).orElse("1"));
            else pkg.setDurationsJson(d.toString());
        }
        if (req.containsKey("benefits")) {
            Object b = req.get("benefits");
            if (b instanceof List<?> list) pkg.setBenefitsJson(list.stream().map(Object::toString).reduce((a, bc) -> a + "\n" + bc).orElse(""));
            else pkg.setBenefitsJson(b.toString());
        }
        return pkg;
    }
}
