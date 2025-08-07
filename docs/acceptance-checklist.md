### Acceptance Checklist

- FR-01 Daily Quiz
  - [ ] Daily quiz exists for user by 04:00 local time
  - [ ] Contains exactly 5 questions
  - [ ] Only `approved_at` NOT NULL questions served
  - [ ] Resets every 24h (unique per user, per date)

- FR-02 Resume Incomplete
  - [ ] Progress persists within 15s after last action
  - [ ] Returning user resumes session with answered items intact

- FR-03 Teacher Assignments
  - [ ] Assignment visible to all group members ≤ 1 minute after creation
  - [ ] Non-members cannot access assignment

- FR-04 Scholar Approval
  - [ ] Questions without `approved_at` never served in daily quiz or assignments
  - [ ] Only scholar/admin can set `approved_at` via approval endpoint