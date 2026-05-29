package com.collaborative.studyroom.repository;

import com.collaborative.studyroom.model.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    /**
     * Returns all messages in a room, oldest first (for display order).
     */
    List<ChatMessage> findByRoomIdOrderByTimestampAsc(String roomId);

    /**
     * Returns last 50 messages in a room for chat history on page load.
     * Descending query so we get the newest 50, then the caller reverses them.
     */
    List<ChatMessage> findTop50ByRoomIdOrderByTimestampDesc(String roomId);
}
