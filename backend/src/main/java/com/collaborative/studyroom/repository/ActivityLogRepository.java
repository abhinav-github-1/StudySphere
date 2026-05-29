package com.collaborative.studyroom.repository;

import com.collaborative.studyroom.model.ActivityLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends MongoRepository<ActivityLog, String> {

    // Find all logs for a specific user
    List<ActivityLog> findByUserId(String userId);
    List<ActivityLog> findByUserIdOrderByTimestampDesc(String userId);

    // Find all logs for a specific room
    List<ActivityLog> findByRoomId(String roomId);

    // Find logs by action type (e.g., ROOM_CREATED, ROOM_JOINED)
    List<ActivityLog> findByActionType(String actionType);
}
