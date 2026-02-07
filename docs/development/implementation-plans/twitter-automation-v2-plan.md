# Implementation Plan: Twitter Automation v2 (Velocity Upgrade)

**Target:** Refactor codebase to align with Velocity-Based Ranking.
**Design Spec:** `docs/development/design-specs/twitter-automation-v2.md`

## Phase 1: Foundation & Refactoring (Week 1)

### 1.1 Scheduler Engine Refactor
- [ ] **Create `BurstScheduler` Class**:
    - Implement `define_burst_window(start_time, duration)` method.
    - Implement `calculate_safe_interval(target_posts, duration)` logic.
    - **Deprecate** old fixed-interval cron jobs.
- [ ] **Update Configuration**:
    - Add `MAX_BURST_VELOCITY` settings to `config.yaml` or `.env`.

### 1.2 Content Pipeline Update
- [ ] **Enhance `TextGenerator`**:
    - **Integrate Brand Voice**: Connect to `BrandVoiceManager` to inject `guidelines` and `toneAttributes` into the LLM system prompt.
    - **Context-Aware Logic**:
        - For threads/replies: Pass the "Parent Tweet" and "Previous Replies" to the LLM to ensure continuity.
    - **Variation Engine**: Ensure 50+ unique outputs per topic while maintaining the selected Brand Voice.
    - Add logic to append 1-2 sentences to all media attachments.
- [ ] **Validation Layer**:
    - Implement `SimilarityCheck` function (Levenshtein distance or embedding cosine similarity) to reject duplicates before posting.

## Phase 2: Verification & Optimization (Week 2)

### 2.1 Metrics & Safety
- [ ] **Track "Velocity"**: Real-time logging of posts/minute to ensure we hit target burst speeds.
- [ ] **Account Rotation (Basic)**:
    - Simple round-robin logic to ensure load balancing across accounts during a burst.

## Future Considerations (Post-Phase 1)

- **Thread Monitor & Auto-Reply**: Developing a system to reply to users to increase conversation depth (as per new algo requirements).
- **Advanced Account Rotation**: Dynamic account switching based on health scores.
- **Quote Tweet Support**: Adding capability to quote tweet instead of just reposting.

## Verification Plan

### Automated Tests
- Run `test_burst_scheduler.py`: Verify that 100 posts scheduled for a 60-min window result in average intervals of ~36s with variance.
- Run `test_similarity_check.py`: Feed 2 identical strings, expect rejection.

### Manual Verification
- **Dry Run**: Run the bot in `DRY_RUN` mode during a dummy burst window. Check logs for:
    - Calculated intervals (irregular spacing).
    - Generated content uniqueness (no duplicates).
    - Adherence to `MAX_BURST_VELOCITY`.
