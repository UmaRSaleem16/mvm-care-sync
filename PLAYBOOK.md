# MVM CareSync — End-User Playbook

> **Version:** v2 (Phases 1–13 — Full feature set including email notifications, calendar, and role enforcement)
> **Audience:** All portal users — Admins, Coordinators, Staff, Read-only
> **Test accounts (dev/local):** see Section 2

---

## Table of Contents

1. [Who Uses This Portal?](#1-who-uses-this-portal)
2. [Logging In & Account Access](#2-logging-in--account-access)
3. [Dashboard — Your Daily View](#3-dashboard--your-daily-view)
4. [Case Requests — Full Workflow](#4-case-requests--full-workflow)
   - [Create a New Request](#41-create-a-new-request)
   - [Submit a Draft](#42-submit-a-draft)
   - [View & Filter All Requests](#43-view--filter-all-requests)
   - [Request Detail & Actions](#44-request-detail--actions)
5. [Request Status Reference](#5-request-status-reference)
6. [Email Notifications & Teams](#6-email-notifications--teams)
7. [Vendor Management](#7-vendor-management)
   - [Add a Vendor](#71-add-a-vendor)
   - [Edit a Vendor](#72-edit-a-vendor)
   - [What Makes a Vendor "Bookable"](#73-what-makes-a-vendor-bookable)
8. [Facility Management](#8-facility-management)
9. [Calendar View](#9-calendar-view)
10. [Vendor Auto-Matching — How It Works](#10-vendor-auto-matching--how-it-works)
11. [PHI Rules — What You Can and Cannot Enter](#11-phi-rules--what-you-can-and-cannot-enter)
12. [Profile & Password Management](#12-profile--password-management)
13. [User Management (Admin Only)](#13-user-management-admin-only)
14. [Role Permissions Matrix](#14-role-permissions-matrix)
15. [Common Use Cases — Step-by-Step](#15-common-use-cases--step-by-step)
16. [Error Messages & What They Mean](#16-error-messages--what-they-mean)
17. [Admin-Only Operations (Django Admin)](#17-admin-only-operations-django-admin)

---

## 1. Who Uses This Portal?

The portal has four roles. Every user is assigned exactly one.

| Role | Display Name | What They Can Do |
|------|-------------|------------------|
| **admin** | Administrator | Everything — full CRUD, user management, delete requests, all status transitions, notification logs |
| **coordinator** | ASC Coordinator | Create, submit, confirm, cancel, complete requests; manage vendors and facilities; view notification logs |
| **staff** | Staff | Create and submit requests; flag backup needed; view vendors and facilities (read-only) |
| **readonly** | Read-Only | View requests, vendors, and facilities. Cannot create or change anything |

> Your role is shown in the sidebar bottom-left under your name.

**What each role CANNOT do:**

| Restriction | Applies to |
|-------------|------------|
| New Request link is hidden in sidebar | `readonly` |
| Cannot create or submit requests | `readonly` |
| Cannot confirm, cancel, or complete requests | `staff`, `readonly` |
| Cannot assign or change vendor | `staff`, `readonly` |
| Cannot add, edit, or deactivate vendors | `staff`, `readonly` |
| Cannot add, edit, or deactivate facilities | `staff`, `readonly` |
| Cannot edit other users' profiles | everyone except `admin` |
| Cannot view notification log | `staff`, `readonly` |
| Cannot access User Management | `coordinator`, `staff`, `readonly` |
| Cannot access Django Admin | `coordinator`, `staff`, `readonly` |

---

## 2. Logging In & Account Access

### Signing In

1. Open the portal: `http://localhost:3000` (local dev)
2. Enter your **username** and **password**
3. Click **Sign In**

**Default dev accounts (local only — change before any shared deployment):**

| Username | Password | Role |
|----------|----------|------|
| `admin` | `Admin123!` | Administrator |
| `coordinator1` | `Coord123!` | ASC Coordinator |
| `staff1` | `Staff123!` | Staff |
| `readonly1` | `Read123!` | Read-Only |

**If login fails:**
- Caps lock is a common issue — passwords are case-sensitive
- Use **Forgot your password?** below the Sign In button to reset via email
- Contact your administrator if you don't have access to the email on your account

**To log out:** Click **Sign Out** at the bottom of the left sidebar

---

### Forgot Password

1. On the login page, click **Forgot your password?**
2. Enter the email address on your account
3. Click **Send Reset Link**
4. Check your inbox for a reset email (valid for **24 hours**)
5. Click the link, enter a new password (min 8 chars, one uppercase letter, one number)
6. Click **Reset Password** — you'll be redirected to login automatically

> The system never reveals whether a specific email exists. If no email arrives within a few minutes, check spam or ask an admin to verify the email on your account.

---

## 3. Dashboard — Your Daily View

After login you land on the **Dashboard**. It auto-refreshes every 60 seconds.

### Stat Cards (top row)

| Card | What It Counts |
|------|---------------|
| **Open Requests** | Requests in Requested, Vendor Responded, or Backup Needed status |
| **Confirmed Today** | Requests moved to Confirmed status today |
| **Pending Response** | Requests sent to vendors awaiting reply (status = Requested) |
| **Backup Needed** | Requests where the primary vendor couldn't cover |

### Recent Requests Table

Shows the 5 most recently created requests. Click any row to open the full detail.

### Notifications Panel *(Coordinator + Admin only)*

Right-hand column — live feed of the last 8 email, Teams, or internal notifications sent by the system. Shows subject, facility, status (sent/failed), and timestamp. Click any row to go directly to the related request.

Updates every 30 seconds.

### What to check every morning

1. Scan **Backup Needed** — these need immediate attention
2. Check **Pending Response** — follow up with vendors if it's been 24+ hours
3. Coordinators: review the **Notifications Panel** for any recent failures (red "failed" chips)

---

## 4. Case Requests — Full Workflow

### 4.1 Create a New Request

**Who can do this:** Admin, Coordinator, Staff  
**Readonly users:** The "New Request" link is hidden in the sidebar and the page redirects to Requests.

1. Click **New Request** in the left sidebar  
2. Click **+ New Request** from the Requests list  
3. Complete the 3-step wizard

---

#### Step 1 — Case Basics

| Field | Required | Instructions |
|-------|----------|-------------|
| **Request Date** | Yes | The date the case is scheduled — defaults to today |
| **ASC / Facility** | Yes | Select the ambulatory surgery center |
| **Service Needed** | Yes | Select the service type (e.g. Anesthesia, CRNA, Neuro Monitoring) |

**Vendor Match Panel** appears automatically once you select both a facility and service type:

| Panel Appearance | Meaning |
|-----------------|---------|
| Green — "Auto-selected: [Vendor Name]" | Only one bookable vendor exists — assigned automatically |
| Green — "[N] vendors available" + stars (★) | Multiple vendors matched; ★ = preferred vendor |
| Orange — "No available vendors found" | No bookable vendors configured — save as draft, assign manually |

---

#### Step 2 — Case Timing

| Field | Required | Instructions |
|-------|----------|-------------|
| **Procedure / Case Type** | No | e.g. "Total knee arthroplasty" |
| **Requested Arrival Time** | No | When the vendor should arrive at the ASC |
| **Est. Case Start** | No | Expected case start time |
| **Est. Case End** | No | Must be after start time if entered |

---

#### Step 3 — Patient & Staff

| Field | Required | Instructions |
|-------|----------|-------------|
| **Patient Identifier** | Yes | **Initials or case ID ONLY** — see Section 11 |
| **Surgeon / Provider** | No | e.g. "Dr. Smith" |
| **Special Notes** | No | Equipment needs, access instructions for the vendor |

**Two submit options on the final step:**

- **Save as Draft** — saves without notifying anyone. Edit or submit later.
- **Submit Request** — transitions status to *Requested* and triggers vendor email notification.

---

### 4.2 Submit a Draft

1. Go to **Requests** → filter by Status = Draft
2. Click the draft row to open the detail page
3. Click **Submit Request** in the action bar
4. Status changes Draft → Requested; vendor notification email is sent automatically

---

### 4.3 View & Filter All Requests

1. Click **Request Tracker** in the left sidebar

**Search bar:** searches across patient identifier, surgeon/provider, and procedure type.

**Status filter:** narrows the list to any single status.

| Column | Description |
|--------|-------------|
| Date | Request date |
| Facility | ASC name |
| Service | Service type |
| Vendor | Assigned vendor (— if none) |
| Patient ID | Initials or case ID only |
| Surgeon | Surgeon/provider name |
| Status | Color-coded badge |

---

### 4.4 Request Detail & Actions

The detail page shows case information, assignment panel, notes, and full status history.

#### Action Bar — What You'll See

| Current Status | Available Actions | Who Sees Them |
|----------------|-------------------|---------------|
| **Draft** | Submit Request, Delete Draft | Submit: Staff + above · Delete: Coordinator + Admin |
| **Requested** | Confirm, Needs Backup, Cancel | Confirm/Cancel: Coordinator + Admin · Backup: Staff + above |
| **Vendor Responded** | Confirm, Needs Backup, Cancel | Same as above |
| **Backup Needed** | Confirm, Cancel | Coordinator + Admin |
| **Credentialing Pending** | Confirm, Cancel | Coordinator + Admin |
| **Confirmed** | Mark Complete, Cancel | Coordinator + Admin |
| **Cancelled / Completed** | *(no actions — request is closed)* | — |

> **Readonly users** see the full detail page but the action bar is completely hidden.

#### Confirm a Request

1. Open the request detail
2. Click **Confirm** in the action bar (Coordinator/Admin only)
3. A modal opens — enter confirmation notes (vendor arrival time, instructions)
4. Click **Confirm Request** — status moves to Confirmed; a confirmation email is sent to the requester

#### Cancel a Request

1. Click **Cancel** in the action bar (Coordinator/Admin only)
2. Enter a cancellation reason in the modal
3. Click **Cancel Request** — status moves to Cancelled; a cancellation email is sent to the vendor

> Records are **never deleted** — all cancellations and history are kept permanently.

#### Flag Backup Needed

1. Click **Needs Backup** in the action bar (Staff + above)
2. Enter a note explaining why backup is needed
3. Click **Flag Backup Needed** — status moves to Backup Needed, current vendor is cleared
4. A Coordinator/Admin can then assign a new vendor from the Assignment card

#### Assign or Change a Vendor *(Coordinator + Admin only)*

In the **Assignment** card:

1. Click the **assign** or **change** link next to Vendor
2. A dropdown appears showing vendors matching the facility + service type
   - Preferred vendors are marked with **★** and appear first
3. Select a vendor (or "— unassign —" to remove)
4. Click **Save**

If no vendors appear in the dropdown, there are no coverage rules configured for this facility/service combination — ask an Admin to add rules in Django Admin.

#### Mark Complete

1. Only available when status is **Confirmed**
2. Click **Mark Complete** — immediate transition, no modal
3. Status moves to Completed and is logged

#### Status History

Every status change is immutably recorded at the bottom of the detail: new status, notes, who made the change, and timestamp.

---

## 5. Request Status Reference

```
DRAFT → REQUESTED → VENDOR_RESPONDED → CONFIRMED → COMPLETED
                  ↘ BACKUP_NEEDED ──────────────────↗
                  ↘ CREDENTIALING_PENDING
         (any open status) → CANCELLED
```

| Status | Badge Color | Meaning | Action Needed |
|--------|------------|---------|---------------|
| **Draft** | Gray | Saved, not submitted. Vendor not notified. | Submit when ready |
| **Requested** | Blue | Submitted. Awaiting vendor confirmation. | Wait / follow up |
| **Vendor Responded** | Purple | Vendor acknowledged. | Coordinator confirms |
| **Confirmed** | Green | Vendor committed. | None unless changes arise |
| **Backup Needed** | Orange | Primary vendor unavailable. | Assign backup urgently |
| **Credentialing Pending** | Yellow | Vendor matched but credentialing not cleared. | Follow up on credentialing |
| **Cancelled** | Red | Request cancelled. No coverage. | Preserve record only |
| **Completed** | Teal | Case completed. | Archive |

---

## 6. Email Notifications & Teams

### What Triggers an Email

| Event | Who Gets the Email |
|-------|--------------------|
| Request submitted (Draft → Requested) | Vendor's primary contact; backup contact if set |
| Request cancelled | Assigned vendor |
| Request confirmed | Requester (the person who created the request) |
| Pending reminder sweep (every 8 hours) | Requester, if request has been in Requested or Backup Needed status for 24+ hours and a reminder hasn't been sent today |

### Teams Webhook

All the same events above also post a message to the Teams channel configured via the `TEAMS_WEBHOOK_URL` environment variable. If not set, Teams notifications are silently skipped.

### Notification Log *(Coordinator + Admin only)*

The Dashboard Notifications Panel and the `GET /api/v1/notifications/` endpoint show the last 50 entries from the notification log:
- Email type (📧), Teams (💬), or Internal (🔔)
- Status: **sent** (green), **failed** (red), **pending** (gray)
- Subject, facility, service type, and timestamp

Staff and Readonly users cannot access the notification log — it contains vendor contact details.

### What Emails Look Like

All emails are sent **from** `hello@demomailtrap.co` and delivered via Mailtrap's transactional API.

> **Dev note:** Mailtrap demo domain can only deliver to the account owner's verified email. Update a vendor's `contact_email` to your own address to test real delivery.

---

## 7. Vendor Management

**Who can do this:** Admin, Coordinator (add/edit/deactivate)  
**Staff and Readonly:** View only — Add, Edit, and Deactivate buttons are hidden

### 7.1 Add a Vendor

1. Click **Vendors** in the left sidebar
2. Click **+ Add Vendor**

| Field | Required | Notes |
|-------|----------|-------|
| **Vendor Name** | Yes | Full legal or business name |
| **Service Type** | Yes | Must match service types in the system |
| **Primary Contact Name** | Yes | |
| **Primary Contact Email** | Yes | Receives all case request notifications |
| **Primary Contact Phone** | No | |
| **Backup Contact** (name/email/phone) | No | Used for Backup Needed scenarios |
| **Contract Status** | Yes | Active / Pending / Expired / None |
| **Credentialing Status** | Yes | Approved / Pending / Expired / Not Required |
| **Services Provided** | No | Free text |
| **Notes** | No | Internal only — not sent to vendor |
| **Active** | Yes | Inactive vendors never appear in matching |

3. Click **Save**

---

### 7.2 Edit a Vendor

1. Go to **Vendors** → find the vendor (search by name, contact, email)
2. Click the pencil icon
3. Update fields → click **Save**

**To deactivate:** click the toggle icon → confirm → vendor disappears from matching and dropdown. Existing assigned requests are not affected.

---

### 7.3 What Makes a Vendor "Bookable"

```
Bookable = Active: YES
         + Contract Status: "Active"
         + Credentialing Status: "Approved" or "Not Required"
         + Coverage Rule: at least one rule linking this vendor to the facility + service type
```

If a vendor isn't appearing in the assignment dropdown: verify all four conditions above, then ask an Admin to check Coverage Rules in Django Admin.

---

## 8. Facility Management

**Who can do this:** Admin, Coordinator (add/edit/deactivate)  
**Staff and Readonly:** View only

1. Click **ASC Facilities** → **+ Add Facility**

| Field | Required |
|-------|----------|
| **Name** | Yes |
| **Address / City / State / Zip** | No |
| **Phone** | No |
| **Active** | Yes — inactive facilities don't appear in new request dropdowns |

Edit or deactivate the same way as vendors. Deactivating a facility doesn't affect existing requests linked to it.

---

## 9. Calendar View

Click **Calendar** in the left sidebar.

### Features

- **Month / Week / Day / Agenda** view toggle (top right of the calendar)
- **Prev / Next / Today** navigation
- Each event shows: status — service type — facility | vendor
- Events are **color-coded by status** (same palette as the status badges on the Requests page)
- Click any event to go directly to the request detail page

### Status Colors on Calendar

| Status | Color |
|--------|-------|
| Draft | Light gray |
| Requested | Blue |
| Vendor Responded | Purple |
| Confirmed | Green |
| Backup Needed | Orange |
| Credentialing Pending | Yellow/Amber |
| Cancelled | Red |
| Completed | Teal |

### Date Navigation

The calendar automatically loads requests for the visible date range (± 1 month). Navigating to a different month/week re-fetches automatically.

---

## 10. Vendor Auto-Matching — How It Works

When you select a Facility and Service Type in Step 1 of a new request, or open the vendor assignment dropdown on an existing request, the system queries active Coverage Rules and checks each linked vendor for bookability.

| Scenario | Result |
|----------|--------|
| No bookable vendors | Orange warning — save as draft, assign manually later |
| Exactly 1 vendor | Green auto-select — vendor pre-assigned |
| 2+ vendors | List of options — ★ marks preferred vendors |

Coverage Rules are configured by Administrators via Django Admin at `/admin/case_requests/vendorcoveragerule/`.

---

## 11. PHI Rules — What You Can and Cannot Enter

| Allowed ✓ | NOT Allowed ✗ |
|-----------|--------------|
| `J.D.` (initials) | `John Doe` (full name) |
| `CASE-2024-001` (case ID) | `DOB: 01/15/1980` |
| `TKA-0392` (procedure code) | `MRN: 123456` |
| `Dr. Smith` (surgeon name) | Patient SSN, diagnosis codes |

Both the frontend (pattern validation) and backend (length validation) enforce this. Procedure type, surgeon name, and notes fields are also subject to the same rule — no patient-identifiable data.

---

## 12. Profile & Password Management

### Update Your Profile

1. Click your name in the **bottom left of the sidebar**
2. Update first name, last name, email, department, phone in the **Account Information** card
3. Click **Save Changes**

> Role changes are not self-service — only an Administrator can change your role.

### Change Your Password (when logged in)

1. Go to your **Profile** page
2. In the **Change Password** card:
   - Enter your current password
   - Enter a new password (min 8 chars, one uppercase, one number)
   - Confirm the new password
3. Click **Update Password**

---

## 13. User Management (Admin Only)

Administrators manage all portal users from the **User Management** page.

- **User Management** appears in the sidebar only for Admin role, below a separator line
- Non-admin users are redirected to the dashboard if they navigate to `/users` directly

### Create a New User

1. Click **User Management** in the sidebar
2. Click **+ Add User**
3. Fill in: username, email, first/last name, initial password, role, department, phone
4. Click **Save**
5. Share credentials with the user — ask them to change their password via Profile on first login

### Edit a User

1. Click the pencil icon on any user row (Admin only — other roles get 403)
2. Update name, email, role, department, or phone
3. Click **Save**

### Deactivate / Reactivate a User

- Click the **deactivate** button (red icon) — they immediately lose portal access
- Click the **activate** button (green icon) to restore access
- You cannot deactivate your own account — the button is hidden for your own row

---

## 14. Role Permissions Matrix

| Action | Admin | Coordinator | Staff | Readonly |
|--------|:-----:|:-----------:|:-----:|:--------:|
| View Dashboard | ✓ | ✓ | ✓ | ✓ |
| View Calendar | ✓ | ✓ | ✓ | ✓ |
| View all Requests | ✓ | ✓ | ✓ | ✓ |
| **Create new Request** | ✓ | ✓ | ✓ | — |
| **Submit / Edit Request** | ✓ | ✓ | ✓ | — |
| **Flag Backup Needed** | ✓ | ✓ | ✓ | — |
| **Confirm** Request | ✓ | ✓ | — | — |
| **Cancel** Request | ✓ | ✓ | — | — |
| **Complete** Request | ✓ | ✓ | — | — |
| **Assign / Change Vendor** | ✓ | ✓ | — | — |
| **Delete Draft** | ✓ | ✓ | — | — |
| View Vendors | ✓ | ✓ | ✓ | ✓ |
| **Add / Edit / Deactivate Vendor** | ✓ | ✓ | — | — |
| View Facilities | ✓ | ✓ | ✓ | ✓ |
| **Add / Edit / Deactivate Facility** | ✓ | ✓ | — | — |
| View Notification Log | ✓ | ✓ | — | — |
| Update own Profile | ✓ | ✓ | ✓ | ✓ |
| Change own Password | ✓ | ✓ | ✓ | ✓ |
| **Edit other users' profiles** | ✓ | — | — | — |
| **User Management page** | ✓ | — | — | — |
| **Access Django Admin** | ✓ | — | — | — |
| **Configure Coverage Rules** | ✓ | — | — | — |

> Bold actions are enforced at both the API level (HTTP 403 if attempted without correct role) and the UI level (buttons/links hidden or page redirects).

---

## 15. Common Use Cases — Step-by-Step

---

### Use Case 1: Staff submits a new anesthesia coverage request

**Who:** Staff (`staff1` / `Staff123!`)

1. Log in as `staff1`
2. In the sidebar, click **New Request** (visible — staff can create)
3. **Step 1:** Set tomorrow's date, select **Carewell ASC**, select **Anesthesia**
   - The Vendor Match panel shows: "★ Premier Anesthesia Associates" (preferred) + "Valley Anesthesia Group"
4. **Step 2:** Enter procedure type: `Total knee arthroplasty`, arrival time `06:30`, start `07:00`
5. **Step 3:** Enter patient ID: `J.D.`, surgeon: `Dr. Smith`
6. Click **Submit Request** — status → Requested, vendor notification email triggered
7. Notice: the Request Detail page shows **no action bar** for Staff on a Requested item (Confirm, Cancel are hidden)

---

### Use Case 2: Coordinator confirms a request and assigns a vendor

**Who:** Coordinator (`coordinator1` / `Coord123!`)

1. Log in as `coordinator1`
2. Go to **Request Tracker** → find the request just submitted by staff
3. Click the row to open the detail
4. In the **Assignment** card, click **assign** next to Vendor
   - Dropdown shows: **★ Premier Anesthesia Associates** first (preferred), then Valley Anesthesia Group
5. Select **★ Premier Anesthesia Associates**, click **Save**
6. Click **Confirm** in the action bar
7. Modal opens — type: `Premier confirmed — arriving 6:30am, check in with OR desk`
8. Click **Confirm Request** — status → Confirmed, requester receives email

---

### Use Case 3: Primary vendor unavailable — find backup

**Who:** Coordinator (`coordinator1` / `Coord123!`)

1. Open a Requested request
2. Click **Needs Backup** in the action bar
3. Enter reason: `Primary vendor unavailable — last minute schedule conflict`
4. Click **Flag Backup Needed** — status → Backup Needed, vendor assignment cleared
5. In the Assignment card, click **assign**
6. Select a backup vendor from the dropdown
7. Click **Save**
8. Click **Confirm** → enter confirmation notes → **Confirm Request**

---

### Use Case 4: Readonly user views the system (read-only mode)

**Who:** Readonly (`readonly1` / `Read123!`)

1. Log in as `readonly1`
2. Sidebar shows: Dashboard, Vendors, ASC Facilities, Request Tracker, Calendar, Help
   - **New Request link is absent** — hidden for readonly role
3. Go to **Vendors** — the table loads but **+ Add Vendor**, pencil, and toggle buttons are all hidden
4. Go to **ASC Facilities** — cards show but no Edit / Deactivate buttons
5. Go to **Request Tracker** — no "New Request" button, empty state has no action link
6. Click any request row → detail page loads but **action bar is fully hidden**
7. Click **Dashboard** → notifications panel is not shown (staff/readonly don't see it)
8. Try navigating directly to `http://localhost:3000/requests/new` → redirected to `/requests` automatically

---

### Use Case 5: Admin manages users

**Who:** Admin (`admin` / `Admin123!`)

1. Log in as `admin`
2. In the sidebar, below the separator, click **User Management**
3. See all users with role badges, last login, and status
4. Click **+ Add User**, fill in details for a new staff member, set role to `staff`, click **Save**
5. Click the pencil icon on any user to edit their role or department
6. Click the deactivate icon on a user to immediately revoke their access
   - Your own row has no deactivate button

---

### Use Case 6: Cancelling a request

**Who:** Coordinator or Admin

1. Open any open (non-closed) request
2. Click **Cancel** in the action bar
3. Enter reason: `Case postponed — surgeon unavailable`
4. Click **Cancel Request** — status → Cancelled, cancellation email sent to vendor
5. The record is preserved permanently in the history with the reason

---

### Use Case 7: Calendar — viewing upcoming cases

**Who:** Any role

1. Click **Calendar** in the sidebar
2. The current month loads with all requests as colored events
3. Switch to **Week** view to see daily case density
4. Click any event to navigate directly to the request detail
5. Use the **Prev / Next** buttons to browse other months
6. Color coding: Green = Confirmed, Blue = Requested, Orange = Backup Needed, Red = Cancelled

---

### Use Case 8: Mark a case as complete after it happens

**Who:** Coordinator or Admin

1. Open a **Confirmed** request (the day after the case date)
2. Click **Mark Complete** in the action bar — no modal, immediate
3. Status → Completed, logged in history
4. Case now shows teal on the calendar

---

## 16. Error Messages & What They Mean

| Error | Cause | Fix |
|-------|-------|-----|
| `Request date is required` | No date selected | Pick a date in Step 1 |
| `Facility is required` | No facility selected | Pick from the dropdown |
| `Patient identifier must be at least 2 characters` | Field blank or 1 char | Enter initials or case ID |
| `Do not enter full patient names` | Value looks like "First Last" | Use initials (J.D.) or a case ID |
| `End time must be after start time` | End ≤ start | Fix the times in Step 2 |
| `Only draft requests can be submitted` | Already submitted | Request is in a later status |
| `This request cannot be confirmed from its current status` | Wrong status | Check valid transitions in Section 5 |
| `Request is already closed` | Tried to cancel Cancelled/Completed | No action needed |
| `Can only flag backup needed from requested or vendor-responded status` | Wrong status | Backup is only for Requested or Vendor Responded |
| `Only confirmed requests can be marked complete` | Status isn't Confirmed | Confirm first |
| `Vendor not found or not currently active` | Assigned vendor was deactivated | Pick another vendor |
| `Old password is incorrect` | Wrong current password | Re-enter correctly |
| `Passwords do not match` | Confirm doesn't match new | Re-enter both |
| `No available vendors found` (orange panel) | No bookable vendors for this combo | Save as draft; ask Admin to configure Coverage Rules |
| `403 Forbidden` on any action | Your role doesn't allow this action | Check Section 14 for your role's permissions |
| Session expired / redirected to login | JWT token expired (7-day lifetime) | Log in again — your data is safe |

---

## 17. Admin-Only Operations (Django Admin)

Accessible at `http://localhost:8000/admin/` — use your admin credentials.

> Most day-to-day user tasks (create user, change role, deactivate) are handled directly in the portal under **User Management**. Django Admin is mainly needed for Coverage Rules and low-level data access.

### Configuring Coverage Rules

Coverage Rules define which vendor(s) can cover which Facility + Service Type combination, and whether they are the preferred vendor.

1. Go to `http://localhost:8000/admin/case_requests/vendorcoveragerule/`
2. Click **+ Add Vendor Coverage Rule**
3. Set Facility, Service Type, Vendor
4. Check **Is Preferred** if this is the first-choice vendor for this facility + service
5. Make sure **Active** is checked
6. Save

You can add multiple rules for the same Facility + Service Type — one per vendor. The ★ preferred vendor appears first in all dropdowns.

### Direct Table Access

Django Admin provides table-level access to: users, vendors, facilities, case requests, status history, coverage rules, service types, and notification logs.

---

*End of Playbook — v2 covering Phases 1–13*

*For technical setup, see [SETUP.md](./SETUP.md)*  
*For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md)*
