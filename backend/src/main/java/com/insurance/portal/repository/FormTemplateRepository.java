package com.insurance.portal.repository;

import com.insurance.portal.model.FormTemplate;
import com.insurance.portal.model.enums.FormType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FormTemplateRepository extends JpaRepository<FormTemplate, Long> {
    List<FormTemplate> findAllByInsuranceType(String insuranceType);
    List<FormTemplate> findAllByFormType(FormType formType);
    List<FormTemplate> findAllByInsuranceTypeAndFormType(String insuranceType, FormType formType);
    Optional<FormTemplate> findFirstByInsuranceTypeAndFormTypeAndActiveTrue(String insuranceType, FormType formType);
}
