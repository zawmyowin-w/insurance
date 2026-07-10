package com.insurance.portal.config;

import com.insurance.portal.model.InsurancePackage;
import com.insurance.portal.repository.InsurancePackageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final InsurancePackageRepository packageRepo;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedPackages();
    }

    private void seedPackages() {
        if (packageRepo.count() > 0) return; // already seeded

        List<InsurancePackage> packages = List.of(
            InsurancePackage.builder()
                .name("Basic Life Protection")
                .type("LIFE")
                .description("Essential life coverage for individuals and families.")
                .coverageMin(new BigDecimal("5000000.00"))
                .coverageMax(new BigDecimal("50000000.00"))
                .premiumRate(new BigDecimal("0.0200"))
                .durationsJson("1,2,3,5")
                .benefitsJson("Death benefit payout\nAccidental death coverage\n24/7 customer support\nDigital policy documents")
                .active(true).build(),

            InsurancePackage.builder()
                .name("Premium Life Shield")
                .type("LIFE")
                .description("Comprehensive life coverage with added riders for critical illness.")
                .coverageMin(new BigDecimal("20000000.00"))
                .coverageMax(new BigDecimal("200000000.00"))
                .premiumRate(new BigDecimal("0.0250"))
                .durationsJson("5,10,15,20")
                .benefitsJson("Death benefit payout\nCritical illness rider\nAccidental death & disability\nFree annual health check\nDigital policy documents")
                .active(true).build(),

            InsurancePackage.builder()
                .name("Health Plus")
                .type("HEALTH")
                .description("Full medical coverage including hospitalization and outpatient care.")
                .coverageMin(new BigDecimal("2000000.00"))
                .coverageMax(new BigDecimal("30000000.00"))
                .premiumRate(new BigDecimal("0.0250"))
                .durationsJson("1,2,3")
                .benefitsJson("Hospitalization coverage\nOutpatient treatment\nSurgery coverage\nEmergency evacuation\nMaternity benefits")
                .active(true).build(),

            InsurancePackage.builder()
                .name("Vehicle Protect Plus")
                .type("VEHICLE")
                .description("Comprehensive vehicle insurance for cars, motorcycles and commercial vehicles.")
                .coverageMin(new BigDecimal("3000000.00"))
                .coverageMax(new BigDecimal("80000000.00"))
                .premiumRate(new BigDecimal("0.0300"))
                .durationsJson("1,2,3")
                .benefitsJson("Accident repair costs\nTheft protection\nThird-party liability\nRoadside assistance\nFire and flood damage")
                .active(true).build(),

            InsurancePackage.builder()
                .name("Home & Property Shield")
                .type("PROPERTY")
                .description("Protect your home and valuables against damage, theft and natural disasters.")
                .coverageMin(new BigDecimal("10000000.00"))
                .coverageMax(new BigDecimal("500000000.00"))
                .premiumRate(new BigDecimal("0.0150"))
                .durationsJson("1,2,3,5")
                .benefitsJson("Structural damage coverage\nContents protection\nTheft and burglary\nNatural disaster coverage\nTemporary accommodation allowance")
                .active(true).build(),

            InsurancePackage.builder()
                .name("SME Business Protect")
                .type("PROPERTY")
                .description("Business interruption and asset protection for small and medium enterprises.")
                .coverageMin(new BigDecimal("50000000.00"))
                .coverageMax(new BigDecimal("1000000000.00"))
                .premiumRate(new BigDecimal("0.0180"))
                .durationsJson("1,2,3")
                .benefitsJson("Business interruption\nEquipment and asset coverage\nLiability protection\nEmployee accident coverage\nFire and theft")
                .active(true).build()
        );

        packageRepo.saveAll(packages);
        log.info("✅ Seeded {} default insurance packages", packages.size());
    }
}
