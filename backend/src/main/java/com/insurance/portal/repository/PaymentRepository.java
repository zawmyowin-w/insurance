package com.insurance.portal.repository;

import com.insurance.portal.model.Payment;
import com.insurance.portal.model.User;
import com.insurance.portal.model.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findAllByCustomer(User customer);
    List<Payment> findAllByStatus(PaymentStatus status);
    boolean existsByApplication_IdAndStatus(Long applicationId, PaymentStatus status);
}
