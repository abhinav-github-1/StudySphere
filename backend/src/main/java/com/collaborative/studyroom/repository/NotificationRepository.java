package com.collaborative.studyroom.repository;

import com.collaborative.studyroom.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(String email);

    List<Notification> findByUserIdAndIsReadFalse(String email);

    long countByUserIdAndIsReadFalse(String email);
}
