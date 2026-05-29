package com.collaborative.studyroom.repository;

import com.collaborative.studyroom.model.StudySession;
import com.collaborative.studyroom.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudySessionRepository extends MongoRepository<StudySession, String> {

    List<StudySession> findByRoomId(String roomId);

    List<StudySession> findByStatus(String status);

    List<StudySession> findByStartedBy(String email);

    Optional<StudySession> findByRoomIdAndStatus(String roomId, String status);

    @Query("{ 'participants.email' : ?0 }")
    List<StudySession> findByParticipantEmail(String email);

    List<StudySession> findByParticipantsContaining(User user);
}
