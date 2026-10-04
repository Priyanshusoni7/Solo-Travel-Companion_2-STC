package com.stc.stc.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.stc.stc.entity.Message;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

        @Query("SELECT m FROM Message m WHERE (m.sender.userId = :user1Id AND m.recipient.userId = :user2Id) OR " +
                        "(m.sender.userId = :user2Id AND m.recipient.userId = :user1Id) ORDER BY m.timestamp ASC")
        List<Message> findConversation(@Param("user1Id") String user1Id, @Param("user2Id") String user2Id);

        @Query("SELECT m FROM Message m WHERE m.recipient.userId = :userId AND m.read = false " +
                        "ORDER BY m.timestamp DESC")
        List<Message> findUnreadMessagesForUser(@Param("userId") String userId);
}