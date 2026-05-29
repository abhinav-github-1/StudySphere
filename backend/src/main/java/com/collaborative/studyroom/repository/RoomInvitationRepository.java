package com.collaborative.studyroom.repository;

import com.collaborative.studyroom.model.RoomInvitation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomInvitationRepository extends MongoRepository<RoomInvitation, String> {

    List<RoomInvitation> findByReceiverEmailOrderByCreatedAtDesc(String email);

    @Query("{ 'senderId' : ?0 }")
    List<RoomInvitation> findBySenderIdOrderByCreatedAtDesc(String senderId);

    List<RoomInvitation> findByRoomId(String roomId);

    Optional<RoomInvitation> findByRoomIdAndReceiverEmailAndStatus(String roomId, String receiverEmail, String status);

    List<RoomInvitation> findByRoomIdAndReceiverEmail(String roomId, String receiverEmail);
}
