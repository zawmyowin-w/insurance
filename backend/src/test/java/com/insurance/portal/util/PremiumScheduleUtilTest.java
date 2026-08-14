package com.insurance.portal.util;

import com.insurance.portal.dto.AdminScheduleEntryResponse;
import com.insurance.portal.dto.PremiumScheduleResponse;
import com.insurance.portal.dto.PremiumScheduleResponse.InstallmentEntry;
import com.insurance.portal.model.InsurancePackage;
import com.insurance.portal.model.Payment;
import com.insurance.portal.model.PolicyApplication;
import com.insurance.portal.model.User;
import com.insurance.portal.model.enums.PaymentStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class PremiumScheduleUtilTest {

    private static InsurancePackage pkg(String frequency, Integer intervalMonths) {
        return InsurancePackage.builder()
                .id(7L)
                .name("Family Life")
                .type("LIFE")
                .paymentFrequency(frequency)
                .paymentIntervalMonths(intervalMonths)
                .build();
    }

    private static User user(long id, String name) {
        return User.builder().id(id).name(name).email(name + "@example.com").build();
    }

    private static PolicyApplication app(InsurancePackage pkg, BigDecimal premium, Integer durationYears,
                                         LocalDateTime createdAt) {
        return PolicyApplication.builder()
                .id(11L)
                .policyNumber("POL-LIF-2026-000001")
                .customer(user(1L, "owner"))
                .insurancePackage(pkg)
                .premiumAmount(premium)
                .duration(durationYears)
                .createdAt(createdAt)
                .build();
    }

    private static Payment payment(long id, Integer period, PaymentStatus status, User customer) {
        return Payment.builder().id(id).periodNumber(period).status(status).customer(customer).build();
    }

    @Test
    void splitsPremiumAcrossMonthlyInstallments() {
        PolicyApplication app = app(pkg("MONTHLY", 1), new BigDecimal("1200.00"), 1,
                LocalDateTime.now().minusMonths(2));

        PremiumScheduleResponse res = PremiumScheduleUtil.buildSchedule(app, List.of());

        assertEquals(12, res.getTotalInstallments());
        assertEquals(new BigDecimal("100.00"), res.getInstallmentAmount());
        assertEquals(new BigDecimal("1200.00"), res.getTotalPremium());
        assertEquals(0, res.getPaidCount());
        assertEquals("Family Life", res.getPackageName());
        assertEquals("LIFE", res.getPackageType());
        assertEquals(1, res.getPaymentIntervalMonths());
        assertEquals(app.getCreatedAt().toLocalDate().format(
                java.time.format.DateTimeFormatter.ofPattern("yyyy-MM")),
                res.getSchedule().get(0).getPeriodLabel());
    }

    @Test
    void fallsBackToSingleInstallmentWithoutInterval() {
        PolicyApplication app = app(pkg(null, null), new BigDecimal("500.00"), 3, LocalDateTime.now());

        PremiumScheduleResponse res = PremiumScheduleUtil.buildSchedule(app, List.of());

        assertEquals(1, res.getTotalInstallments());
        assertEquals(new BigDecimal("500.00"), res.getInstallmentAmount());
        assertEquals("Period 1", res.getSchedule().get(0).getPeriodLabel());
    }

    @Test
    void defaultsMissingPremiumDurationAndPackage() {
        PolicyApplication app = PolicyApplication.builder().id(3L).build();

        PremiumScheduleResponse res = PremiumScheduleUtil.buildSchedule(app, List.of());

        assertEquals(1, res.getTotalInstallments());
        assertEquals(BigDecimal.ZERO, res.getTotalPremium());
        assertNull(res.getPackageName());
        assertEquals(LocalDate.now(), res.getSchedule().get(0).getDueDate());
    }

    @Test
    void clampsIntervalLongerThanPolicyTermToOneInstallment() {
        PolicyApplication app = app(pkg("YEARLY", 24), new BigDecimal("300.00"), 1, LocalDateTime.now());

        PremiumScheduleResponse res = PremiumScheduleUtil.buildSchedule(app, List.of());

        assertEquals(1, res.getTotalInstallments());
        assertEquals(new BigDecimal("300.00"), res.getInstallmentAmount());
    }

    @Test
    void derivesStatusesFromPaymentsAndDueDates() {
        PolicyApplication app = app(pkg("MONTHLY", 1), new BigDecimal("1200.00"), 1, LocalDateTime.now());
        List<Payment> payments = List.of(
                payment(100L, 1, PaymentStatus.VERIFIED, app.getCustomer()),
                payment(101L, 2, PaymentStatus.PENDING, app.getCustomer()),
                payment(102L, 3, PaymentStatus.REJECTED, app.getCustomer()));

        PremiumScheduleResponse res = PremiumScheduleUtil.buildSchedule(app, payments);
        List<InstallmentEntry> schedule = res.getSchedule();

        assertEquals("PAID", schedule.get(0).getStatus());
        assertEquals(100L, schedule.get(0).getPaymentId());
        assertEquals("VERIFIED", schedule.get(0).getPaymentStatus());
        assertEquals("PENDING_VERIFICATION", schedule.get(1).getStatus());
        assertEquals("DUE", schedule.get(2).getStatus());          // rejected payment, not yet past due
        assertEquals("UPCOMING", schedule.get(3).getStatus());     // no payment, future
        assertEquals(1, res.getPaidCount());
    }

    @Test
    void marksCurrentMonthInstallmentDueAndLaterOnesUpcoming() {
        PolicyApplication app = app(pkg("MONTHLY", 1), new BigDecimal("1200.00"), 1, LocalDateTime.now());

        List<InstallmentEntry> schedule = PremiumScheduleUtil.buildSchedule(app, List.of()).getSchedule();

        assertEquals("DUE", schedule.get(0).getStatus());
        assertEquals("UPCOMING", schedule.get(1).getStatus());
    }

    @Test
    void marksUnpaidPastInstallmentsOverdue() {
        PolicyApplication app = app(pkg("MONTHLY", 1), new BigDecimal("1200.00"), 1,
                LocalDateTime.now().minusMonths(3));
        List<Payment> payments = List.of(payment(200L, 1, PaymentStatus.REJECTED, app.getCustomer()));

        List<InstallmentEntry> schedule = PremiumScheduleUtil.buildSchedule(app, payments).getSchedule();

        assertEquals("OVERDUE", schedule.get(0).getStatus());      // rejected payment, past due
        assertEquals("OVERDUE", schedule.get(1).getStatus());      // no payment, past due
    }

    @Test
    void assignsLegacyPaymentWithoutPeriodToFirstInstallment() {
        PolicyApplication app = app(pkg("YEARLY", 12), new BigDecimal("900.00"), 3, LocalDateTime.now());
        List<Payment> payments = List.of(payment(300L, null, PaymentStatus.VERIFIED, app.getCustomer()));

        PremiumScheduleResponse res = PremiumScheduleUtil.buildSchedule(app, payments);

        assertEquals(3, res.getTotalInstallments());
        assertEquals("PAID", res.getSchedule().get(0).getStatus());
        assertEquals(300L, res.getSchedule().get(0).getPaymentId());
        assertEquals(1, res.getPaidCount());
    }

    @Test
    void prefersVerifiedPaymentWhenPeriodHasDuplicates() {
        PolicyApplication app = app(pkg("YEARLY", 12), new BigDecimal("100.00"), 1, LocalDateTime.now());
        List<Payment> payments = List.of(
                payment(400L, 1, PaymentStatus.REJECTED, app.getCustomer()),
                payment(401L, 1, PaymentStatus.VERIFIED, app.getCustomer()));

        InstallmentEntry entry = PremiumScheduleUtil.buildSchedule(app, payments).getSchedule().get(0);

        assertEquals(401L, entry.getPaymentId());
        assertEquals("PAID", entry.getStatus());
    }

    @Test
    void recordsPreviousOwnerAsPayerAfterTransfer() {
        PolicyApplication app = app(pkg("YEARLY", 12), new BigDecimal("100.00"), 1, LocalDateTime.now());
        User previousOwner = user(2L, "previous");
        List<Payment> payments = List.of(payment(500L, 1, PaymentStatus.VERIFIED, previousOwner));

        InstallmentEntry entry = PremiumScheduleUtil.buildSchedule(app, payments).getSchedule().get(0);

        assertEquals("previous", entry.getPaidByName());
        assertEquals(2L, entry.getPaidByCustomerId());
    }

    @Test
    void buildsPeriodLabelsPerFrequency() {
        int year = LocalDate.now().getYear();

        assertEquals("Q1 " + year, firstLabel("QUARTERLY", 3));
        assertEquals("1st Half " + year, firstLabel("HALF_YEARLY", 6));
        assertEquals("Year 1", firstLabel("YEARLY", 12));
        assertEquals("Period 1", firstLabel("WEEKLY", 12));
    }

    private String firstLabel(String frequency, int intervalMonths) {
        PolicyApplication app = app(pkg(frequency, intervalMonths), new BigDecimal("120.00"), 1, LocalDateTime.now());
        return PremiumScheduleUtil.buildSchedule(app, List.of()).getSchedule().get(0).getPeriodLabel();
    }

    @Test
    void adminEntryPicksOverdueOrDuePeriodFirst() {
        PolicyApplication app = app(pkg("MONTHLY", 1), new BigDecimal("1200.00"), 1,
                LocalDateTime.now().minusMonths(3));
        List<Payment> payments = List.of(payment(600L, 1, PaymentStatus.VERIFIED, app.getCustomer()));

        AdminScheduleEntryResponse entry = PremiumScheduleUtil.buildAdminEntry(app, payments);

        assertNotNull(entry);
        assertEquals(2, entry.getCurrentPeriodNumber());
        assertEquals("OVERDUE", entry.getScheduleStatus());
        assertEquals(1L, entry.getCustomerId());
        assertEquals("owner", entry.getCustomerName());
        assertEquals(11L, entry.getApplicationId());
        assertEquals("POL-LIF-2026-000001", entry.getPolicyNumber());
        assertEquals(12, entry.getTotalInstallments());
        assertEquals(1, entry.getPaidInstallments());
    }

    @Test
    void adminEntryFallsBackToUpcomingThenLastPeriod() {
        PolicyApplication upcoming = app(pkg("MONTHLY", 1), new BigDecimal("1200.00"), 1,
                LocalDateTime.now().plusMonths(1));
        assertEquals("UPCOMING", PremiumScheduleUtil.buildAdminEntry(upcoming, List.of()).getScheduleStatus());

        PolicyApplication fullyPaid = app(pkg("YEARLY", 12), new BigDecimal("100.00"), 1, LocalDateTime.now());
        AdminScheduleEntryResponse paid = PremiumScheduleUtil.buildAdminEntry(fullyPaid,
                List.of(payment(700L, 1, PaymentStatus.VERIFIED, fullyPaid.getCustomer())));

        assertEquals("PAID", paid.getScheduleStatus());
        assertEquals(1, paid.getCurrentPeriodNumber());
    }
}
