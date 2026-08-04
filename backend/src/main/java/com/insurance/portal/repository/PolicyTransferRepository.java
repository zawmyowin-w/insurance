package com.insurance.portal.repository;

import com.insurance.portal.model.PolicyTransfer;
import com.insurance.portal.model.User;
import com.insurance.portal.model.enums.TransferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PolicyTransferRepository extends JpaRepository<PolicyTransfer, Long> {

    List<PolicyTransfer> findAllByFromCustomerOrderByCreatedAtDesc(User fromCustomer);

    List<PolicyTransfer> findAllByToCustomerOrderByCreatedAtDesc(User toCustomer);

    List<PolicyTransfer> findAllByStatusOrderByCreatedAtDesc(TransferStatus status);

    List<PolicyTransfer> findAllByOrderByCreatedAtDesc();

    boolean existsByApplication_IdAndStatusIn(Long applicationId, List<TransferStatus> statuses);

    long countByStatus(TransferStatus status);

    /** Check whether an approved transfer exists for this policy to this recipient. */
    boolean existsByApplication_IdAndToCustomer_IdAndStatus(Long appId, Long toCustomerId, TransferStatus status);

    /** Fetch the approved transfer record for this policy and recipient. */
    java.util.Optional<PolicyTransfer> findTopByApplication_IdAndToCustomer_IdAndStatus(
            Long appId, Long toCustomerId, TransferStatus status);
}
