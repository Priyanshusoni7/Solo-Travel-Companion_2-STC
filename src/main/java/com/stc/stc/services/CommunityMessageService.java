package com.stc.stc.services;

import java.util.List;
import com.stc.stc.dto.CommunityDto;

public interface CommunityMessageService {
    CommunityDto saveCommunityMessage(CommunityDto dto);
    List<CommunityDto> getRecentMessages(int page, int size);
}
