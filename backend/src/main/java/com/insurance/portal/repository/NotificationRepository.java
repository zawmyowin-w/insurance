package com.insurance.portal.repository;

import com.insurance.portal.model.Notification;
import com.insurance.portal.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findAllByRecipientOrderByCreatedAtDesc(User recipient);
    long countByRecipientAndReadFalse(User recipient);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient = :recipient")
    void markAllReadByRecipient(User recipient);
}
