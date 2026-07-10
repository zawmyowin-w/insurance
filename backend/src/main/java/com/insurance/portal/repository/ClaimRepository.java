package com.insurance.portal.repository;

import com.insurance.portal.model.Claim;
import com.insurance.portal.model.User;
import com.insurance.portal.model.enums.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findAllByCustomer(User customer);
    List<Claim> findAllByCustomerAndStatus(User customer, ClaimStatus status);
    List<Claim> findAllByAgent(User agent);
    List<Claim> findAllByAgentAndStatus(User agent, ClaimStatus status);
    List<Claim> findAllByStatus(ClaimStatus status);
    long countByCustomerAndStatus(User customer, ClaimStatus status);
    long countByStatus(ClaimStatus status);

    void deleteAllByCustomer(User customer);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Claim c SET c.agent = null WHERE c.agent = :agent")
    void clearAgentFromClaims(User agent);
}
