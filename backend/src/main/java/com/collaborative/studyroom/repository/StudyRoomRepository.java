package com.collaborative.studyroom.repository;

import com.collaborative.studyroom.model.StudyRoom;
import com.collaborative.studyroom.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyRoomRepository extends MongoRepository<StudyRoom, String> {

    // Find rooms where a user is in the participants list (by email)
    @Query("{ 'participants.email': ?0 }")
    List<StudyRoom> findByParticipantEmail(String email);

    // Find rooms created by a specific user (by email)
    @Query("{ 'createdBy.email': ?0 }")
    List<StudyRoom> findByCreatedByEmail(String email);

    // Find all active rooms
    List<StudyRoom> findByIsActiveTrue();

    // Find rooms by subject for filtering
    List<StudyRoom> findBySubject(String subject);
}
