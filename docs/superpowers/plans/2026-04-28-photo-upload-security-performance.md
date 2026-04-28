# Photo Upload Stability and Blog Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the 2C2G server stable during admin photo uploads while fixing the reviewed security issues.

**Architecture:** Photo uploads are accepted into a disk-backed in-memory queue and processed by one worker at a time. Security hardening stays in small Express middleware and route-level checks. OneDrive sync remains deprecated and is not mounted.

**Tech Stack:** Express 5, React 19, TypeScript, multer disk storage, sharp, ali-oss, PostgreSQL.

---

## Implementation Checklist

- [ ] Harden `server.ts` with Helmet, CORS origin policy, JSON body limit, and pageview rate limiting.
- [ ] Harden auth so production requires `JWT_SECRET` and `ADMIN_PASSWORD_HASH`, while development keeps local defaults.
- [ ] Add lightweight in-memory rate limiting for login, comments, and pageviews.
- [ ] Add disk-backed photo upload queue with one active image-processing worker.
- [ ] Move the photo media helpers used by uploads out of the deprecated OneDrive namespace.
- [ ] Refactor `src/routes/photos.ts` so upload returns `jobId`, job status is queryable, hidden metadata requires auth, and temporary files are cleaned.
- [ ] Update admin photo upload UI to poll job progress.
- [ ] Update environment defaults and docs for lower batch limits and upload temp settings.
- [ ] Verify with lint/build commands and manual API scenarios where possible.

## Behavior Decisions

- Upload stability has priority over throughput: only one image is processed at a time.
- The `full`, `medium`, and `tiny` image output specs and JPEG quality stay unchanged.
- The upload queue is in-memory; service restart loses unfinished jobs and startup cleanup handles temp files.
- OneDrive route/service/state/graph/config/types remain deprecated and are not repaired or mounted.
- No database schema changes are required.
