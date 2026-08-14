package com.insurance.portal.service;

import com.insurance.portal.model.Notification;
import com.insurance.portal.model.User;
import com.insurance.portal.model.enums.NotificationType;
import com.insurance.portal.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notifRepo;

    @InjectMocks
    private NotificationService service;

    private static User user(long id) {
        return User.builder().id(id).name("user" + id).email("user" + id + "@example.com").build();
    }

    @Test
    void sendPersistsNotificationForRecipient() {
        User recipient = user(1L);

        service.send(recipient, "Approved", "Your policy is approved", NotificationType.APPROVAL);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notifRepo).save(captor.capture());
        Notification saved = captor.getValue();
        assertEquals(recipient, saved.getRecipient());
        assertEquals("Approved", saved.getTitle());
        assertEquals("Your policy is approved", saved.getMessage());
        assertEquals(NotificationType.APPROVAL, saved.getType());
    }

    @Test
    void sendToAllPersistsOneNotificationPerRecipient() {
        List<User> recipients = List.of(user(1L), user(2L));

        service.sendToAll(recipients, "Notice", "Scheduled maintenance", NotificationType.INFO, "AGENT");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notifRepo).saveAll(captor.capture());
        List<Notification> saved = captor.getValue();
        assertEquals(2, saved.size());
        assertEquals(recipients.get(0), saved.get(0).getRecipient());
        assertEquals("AGENT", saved.get(1).getTargetRole());
        assertEquals(NotificationType.INFO, saved.get(1).getType());
    }

    @Test
    void countUnreadCountsOnlyUnreadNotifications() {
        User recipient = user(1L);
        Notification read = Notification.builder().recipient(recipient).title("a").build();
        read.setRead(true);
        Notification unread = Notification.builder().recipient(recipient).title("b").build();
        when(notifRepo.findAllByRecipientOrderByCreatedAtDesc(recipient)).thenReturn(List.of(read, unread));

        assertEquals(1, service.countUnread(recipient));
    }
}
