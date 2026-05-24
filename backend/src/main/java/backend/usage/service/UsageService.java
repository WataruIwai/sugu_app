package backend.usage.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import backend.exception.NotFoundException;
import backend.usage.domain.GuestUsageCount;
import backend.usage.domain.UserUsageCount;
import backend.usage.repository.UsageRepository;

@Service
public class UsageService {
    private UsageRepository usageRepository;

    public UsageService(UsageRepository usageRepository) {
        this.usageRepository = usageRepository;
    }

    @Transactional
    public void addBonusSearchCountToUser(Long userId) {
        UserUsageCount userUsage = usageRepository.getUserUsage(userId).orElseThrow(() ->
        new NotFoundException("Usage not found"));
        usageRepository.addBonusCountToUserUsage(userUsage);
    }

    @Transactional
    public void addBonusSearchCountToGuest(String guestId) {
        GuestUsageCount guestUsage = usageRepository.getGuestUsage(guestId).orElseThrow(() ->
        new NotFoundException("Usage not found"));
        usageRepository.addBonusCountToGuestUsage(guestUsage);
    }
}
