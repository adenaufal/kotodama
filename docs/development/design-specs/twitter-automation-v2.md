# Twitter Automation System v2 Design Specification

**Status:** Draft
**Date:** 2026-01-29
**References:**
- `docs/development/twitter-updates-algo.md` (Algorithm Analysis)
- `docs/development/G-tezYAbQAAJHAX.jpeg` (System Architecture Diagram)

## 1. Executive Summary

The v2 update is driven by X's shift from **Volume-Based Ranking** to **Velocity-Based Ranking**. The new system prioritizes "speed, freshness, and quality of conversations" over raw post count. This design outlines the architectural and logic changes required to transition our automation strategy from "mass posting" to "coordinated bursts" and "high-quality engagement".

## 2. Core Functional Requirements

### 2.1 Velocity & Burst Management
- **Requirement:** The system must support "Burst Windows" (e.g., 30-60 minute active periods) rather than continuous low-volume posting.
- **Goal:** Trigger "sudden spikes in activity" to signal trending potential.
- **Constraints:** Avoid robotic frequency (posting every few seconds). Randomize intervals within the high-velocity window.

### 2.2 Content Diversity & Quality
- **Requirement:** Eliminate "copy-paste" behavior.
- **Requirement:** All media posts (images/GIFs) must include 1-2 sentences of descriptive text.
- **Requirement:** Strategy shift from "Simple Repost" to "Quote Tweet + Opinion".

### 2.3 Interaction-First Logic
- **Requirement:** Prioritize replies, comments, and threads over isolated posts.
- **Requirement:** "Don't Disappear" logic: The bot must monitor its own threads and reply to engagement to keep the conversation alive.

## 3. System Architecture

*(Refer to `docs/development/G-tezYAbQAAJHAX.jpeg` for the visual architecture)*

### 3.1 Module Updates

#### A. Scheduler Engine (The "Heartbeat")
- **Current State:** Likely fixed interval or simple randomization.
- **New State:** **BurstScheduler**.
    - Defines `ActiveSessions` (e.g., 09:00-09:45).
    - Calculates `TargetVelocity` (e.g., 5 posts/min distributed across accounts).
    - Enforces "Cool-down" periods to prevent shadow suppression.

#### B. Content Generator (The "Brain")
- **New Logic:** `VariationEngine`.
    - **Inputs:**
        - `CoreKeyword/Message`
        - `BrandVoiceProfile`: (`guidelines`, `toneAttributes`, `exampleTweets` from `BrandVoiceManager`).
        - `ThreadContext`: (If replying/quoting) The text of the parent tweet and recent replies.
    - **Process:**
        - Constructs a prompt: *"Acting as [BrandName] with [Tone], reply to this conversation [Context] using this key point [CoreMessage]. Variation #X."*
    - **Output:** 50+ unique variations that sound authentic and contextually relevant.
    - **Validation:** Checks similarity score against recent posts.

#### C. Engagement & Interaction (Future Scope)
- **Planned Module:** `ConversationManager`.
    - **Monitor:** Listens for replies to bot posts.
    - **Action:** Generates context-aware replies.
    - **Cross-Pollination:** Detects relevant external conversations.

## 4. Data Model Changes

### 4.1 New Entities

- **BurstCampaign**
    - `id`, `start_time`, `end_time`, `target_keyword`, `accounts_involved`
    
- **ConversationThread (Future)**
    - Tracks conversation depth (Planned for Phase 2).

## 5. Risk Management (Anti-Pattern Avoidance)

| Risk Factor | Mitigation Strategy |
| :--- | :--- |
| **Spam Flagging** | Strict unique content check; `MAX_BURST_VELOCITY` limits. |
| **Shadowban** | Randomized intervals within burst windows. |
| **Low Quality** | Enforce "No empty hashtags" and "No isolated media" rules. |

## 6. Success Metrics

- **Velocity Score:** Posts per minute during Burst Windows.
- **Uniqueness Rate:** % of posts passing similarity checks.
