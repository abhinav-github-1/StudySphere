package com.collaborative.studyroom.service;

import com.collaborative.studyroom.model.ActivityLog;
import com.collaborative.studyroom.model.StudyRoom;
import com.collaborative.studyroom.model.StudySession;
import com.collaborative.studyroom.model.User;
import com.collaborative.studyroom.repository.ActivityLogRepository;
import com.collaborative.studyroom.repository.StudyRoomRepository;
import com.collaborative.studyroom.repository.StudySessionRepository;
import com.collaborative.studyroom.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private StudySessionRepository studySessionRepository;

    @Autowired
    private StudyRoomRepository studyRoomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    /**
     * Compiles complete productivity analytics, activity timelines,
     * and session logs for the authenticated user.
     */
    public Map<String, Object> getDashboardOverview(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        // Fetch completed sessions in which user participated
        List<StudySession> sessions = studySessionRepository.findByParticipantEmail(userEmail).stream()
                .filter(s -> "COMPLETED".equals(s.getStatus()))
                .collect(Collectors.toList());

        // Basic stats calculations
        long totalSessions = sessions.size();
        double totalSeconds = sessions.stream().mapToLong(StudySession::getDurationInSeconds).sum();
        double totalStudyHours = Math.round((totalSeconds / 3600.0) * 10.0) / 10.0; // round to 1 decimal place

        // Fetch rooms statistics
        long activeRooms = studyRoomRepository.findByIsActiveTrue().size();
        long joinedRooms = studyRoomRepository.findByParticipantEmail(userEmail).size();

        double averageSessionLength = 0;
        double longestSession = 0;

        if (totalSessions > 0) {
            double totalMinutes = totalSeconds / 60.0;
            averageSessionLength = Math.round((totalMinutes / totalSessions) * 10.0) / 10.0;
            
            double maxSeconds = sessions.stream().mapToLong(StudySession::getDurationInSeconds).max().orElse(0);
            longestSession = Math.round((maxSeconds / 60.0) * 10.0) / 10.0;
        }

        // Productivity Summary: Past 7 Days Daily Breakdown
        Map<String, Double> weeklyBreakdown = new LinkedHashMap<>();
        LocalDate today = LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            String dayName = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            
            double dailySeconds = sessions.stream()
                    .filter(s -> s.getStartTime().toLocalDate().isEqual(date))
                    .mapToLong(StudySession::getDurationInSeconds)
                    .sum();
            
            double dailyHours = Math.round((dailySeconds / 3600.0) * 10.0) / 10.0;
            weeklyBreakdown.put(dayName, dailyHours);
        }

        // Monthly study hours (past 30 days)
        double monthlySeconds = sessions.stream()
                .filter(s -> s.getStartTime().toLocalDate().isAfter(today.minusDays(30)))
                .mapToLong(StudySession::getDurationInSeconds)
                .sum();
        double monthlyStudyHours = Math.round((monthlySeconds / 3600.0) * 10.0) / 10.0;

        // Streak calculation (consecutive days with at least 1 session)
        int streak = calculateStreak(sessions);

        // Find most active room
        String mostActiveRoom = "None";
        if (totalSessions > 0) {
            mostActiveRoom = sessions.stream()
                    .collect(Collectors.groupingBy(StudySession::getRoomName, Collectors.summingLong(StudySession::getDurationInSeconds)))
                    .entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("None");
        }

        // Fetch activity timeline (recent 15 activities logs chronological)
        List<ActivityLog> logs = activityLogRepository.findByUserIdOrderByTimestampDesc(user.getId());
        List<Map<String, Object>> timeline = logs.stream()
                .limit(15)
                .map(l -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", l.getId());
                    map.put("actionType", l.getActionType());
                    map.put("details", l.getDetails());
                    map.put("timestamp", l.getTimestamp().toString());
                    return map;
                })
                .collect(Collectors.toList());

        // Fetch last 5 completed sessions lists
        List<Map<String, Object>> recentSessions = sessions.stream()
                .sorted((s1, s2) -> s2.getStartTime().compareTo(s1.getStartTime()))
                .limit(5)
                .map(s -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", s.getId());
                    map.put("roomName", s.getRoomName());
                    map.put("startedByName", s.getStartedByName());
                    map.put("durationInSeconds", s.getDurationInSeconds());
                    map.put("startTime", s.getStartTime().toString());
                    map.put("participantCount", s.getParticipants().size());
                    return map;
                })
                .collect(Collectors.toList());

        // Build result container payload
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("totalStudyHours", totalStudyHours);
        dashboard.put("totalSessions", totalSessions);
        dashboard.put("activeRooms", activeRooms);
        dashboard.put("joinedRooms", joinedRooms);
        dashboard.put("averageSessionLength", averageSessionLength);
        dashboard.put("longestSession", longestSession);
        
        dashboard.put("weeklyBreakdown", weeklyBreakdown);
        dashboard.put("monthlyStudyHours", monthlyStudyHours);
        dashboard.put("studyStreak", streak);
        dashboard.put("mostActiveRoom", mostActiveRoom);
        
        dashboard.put("activityTimeline", timeline);
        dashboard.put("recentSessions", recentSessions);

        return dashboard;
    }

    private int calculateStreak(List<StudySession> sessions) {
        if (sessions.isEmpty()) return 0;

        Set<LocalDate> dates = sessions.stream()
                .map(s -> s.getStartTime().toLocalDate())
                .collect(Collectors.toSet());

        int maxStreak = 0;
        int currentStreak = 0;
        LocalDate checkDate = LocalDate.now();

        // Check back from today
        if (dates.contains(checkDate)) {
            while (dates.contains(checkDate)) {
                currentStreak++;
                checkDate = checkDate.minusDays(1);
            }
            return currentStreak;
        }

        // If not studying today, check if studied yesterday to sustain streak
        checkDate = LocalDate.now().minusDays(1);
        if (dates.contains(checkDate)) {
            while (dates.contains(checkDate)) {
                currentStreak++;
                checkDate = checkDate.minusDays(1);
            }
            return currentStreak;
        }

        return 0;
    }
}
