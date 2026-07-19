package com.insurance.portal.controller;

import com.insurance.portal.dto.*;
import com.insurance.portal.model.*;
import com.insurance.portal.model.enums.*;
import com.insurance.portal.repository.*;
import com.insurance.portal.util.FileStorageUtil;
import com.insurance.portal.util.PremiumScheduleUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepo;
    private final PolicyApplicationRepository appRepo;
    private final ClaimRepository claimRepo;
    private final PaymentRepository paymentRepo;
    private final NotificationRepository notifRepo;
    private final InsurancePackageRepository packageRepo;
    private final InsuranceTypeRepository insuranceTypeRepo;
    private final PasswordEncoder passwordEncoder;

    // ── Insurance Types CRUD ──────────────────────────────────────────

    @GetMapping("/insurance-types")
    @Transactional(readOnly = true)
    public ResponseEntity<?> listInsuranceTypes() {
        return ResponseEntity.ok(insuranceTypeRepo.findAllByOrderByNameAsc().stream()
            .map(t -> Map.of("id", t.getId(), "name", t.getName(),
                             "createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : ""))
            .toList());
    }

    @PostMapping("/insurance-types")
    @Transactional
    public ResponseEntity<?> createInsuranceType(@RequestBody Map<String, Object> body) {
        String name = body.getOrDefault("name", "").toString().trim().toUpperCase();
        if (name.isBlank()) return ResponseEntity.badRequest().body(Map.of("message", "Name is required"));
        if (insuranceTypeRepo.findByNameIgnoreCase(name).isPresent())
            return ResponseEntity.status(409).body(Map.of("message", "\"" + name + "\" သည် ရှိပြီးသားဖြစ်သည်"));
        var saved = insuranceTypeRepo.save(com.insurance.portal.model.InsuranceType.builder().name(name).build());
        return ResponseEntity.ok(Map.of("id", saved.getId(), "name", saved.getName()));
    }

    @DeleteMapping("/insurance-types/{id}")
    @Transactional
    public ResponseEntity<?> deleteInsuranceType(@PathVariable Long id) {
        if (!insuranceTypeRepo.existsById(id))
            return ResponseEntity.notFound().build();
        insuranceTypeRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // ── Dashboard Stats ───────────────────────────────────────────────
    @GetMapping("/dashboard/stats")
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCustomers", userRepo.findAllByRole(Role.CUSTOMER).size());
        stats.put("totalAgents", userRepo.findAllByRole(Role.AGENT).size());
        stats.put("pendingApplications", appRepo.countByStatus(ApplicationStatus.PENDING));
        stats.put("pendingClaims", claimRepo.countByStatus(ClaimStatus.PENDING));
        stats.put("verifiedApplications", appRepo.countByStatus(ApplicationStatus.VERIFIED));
        stats.put("verifiedClaims", claimRepo.countByStatus(ClaimStatus.VERIFIED));
        stats.put("totalPackages", packageRepo.count());
        // Monthly revenue: sum of VERIFIED payments created this calendar month
        var now = java.time.LocalDateTime.now();
        var startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        java.math.BigDecimal monthlyRevenue = paymentRepo.findAll().stream()
                .filter(p -> p.getStatus() == PaymentStatus.VERIFIED
                        && p.getAmount() != null
                        && p.getCreatedAt() != null
                        && !p.getCreatedAt().isBefore(startOfMonth))
                .map(Payment::getAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        stats.put("monthlyRevenue", monthlyRevenue);
        return stats;
    }

    @GetMapping("/recent-activities")
    @Transactional(readOnly = true)
    public List<?> getRecentActivities() {
        return notifRepo.findAll().stream()
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .limit(10)
                .map(n -> Map.of("description", n.getTitle(), "createdAt", n.getCreatedAt(), "icon", "bi-activity"))
                .toList();
    }

    // ── Reports ───────────────────────────────────────────────────────
    @GetMapping("/reports")
    @Transactional(readOnly = true)
    public Map<String, Object> getReports() {
        Map<String, Object> r = new LinkedHashMap<>();
        var allApps     = appRepo.findAll();
        var allClaims   = claimRepo.findAll();
        var allPayments = paymentRepo.findAll();
        var now         = java.time.LocalDateTime.now();

        // ── Basic counts ──────────────────────────────────────────────
        r.put("totalCustomers",       userRepo.findAllByRole(Role.CUSTOMER).size());
        r.put("totalAgents",          userRepo.findAllByRole(Role.AGENT).size());
        r.put("totalApplications",    allApps.size());
        r.put("activePolicies",       allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.APPROVED).count());
        r.put("pendingApplications",  allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING || a.getStatus() == ApplicationStatus.VERIFIED).count());
        r.put("rejectedApplications", allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count());
        r.put("totalClaims",          allClaims.size());
        r.put("approvedClaims",       allClaims.stream().filter(c -> c.getStatus() == ClaimStatus.APPROVED).count());
        r.put("pendingClaims",        allClaims.stream().filter(c -> c.getStatus() == ClaimStatus.PENDING || c.getStatus() == ClaimStatus.VERIFIED).count());
        r.put("rejectedClaims",       allClaims.stream().filter(c -> c.getStatus() == ClaimStatus.REJECTED).count());

        // ── Revenue (verified payments only) ──────────────────────────
        var verifiedPayments = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.VERIFIED && p.getAmount() != null)
                .toList();
        java.math.BigDecimal totalRevenue = verifiedPayments.stream()
                .map(Payment::getAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        r.put("totalRevenue", totalRevenue);

        // ── Claims paid out (APPROVED claims) ────────────────────────
        java.math.BigDecimal totalClaimsPaid = allClaims.stream()
                .filter(c -> c.getStatus() == ClaimStatus.APPROVED && c.getAmount() != null)
                .map(Claim::getAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        r.put("totalClaimsPaid", totalClaimsPaid);

        // ── Profit metrics (Myanmar insurance industry standards) ──────
        // Operating expense: ~15% of gross premium (agent commissions, admin, overhead)
        double opExpensePct = 15.0;
        java.math.BigDecimal opExpense = totalRevenue.multiply(
                java.math.BigDecimal.valueOf(opExpensePct / 100.0))
                .setScale(2, java.math.RoundingMode.HALF_UP);
        java.math.BigDecimal netProfit = totalRevenue.subtract(totalClaimsPaid).subtract(opExpense);
        double lossRatio = totalRevenue.compareTo(java.math.BigDecimal.ZERO) > 0
                ? totalClaimsPaid.multiply(java.math.BigDecimal.valueOf(100))
                        .divide(totalRevenue, 2, java.math.RoundingMode.HALF_UP).doubleValue() : 0.0;
        double expenseRatio = opExpensePct;
        double combinedRatio = lossRatio + expenseRatio;
        double profitMarginPct = totalRevenue.compareTo(java.math.BigDecimal.ZERO) > 0
                ? netProfit.multiply(java.math.BigDecimal.valueOf(100))
                        .divide(totalRevenue, 2, java.math.RoundingMode.HALF_UP).doubleValue() : 0.0;

        r.put("netProfit",         netProfit);
        r.put("operatingExpense",  opExpense);
        r.put("lossRatioPct",      lossRatio);
        r.put("expenseRatioPct",   expenseRatio);
        r.put("combinedRatioPct",  combinedRatio);
        r.put("profitMarginPct",   profitMarginPct);

        // ── Revenue by insurance type ─────────────────────────────────
        Map<String, java.math.BigDecimal> revenueByType = new java.util.TreeMap<>();
        for (Payment p : verifiedPayments) {
            if (p.getApplication() != null && p.getApplication().getInsurancePackage() != null) {
                String type = p.getApplication().getInsurancePackage().getType();
                revenueByType.merge(type, p.getAmount(), java.math.BigDecimal::add);
            }
        }
        r.put("revenueByType", revenueByType);

        // ── Active policies by type ───────────────────────────────────
        Map<String, Long> byType = allApps.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.APPROVED && a.getInsurancePackage() != null)
                .collect(java.util.stream.Collectors.groupingBy(
                        a -> a.getInsurancePackage().getType(),
                        java.util.stream.Collectors.counting()));
        r.put("policiesByType", byType);

        // ── Monthly revenue — last 12 months ─────────────────────────
        Map<String, java.math.BigDecimal> monthlyRevenue = new java.util.LinkedHashMap<>();
        for (int i = 11; i >= 0; i--) {
            var month = now.minusMonths(i);
            String key = month.getMonth().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH)
                    + " " + month.getYear();
            monthlyRevenue.put(key, java.math.BigDecimal.ZERO);
        }
        for (Payment p : verifiedPayments) {
            if (p.getCreatedAt() != null && p.getCreatedAt().isAfter(now.minusMonths(12))) {
                String key = p.getCreatedAt().getMonth().getDisplayName(
                        java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH)
                        + " " + p.getCreatedAt().getYear();
                monthlyRevenue.merge(key, p.getAmount(), java.math.BigDecimal::add);
            }
        }
        r.put("monthlyRevenue", monthlyRevenue);

        // ── Monthly claims paid — last 12 months ─────────────────────
        Map<String, java.math.BigDecimal> monthlyClaims = new java.util.LinkedHashMap<>();
        for (int i = 11; i >= 0; i--) {
            var month = now.minusMonths(i);
            String key = month.getMonth().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH)
                    + " " + month.getYear();
            monthlyClaims.put(key, java.math.BigDecimal.ZERO);
        }
        for (Claim c : allClaims) {
            if (c.getStatus() == ClaimStatus.APPROVED && c.getCreatedAt() != null
                    && c.getCreatedAt().isAfter(now.minusMonths(12)) && c.getAmount() != null) {
                String key = c.getCreatedAt().getMonth().getDisplayName(
                        java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH)
                        + " " + c.getCreatedAt().getYear();
                monthlyClaims.merge(key, c.getAmount(), java.math.BigDecimal::add);
            }
        }
        r.put("monthlyClaims", monthlyClaims);

        // ── Applications per month — last 12 months ───────────────────
        Map<String, Long> appsByMonth = new java.util.LinkedHashMap<>();
        for (int i = 11; i >= 0; i--) {
            var month = now.minusMonths(i);
            String key = month.getMonth().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH)
                    + " " + month.getYear();
            appsByMonth.put(key, 0L);
        }
        for (PolicyApplication a : allApps) {
            if (a.getCreatedAt() != null && a.getCreatedAt().isAfter(now.minusMonths(12))) {
                String key = a.getCreatedAt().getMonth().getDisplayName(
                        java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH)
                        + " " + a.getCreatedAt().getYear();
                appsByMonth.merge(key, 1L, Long::sum);
            }
        }
        r.put("applicationsByMonth", appsByMonth);
        // legacy 6-month key kept for backward compat
        r.put("applicationsByMonth6", appsByMonth.entrySet().stream()
                .skip(Math.max(0, appsByMonth.size() - 6))
                .collect(java.util.stream.Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue,
                        (a, b) -> b, java.util.LinkedHashMap::new)));

        // ── Agent Performance ──────────────────────────────────────────────
        List<User> agentUsers = userRepo.findAllByRole(Role.AGENT);
        List<Map<String, Object>> agentPerformance = agentUsers.stream().map(agent -> {
            long appsHandled = allApps.stream()
                .filter(a -> a.getAgent() != null && a.getAgent().getId().equals(agent.getId()))
                .count();
            long claimsHandled = allClaims.stream()
                .filter(c -> c.getAgent() != null && c.getAgent().getId().equals(agent.getId()))
                .count();
            long appsApproved = allApps.stream()
                .filter(a -> a.getAgent() != null && a.getAgent().getId().equals(agent.getId())
                          && a.getStatus() == ApplicationStatus.APPROVED)
                .count();
            long claimsApproved = allClaims.stream()
                .filter(c -> c.getAgent() != null && c.getAgent().getId().equals(agent.getId())
                          && c.getStatus() == ClaimStatus.APPROVED)
                .count();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("agentId",             agent.getId());
            m.put("agentName",           agent.getName());
            m.put("agentEmail",          agent.getEmail());
            m.put("insuranceType",       agent.getInsuranceType());
            m.put("applicationsHandled", appsHandled);
            m.put("claimsHandled",       claimsHandled);
            m.put("applicationsApproved",appsApproved);
            m.put("claimsApproved",      claimsApproved);
            m.put("approvalRate",        appsHandled > 0
                    ? Math.round((double) appsApproved / appsHandled * 1000.0) / 10.0 : 0.0);
            return m;
        }).sorted((a, b) -> Long.compare(
                (Long) b.get("applicationsHandled"), (Long) a.get("applicationsHandled")))
          .collect(java.util.stream.Collectors.toList());
        r.put("agentPerformance", agentPerformance);

        // ── Package Popularity ─────────────────────────────────────────────
        List<Map<String, Object>> packagePopularity = packageRepo.findAll().stream().map(pkg -> {
            List<PolicyApplication> pkgApps = allApps.stream()
                .filter(a -> a.getInsurancePackage() != null
                          && a.getInsurancePackage().getId().equals(pkg.getId()))
                .collect(java.util.stream.Collectors.toList());
            long approved = pkgApps.stream().filter(a -> a.getStatus() == ApplicationStatus.APPROVED).count();
            java.math.BigDecimal revenue = verifiedPayments.stream()
                .filter(p -> p.getApplication() != null && p.getApplication().getInsurancePackage() != null
                          && p.getApplication().getInsurancePackage().getId().equals(pkg.getId()))
                .map(Payment::getAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("packageId",       pkg.getId());
            m.put("packageName",     pkg.getName());
            m.put("packageType",     pkg.getType());
            m.put("applicationCount",pkgApps.size());
            m.put("approvedCount",   (int) approved);
            m.put("revenue",         revenue);
            m.put("active",          pkg.isActive());
            return m;
        }).sorted((a, b) -> Integer.compare(
                (Integer) b.get("applicationCount"), (Integer) a.get("applicationCount")))
          .collect(java.util.stream.Collectors.toList());
        r.put("packagePopularity", packagePopularity);

        // ── Claims Payout by Customer ──────────────────────────────────────
        Map<Long, Map<String, Object>> claimsPayoutMap = new LinkedHashMap<>();
        for (Claim c : allClaims) {
            if (c.getStatus() != ClaimStatus.APPROVED || c.getCustomer() == null || c.getAmount() == null) continue;
            Long cid = c.getCustomer().getId();
            claimsPayoutMap.computeIfAbsent(cid, id -> {
                Map<String, Object> cm = new LinkedHashMap<>();
                cm.put("customerId",    c.getCustomer().getId());
                cm.put("customerName",  c.getCustomer().getName());
                cm.put("customerEmail", c.getCustomer().getEmail());
                cm.put("totalPayout",   java.math.BigDecimal.ZERO);
                cm.put("claimCount",    0);
                cm.put("claims",        new ArrayList<>());
                return cm;
            });
            Map<String, Object> cm = claimsPayoutMap.get(cid);
            cm.put("totalPayout", ((java.math.BigDecimal) cm.get("totalPayout")).add(c.getAmount()));
            cm.put("claimCount", (int) cm.get("claimCount") + 1);
            @SuppressWarnings("unchecked")
            List<Object> claimsList = (List<Object>) cm.get("claims");
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("claimId",      c.getId());
            entry.put("amount",       c.getAmount());
            entry.put("claimType",    c.getClaimType());
            entry.put("insuranceType", c.getApplication() != null && c.getApplication().getInsurancePackage() != null
                    ? c.getApplication().getInsurancePackage().getType() : null);
            entry.put("approvedAt",   c.getUpdatedAt());
            claimsList.add(entry);
        }
        r.put("claimsPayoutByCustomer", claimsPayoutMap.values().stream()
            .sorted(Comparator.comparing(m -> ((java.math.BigDecimal) m.get("totalPayout")).negate()))
            .collect(java.util.stream.Collectors.toList()));

        // Monthly claims payout by type (last 12 months)
        Map<String, Map<String, java.math.BigDecimal>> claimsByType = new LinkedHashMap<>();
        for (Claim c : allClaims) {
            if (c.getStatus() != ClaimStatus.APPROVED || c.getCreatedAt() == null
                    || c.getAmount() == null || c.getCreatedAt().isBefore(now.minusMonths(12))) continue;
            String type  = c.getApplication() != null && c.getApplication().getInsurancePackage() != null
                    ? c.getApplication().getInsurancePackage().getType() : "OTHER";
            String month = c.getCreatedAt().getMonth().getDisplayName(
                    java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH) + " " + c.getCreatedAt().getYear();
            claimsByType.computeIfAbsent(type, k -> new LinkedHashMap<>())
                .merge(month, c.getAmount(), java.math.BigDecimal::add);
        }
        r.put("claimsByType", claimsByType);

        return r;
    }

    // ── Application Full Premium Schedule ─────────────────────────────────
    @GetMapping("/applications/{id}/schedule")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getApplicationSchedule(@PathVariable Long id) {
        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        List<Payment> payments = paymentRepo.findAllByApplication_Id(id);
        return ResponseEntity.ok(PremiumScheduleUtil.buildSchedule(app, payments));
    }

    // ── Wallet ────────────────────────────────────────────────────────
    @GetMapping("/wallet")
    @Transactional(readOnly = true)
    public Map<String, Object> getWallet() {
        Map<String, Object> w = new LinkedHashMap<>();
        var now         = java.time.LocalDateTime.now();
        var allPayments = paymentRepo.findAll();
        var allClaims   = claimRepo.findAll();

        // ── Totals ──────────────────────────────────────────────────────
        var verifiedPayments = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.VERIFIED && p.getAmount() != null)
                .toList();
        java.math.BigDecimal totalInflow = verifiedPayments.stream()
                .map(Payment::getAmount).reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        java.math.BigDecimal totalClaims = allClaims.stream()
                .filter(c -> c.getStatus() == ClaimStatus.APPROVED && c.getAmount() != null)
                .map(Claim::getAmount).reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        java.math.BigDecimal opExpense = totalInflow
                .multiply(java.math.BigDecimal.valueOf(0.15))
                .setScale(2, java.math.RoundingMode.HALF_UP);

        java.math.BigDecimal totalOutflow = totalClaims.add(opExpense);
        java.math.BigDecimal walletBalance = totalInflow.subtract(totalOutflow);

        w.put("totalInflow",    totalInflow);
        w.put("totalOutflow",   totalOutflow);
        w.put("totalClaimsPaid", totalClaims);
        w.put("operatingExpense", opExpense);
        w.put("walletBalance",  walletBalance);

        // ── Monthly inflow/outflow — last 12 months ───────────────────
        Map<String, java.math.BigDecimal> monthlyIn  = new java.util.LinkedHashMap<>();
        Map<String, java.math.BigDecimal> monthlyOut = new java.util.LinkedHashMap<>();
        for (int i = 11; i >= 0; i--) {
            var m   = now.minusMonths(i);
            String k = m.getMonth().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH)
                    + " " + m.getYear();
            monthlyIn.put(k,  java.math.BigDecimal.ZERO);
            monthlyOut.put(k, java.math.BigDecimal.ZERO);
        }
        for (Payment p : verifiedPayments) {
            if (p.getCreatedAt() != null && p.getCreatedAt().isAfter(now.minusMonths(12))) {
                String k = p.getCreatedAt().getMonth().getDisplayName(
                        java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH)
                        + " " + p.getCreatedAt().getYear();
                monthlyIn.merge(k, p.getAmount(), java.math.BigDecimal::add);
            }
        }
        for (Claim c : allClaims) {
            if (c.getStatus() == ClaimStatus.APPROVED && c.getCreatedAt() != null
                    && c.getCreatedAt().isAfter(now.minusMonths(12)) && c.getAmount() != null) {
                String k = c.getCreatedAt().getMonth().getDisplayName(
                        java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH)
                        + " " + c.getCreatedAt().getYear();
                monthlyOut.merge(k, c.getAmount(), java.math.BigDecimal::add);
            }
        }
        w.put("monthlyInflow",  monthlyIn);
        w.put("monthlyOutflow", monthlyOut);

        // ── Per-customer transaction list ─────────────────────────────
        Map<Long, Map<String, Object>> custMap = new java.util.LinkedHashMap<>();
        for (Payment p : verifiedPayments) {
            if (p.getCustomer() == null) continue;
            Long cid = p.getCustomer().getId();
            custMap.computeIfAbsent(cid, id -> {
                Map<String, Object> cm = new LinkedHashMap<>();
                cm.put("customerId",    p.getCustomer().getId());
                cm.put("customerName",  p.getCustomer().getName());
                cm.put("customerEmail", p.getCustomer().getEmail());
                cm.put("totalPaid",     java.math.BigDecimal.ZERO);
                cm.put("paymentCount",  0);
                cm.put("transactions",  new java.util.ArrayList<>());
                return cm;
            });
            Map<String, Object> cm = custMap.get(cid);
            cm.put("totalPaid", ((java.math.BigDecimal) cm.get("totalPaid")).add(p.getAmount()));
            cm.put("paymentCount", (int) cm.get("paymentCount") + 1);
            Map<String, Object> tx = new LinkedHashMap<>();
            tx.put("id",          p.getId());
            tx.put("amount",      p.getAmount());
            tx.put("method",      p.getPaymentMethod());
            tx.put("periodLabel", p.getPeriodLabel());
            tx.put("policyName",  p.getApplication() != null && p.getApplication().getInsurancePackage() != null
                    ? p.getApplication().getInsurancePackage().getName() : null);
            tx.put("insuranceType", p.getApplication() != null && p.getApplication().getInsurancePackage() != null
                    ? p.getApplication().getInsurancePackage().getType() : null);
            tx.put("createdAt",   p.getCreatedAt());
            ((java.util.List<Object>) cm.get("transactions")).add(tx);
        }
        List<Map<String, Object>> customerList = custMap.values().stream()
                .sorted(Comparator.comparing(cm ->
                        ((java.math.BigDecimal) cm.get("totalPaid")).negate()))
                .toList();
        w.put("customers", customerList);

        return w;
    }

    // ── Users ─────────────────────────────────────────────────────────
    @GetMapping("/users")
    @Transactional(readOnly = true)
    public List<UserResponse> getUsers() {
        return userRepo.findAll().stream().map(UserResponse::from).toList();
    }

    @PostMapping("/users/agents")
    @Transactional
    public ResponseEntity<?> createAgent(@RequestBody Map<String, Object> req) {
        String email = req.get("email").toString();
        if (!com.insurance.portal.util.EmailValidationUtil.isValid(email)) {
            return ResponseEntity.badRequest().body(Map.of("message", com.insurance.portal.util.EmailValidationUtil.ERROR_MESSAGE));
        }
        if (userRepo.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already in use"));
        }
        String agentPassword = req.get("password").toString();
        if (!com.insurance.portal.util.PasswordValidationUtil.isStrong(agentPassword)) {
            return ResponseEntity.badRequest().body(Map.of("message", com.insurance.portal.util.PasswordValidationUtil.ERROR_MESSAGE));
        }
        String insuranceType = req.containsKey("insuranceType") ? req.get("insuranceType").toString() : "ALL";
        if (!"ALL".equals(insuranceType)) {
            java.util.Optional<User> taken = userRepo.findFirstByRoleAndInsuranceTypeAndActive(Role.AGENT, insuranceType, true);
            if (taken.isPresent()) {
                return ResponseEntity.status(409).body(Map.of("message",
                    "\"" + taken.get().getName() + "\" သည် " + insuranceType + " type ကို ယူထားပြီးဖြစ်သည်။ Insurance type တစ်မျိုးလျှင် agent တစ်ယောက်သာ ရပါသည်။"));
            }
        }
        User agent = User.builder()
                .name(req.get("name").toString())
                .email(email)
                .password(passwordEncoder.encode(agentPassword))
                .role(Role.AGENT)
                .phone(req.containsKey("phone") ? req.get("phone").toString() : null)
                .address(req.containsKey("address") ? req.get("address").toString() : null)
                .insuranceType(insuranceType)
                .active(true)
                .build();
        return ResponseEntity.ok(UserResponse.from(userRepo.save(agent)));
    }

    @PostMapping("/users/admins")
    @Transactional
    public ResponseEntity<?> createAdmin(@RequestBody Map<String, Object> req) {
        String email = req.get("email").toString();
        if (!com.insurance.portal.util.EmailValidationUtil.isValid(email)) {
            return ResponseEntity.badRequest().body(Map.of("message", com.insurance.portal.util.EmailValidationUtil.ERROR_MESSAGE));
        }
        if (userRepo.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already in use"));
        }
        String adminPassword = req.get("password").toString();
        if (!com.insurance.portal.util.PasswordValidationUtil.isStrong(adminPassword)) {
            return ResponseEntity.badRequest().body(Map.of("message", com.insurance.portal.util.PasswordValidationUtil.ERROR_MESSAGE));
        }
        User admin = User.builder()
                .name(req.get("name").toString())
                .email(email)
                .password(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                .phone(req.containsKey("phone") ? req.get("phone").toString() : null)
                .address(req.containsKey("address") ? req.get("address").toString() : null)
                .active(true)
                .build();
        return ResponseEntity.ok(UserResponse.from(userRepo.save(admin)));
    }

    /**
     * Admin-driven profile edit for any user — this is the only way an
     * agent's profile can be changed (agents cannot self-edit; see
     * AuthController#updateProfile). Also usable for editing customers/admins.
     */
    @PutMapping("/users/{id}")
    @Transactional
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UpdateProfileRequest req) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

        if (req.getName() != null && !req.getName().isBlank()) user.setName(req.getName());
        if (req.getEmail() != null && !req.getEmail().isBlank() && !req.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (!com.insurance.portal.util.EmailValidationUtil.isValid(req.getEmail())) {
                return ResponseEntity.badRequest().body(Map.of("message", com.insurance.portal.util.EmailValidationUtil.ERROR_MESSAGE));
            }
            if (userRepo.existsByEmail(req.getEmail())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email already in use"));
            }
            user.setEmail(req.getEmail());
        }
        if (req.getPhone() != null) user.setPhone(req.getPhone());
        if (req.getAddress() != null) user.setAddress(req.getAddress());
        if (user.getRole() == Role.AGENT && req.getInsuranceType() != null && !req.getInsuranceType().isBlank()) {
            String newType = req.getInsuranceType();
            if (!"ALL".equals(newType)) {
                java.util.Optional<User> existing = userRepo.findFirstByRoleAndInsuranceTypeAndActive(Role.AGENT, newType, true);
                if (existing.isPresent() && !existing.get().getId().equals(id)) {
                    return ResponseEntity.status(409).body(Map.of("message",
                        "\"" + existing.get().getName() + "\" သည် " + newType + " type ကို ယူထားပြီးဖြစ်သည်။ Insurance type တစ်မျိုးလျှင် agent တစ်ယောက်သာ ရပါသည်။"));
                }
            }
            user.setInsuranceType(newType);
        }
        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            if (!com.insurance.portal.util.PasswordValidationUtil.isStrong(req.getNewPassword())) {
                return ResponseEntity.badRequest().body(Map.of("message", com.insurance.portal.util.PasswordValidationUtil.ERROR_MESSAGE));
            }
            user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        }
        return ResponseEntity.ok(UserResponse.from(userRepo.save(user)));
    }

    /** Admin uploads/replaces any user's profile picture — the only way an agent's picture can be set. */
    @PostMapping(value = "/users/{id}/picture", consumes = "multipart/form-data")
    @Transactional
    public ResponseEntity<?> uploadUserPicture(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        try {
            String oldPath = user.getProfilePicture();
            String newPath = FileStorageUtil.saveImage(file, "profile-pictures", "user_" + user.getId());
            if (newPath == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "No file provided"));
            }
            user.setProfilePicture(newPath);
            userRepo.save(user);
            FileStorageUtil.deleteFileQuietly(oldPath);
            return ResponseEntity.ok(UserResponse.from(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** Stream any user's profile picture (admin view — e.g. in Manage Users). */
    @GetMapping("/users/{id}/picture")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getUserPicture(@PathVariable Long id) throws java.io.IOException {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        String path = user.getProfilePicture();
        if (path == null || path.isBlank()) return ResponseEntity.notFound().build();
        File file = new File(path);
        if (!file.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(FileStorageUtil.contentTypeFor(path)))
                .body(new FileSystemResource(file));
    }

    @PutMapping("/users/{id}/toggle")
    @Transactional
    public ResponseEntity<?> toggleUser(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(Boolean.TRUE.equals(req.get("active")));
        return ResponseEntity.ok(UserResponse.from(userRepo.save(user)));
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Delete notifications belonging to this user
        notifRepo.deleteAllByRecipient(user);

        if (user.getRole() == Role.CUSTOMER) {
            // 2. Delete payments made by this customer
            paymentRepo.deleteAllByCustomer(user);
            // 3. Delete claims submitted by this customer
            claimRepo.deleteAllByCustomer(user);
            // 4. Delete applications submitted by this customer
            appRepo.deleteAllByCustomer(user);
        } else if (user.getRole() == Role.AGENT) {
            // 2. Unlink agent from claims (keep the records, just clear the agent ref)
            claimRepo.clearAgentFromClaims(user);
            // 3. Unlink agent from applications
            appRepo.clearAgentFromApplications(user);
        }

        // 5. Finally delete the user
        userRepo.delete(user);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    // ── Applications ──────────────────────────────────────────────────
    @GetMapping("/applications")
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplications(@RequestParam(required = false) String status) {
        if (status != null && !status.equals("ALL")) {
            try {
                return appRepo.findAllByStatus(ApplicationStatus.valueOf(status)).stream()
                        .sorted(Comparator.comparing(PolicyApplication::getCreatedAt).reversed())
                        .map(ApplicationResponse::from).toList();
            } catch (IllegalArgumentException ignored) {}
        }
        return appRepo.findAll().stream()
                .sorted(Comparator.comparing(PolicyApplication::getCreatedAt).reversed())
                .map(ApplicationResponse::from).toList();
    }

    @PutMapping("/applications/{id}/approve")
    @Transactional
    public ResponseEntity<?> approveApplication(@PathVariable Long id, @RequestBody Map<String, String> req) {
        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        if (app.getStatus() != ApplicationStatus.VERIFIED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only VERIFIED applications can be approved"));
        }
        app.setStatus(ApplicationStatus.APPROVED);
        app.setAdminNote(req.get("note"));
        appRepo.save(app);
        sendNotification(app.getCustomer(),
                "Application Approved! 🎉",
                "Your application for " + app.getInsurancePackage().getName()
                        + " has been approved. Please proceed with payment to activate your policy.",
                NotificationType.APPROVAL);
        return ResponseEntity.ok(ApplicationResponse.from(app));
    }

    @PutMapping("/applications/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectApplication(@PathVariable Long id, @RequestBody Map<String, String> req) {
        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        app.setStatus(ApplicationStatus.REJECTED);
        app.setAdminNote(req.get("note"));
        appRepo.save(app);
        sendNotification(app.getCustomer(),
                "Application Rejected",
                "Your application for " + app.getInsurancePackage().getName()
                        + " was rejected. Reason: " + req.getOrDefault("note", "N/A"),
                NotificationType.REJECTION);
        return ResponseEntity.ok(ApplicationResponse.from(app));
    }

    @PutMapping("/applications/{id}/revise")
    @Transactional
    public ResponseEntity<?> reviseApplication(@PathVariable Long id, @RequestBody Map<String, String> req) {
        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        app.setStatus(ApplicationStatus.REVISION_REQUESTED);
        app.setAdminNote(req.get("note"));
        app.setRevisionDeadline(LocalDateTime.now().plusDays(7));
        appRepo.save(app);
        sendNotification(app.getCustomer(),
                "Revision Required for Your Application",
                "Your application requires changes: " + req.getOrDefault("note", "N/A")
                        + ". Please update within 7 days.",
                NotificationType.INFO);
        return ResponseEntity.ok(ApplicationResponse.from(app));
    }

    // ── Claims ────────────────────────────────────────────────────────
    @GetMapping("/claims")
    @Transactional(readOnly = true)
    public List<ClaimResponse> getClaims(@RequestParam(required = false) String status) {
        if (status != null && !status.equals("ALL")) {
            try {
                return claimRepo.findAllByStatus(ClaimStatus.valueOf(status)).stream()
                        .sorted(Comparator.comparing(Claim::getCreatedAt).reversed())
                        .map(ClaimResponse::from).toList();
            } catch (IllegalArgumentException ignored) {}
        }
        return claimRepo.findAll().stream()
                .sorted(Comparator.comparing(Claim::getCreatedAt).reversed())
                .map(ClaimResponse::from).toList();
    }

    @PutMapping("/claims/{id}/approve")
    @Transactional
    public ResponseEntity<?> approveClaim(@PathVariable Long id, @RequestBody Map<String, String> req) {
        Claim claim = claimRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim not found"));
        if (claim.getStatus() != ClaimStatus.VERIFIED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only VERIFIED claims can be approved"));
        }
        claim.setStatus(ClaimStatus.APPROVED);
        claim.setAdminNote(req.get("note"));
        claimRepo.save(claim);

        // Record the claim payout as an outgoing payment entry
        Payment payout = Payment.builder()
                .application(claim.getApplication())
                .customer(claim.getCustomer())
                .amount(claim.getAmount())
                .paymentType("CLAIM_PAYOUT")
                .status(com.insurance.portal.model.enums.PaymentStatus.VERIFIED)
                .notes("Claim #" + claim.getId() + " approved payout"
                        + (req.get("note") != null && !req.get("note").isBlank() ? ": " + req.get("note") : ""))
                .build();
        paymentRepo.save(payout);

        sendNotification(claim.getCustomer(),
                "Claim Approved ✅",
                "Your claim of " + claim.getAmount() + " MMK has been approved. Compensation will be disbursed shortly.",
                NotificationType.APPROVAL);
        return ResponseEntity.ok(ClaimResponse.from(claim));
    }

    @PutMapping("/claims/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectClaim(@PathVariable Long id, @RequestBody Map<String, String> req) {
        Claim claim = claimRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim not found"));
        claim.setStatus(ClaimStatus.REJECTED);
        claim.setAdminNote(req.get("note"));
        claimRepo.save(claim);
        sendNotification(claim.getCustomer(),
                "Claim Rejected",
                "Your claim was rejected. Reason: " + req.getOrDefault("note", "N/A"),
                NotificationType.REJECTION);
        return ResponseEntity.ok(ClaimResponse.from(claim));
    }

    @PutMapping("/claims/{id}/revise")
    @Transactional
    public ResponseEntity<?> reviseClaim(@PathVariable Long id, @RequestBody Map<String, String> req) {
        Claim claim = claimRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim not found"));
        claim.setStatus(ClaimStatus.REVISION_REQUESTED);
        claim.setAdminNote(req.get("note"));
        claim.setRevisionDeadline(LocalDateTime.now().plusDays(7));
        claimRepo.save(claim);
        sendNotification(claim.getCustomer(),
                "Claim Revision Required",
                "Additional information is needed for your claim: " + req.getOrDefault("note", "N/A"),
                NotificationType.INFO);
        return ResponseEntity.ok(ClaimResponse.from(claim));
    }

    // ── Notifications ─────────────────────────────────────────────────
    @GetMapping("/notifications/sent")
    @Transactional(readOnly = true)
    public List<?> getSentNotifications() {
        return notifRepo.findAll().stream()
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .limit(50)
                .map(n -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", n.getId());
                    m.put("title", n.getTitle());
                    m.put("message", n.getMessage());
                    m.put("type", n.getType().name());
                    m.put("targetRole", n.getTargetRole());
                    m.put("createdAt", n.getCreatedAt());
                    return m;
                }).toList();
    }

    @PostMapping("/notifications/send")
    @Transactional
    public ResponseEntity<?> sendNotifications(@RequestBody Map<String, Object> req) {
        String title   = req.get("title").toString();
        String message = req.get("message").toString();
        String typeStr = req.getOrDefault("type", "INFO").toString();
        String targetRole    = req.getOrDefault("targetRole", "ALL").toString();
        String targetUserId  = req.containsKey("targetUserId") && req.get("targetUserId") != null
                ? req.get("targetUserId").toString() : null;

        NotificationType type;
        try { type = NotificationType.valueOf(typeStr); } catch (Exception e) { type = NotificationType.INFO; }

        List<User> recipients = new ArrayList<>();
        if (targetUserId != null && !targetUserId.isBlank()) {
            userRepo.findById(Long.valueOf(targetUserId)).ifPresent(recipients::add);
        } else switch (targetRole) {
            case "CUSTOMER" -> recipients.addAll(userRepo.findAllByRole(Role.CUSTOMER));
            case "AGENT"    -> recipients.addAll(userRepo.findAllByRole(Role.AGENT));
            default         -> recipients.addAll(userRepo.findAll());
        }

        final NotificationType finalType = type;
        final String finalTargetRole = targetRole;
        List<Notification> notifications = recipients.stream().map(u ->
                Notification.builder()
                        .recipient(u).title(title).message(message)
                        .type(finalType).targetRole(finalTargetRole)
                        .build()
        ).toList();
        notifRepo.saveAll(notifications);
        return ResponseEntity.ok(Map.of("sent", notifications.size()));
    }

    // ── Form field file serving ───────────────────────────────────────
    /** Serve a file uploaded into a dynamic form field for an application */
    @GetMapping("/applications/{id}/form-file/{fieldId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getApplicationFormFile(@PathVariable Long id, @PathVariable String fieldId) {
        PolicyApplication app = appRepo.findById(id).orElseThrow();
        return FileStorageUtil.serveFormFile(app.getFormData(), fieldId);
    }

    /** Serve a file uploaded into a dynamic form field for a claim */
    @GetMapping("/claims/{id}/form-file/{fieldId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getClaimFormFile(@PathVariable Long id, @PathVariable String fieldId) {
        Claim claim = claimRepo.findById(id).orElseThrow();
        return FileStorageUtil.serveFormFile(claim.getFormData(), fieldId);
    }

    // ── Helpers ───────────────────────────────────────────────────────
    private void sendNotification(User recipient, String title, String message, NotificationType type) {
        notifRepo.save(Notification.builder()
                .recipient(recipient).title(title).message(message).type(type).build());
    }
}
