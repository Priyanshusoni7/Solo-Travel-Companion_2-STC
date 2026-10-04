package com.stc.stc.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.stc.stc.entity.CommunityMessage;

@Repository
public interface CommunityMessageRepository extends JpaRepository<CommunityMessage, Long> {
    Page<CommunityMessage> findByOrderByTimestampDesc(Pageable pageable);
}
