package com.insurance.portal.repository;

import com.insurance.portal.model.PolicyApplication;
import com.insurance.portal.model.User;
import com.insurance.portal.model.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PolicyApplicationRepository extends JpaRepository<PolicyApplication, Long> {
    List<PolicyApplication> findAllByCustomer(User customer);
    List<PolicyApplication> findAllByCustomerAndStatus(User customer, ApplicationStatus status);
    List<PolicyApplication> findAllByAgent(User agent);
    List<PolicyApplication> findAllByAgentAndStatus(User agent, ApplicationStatus status);
    List<PolicyApplication> findAllByStatus(ApplicationStatus status);
    long countByCustomer(User customer);
    long countByCustomerAndStatus(User customer, ApplicationStatus status);
    long countByStatus(ApplicationStatus status);

    @Query("SELECT a FROM PolicyApplication a WHERE a.customer = :customer AND a.status = 'APPROVED'")
    List<PolicyApplication> findApprovedByCustomer(User customer);
}
