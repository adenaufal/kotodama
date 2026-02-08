# Kotodama Documentation

Welcome to the Kotodama documentation! This directory contains all project documentation organized by category.

## Quick Navigation

### Getting Started
- [Quickstart Guide](guides/QUICKSTART.md) - Get up and running quickly
- [Quick Reference](guides/QUICK_REFERENCE.md) - Common tasks and commands at a glance

### Development
- [Development Guide](development/DEVELOPMENT.md) - Development setup, workflows, and conventions

### Testing
- [Testing Guide](testing/TESTING.md) - Comprehensive testing documentation
- [Testing Recommendations](testing/TESTING-RECOMMENDATIONS.md) - Best practices for testing
- [Testing Checklist](testing/tested-checklist-18102025.md) - Current testing status
- [Performance Test Results](testing/PERFORMANCE-TEST-RESULTS.md) - Performance benchmarks and analysis

### Reference
- [API Reference](reference/API_REFERENCE.md) - API endpoints and usage
- [Model Reference](reference/MODEL_REFERENCE.md) - AI model configurations and capabilities
- [Agents Reference](reference/AGENTS.md) - AI agent types and behaviors

### Project Information
- [Product Requirements Document](project/prd.md) - Original product requirements and specifications
- [Project Map](project/PROJECT_MAP.md) - Codebase structure and architecture overview
- [Implementation Summary](project/IMPLEMENTATION_SUMMARY.md) - Key implementation decisions and patterns
- [Project Summary](project/SUMMARY.md) - High-level project overview
- [TODO](project/TODO.md) - Planned features and improvements
- [Release Notes](project/README_RELEASES.md) - Release process documentation
- [Recent Updates (2026)](project/UPDATES_2026.md) - Latest breakthrough changes (v1.6.0, v1.7.0)
- [Updates (2025)](project/UPDATES_2025.md) - Archive of 2025 development
- [Final Updates (2025)](project/UPDATES_FINAL_2025.md) - v1.3.0 snapshot
- [Reply Context Fix](project/REPLY-CONTEXT-FIX.md) - Technical fix documentation

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

- Keep the [Testing Checklist](testing/tested-checklist-18102025.md) up to date after testing sessions
- Update [TODO](project/TODO.md) when planning new features
- Add release notes to [Release Notes](project/README_RELEASES.md) for each release
- Document significant changes in UPDATES files
- **Pro-tip**: Use the agent workflow `/docs-update` to help keep these documents synchronized with code changes.
