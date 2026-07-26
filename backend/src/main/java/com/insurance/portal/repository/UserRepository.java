package com.insurance.portal.repository;

import com.insurance.portal.model.User;
import com.insurance.portal.model.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByPhoneAndIdNot(String phone, Long id);
    boolean existsByPhone(String phone);
    List<User> findAllByRole(Role role);
    List<User> findAllByRoleAndActive(Role role, boolean active);
    java.util.Optional<User> findFirstByRoleAndInsuranceTypeAndActive(Role role, String insuranceType, boolean active);
}
