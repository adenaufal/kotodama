# Kotodama Documentation

Welcome to the Kotodama documentation! This directory contains all project documentation organized by category.

Kotodama is **reply-only**: it reads the tweet you are replying to (text, preceding thread, and
images via a vision model), shows that reading, and drafts a reply in your brand voice. Compose-a-
new-tweet, thread generation, and thread posting were removed in the reply-only pivot (v1.8.0).
Documents describing the older product were deleted in that release — recover them from git history
if you need them.

## Quick Navigation

### Getting Started
- [Quickstart Guide](guides/QUICKSTART.md) - Get up and running quickly
- [Quick Reference](guides/QUICK_REFERENCE.md) - Common tasks and commands at a glance

### Development
- [Development Guide](development/DEVELOPMENT.md) - Development setup, workflows, and conventions

### Testing
- [Testing Guide](testing/TESTING.md) - Manual test plan for the reply flow
- [Testing Recommendations](testing/TESTING-RECOMMENDATIONS.md) - Highest-value untested areas
- [Testing Checklist](testing/tested-checklist-18102025.md) - _Historical_ — last manual pass, taken before the pivot. **The reply-only build has not been manually tested.**
- [Performance Test Results](testing/PERFORMANCE-TEST-RESULTS.md) - _Historical_ — pre-pivot benchmarks

### Reference
- [API Reference](reference/API_REFERENCE.md) - Provider client signatures, shapes, and dispatch
- [Model Reference](reference/MODEL_REFERENCE.md) - AI model configurations and caveats
- [Agents Reference](reference/AGENTS.md) - Handbook for agents working in this repo

### Project Information
- [Project Map](project/PROJECT_MAP.md) - Codebase structure and architecture overview
- [TODO](project/TODO.md) - Planned features and improvements
- [Release Notes](project/README_RELEASES.md) - Release process documentation
- [Recent Updates (2026)](project/UPDATES_2026.md) - Release timeline, incl. the reply-only pivot

## Documentation Structure

```
docs/
├── development/    # Development guides and workflows
├── guides/         # User and quick-start guides
├── reference/      # API, model, and technical references
├── testing/        # Testing guides and results
└── project/        # Project planning and historical documents
```

## Contributing to Documentation

When adding new documentation:

1. Place files in the appropriate category directory
2. Use clear, descriptive filenames
3. Update this README.md index
4. Follow the existing markdown formatting conventions
5. Include code examples where applicable

## Documentation Maintenance

- Record each manual test session in a **new dated checklist** rather than editing an old one — `tested-checklist-18102025.md` is a record of what was tested on that date
- Update [TODO](project/TODO.md) when planning new features
- Add release notes to [Release Notes](project/README_RELEASES.md) for each release
- Document significant changes in UPDATES files
- **Pro-tip**: Use the agent workflow `/docs-update` to help keep these documents synchronized with code changes.
