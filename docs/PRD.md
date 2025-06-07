**Product Requirements Document: The Void**

**1. Introduction**

- **Product Name:** The Void
- **Tagline:** `/dev/null > applications`
- **Product Goal:** To provide a brutally honest and ruthlessly efficient dashboard for software engineers to wrangle the chaos of the modern job search.
- **Overview:** The Void integrates with a user's Gmail account to automatically pull and parse job application emails. It is a centralized command center for logging application attempts, tracking statuses from "sent" to "ghosted," managing tailored CVs for each role, and keeping a vigilant eye on the deadlines that matter.

**2. Goals & Objectives**

- **For the User:**
  - **Centralize:** Consolidate all job application attempts and their subsequent communications in one place.
  - **Organize:** Systematically track application statuses, from "Applied" to the inevitable "Rejected."
  - **Streamline:** Reduce the soul-crushing manual effort of monitoring an inbox for automated replies.
  - **Inform:** Provide a stark, unflinching overview of the application pipeline and upcoming events.
  - **Control:** Provide a sense of control over the chaos, even when the market feels like an abyss.
- **For the Product (MVP):**
  - Successfully authenticate with Gmail and fetch relevant emails.
  - Allow users to categorize applications by status.
  - Enable tracking of specific CV versions per application.
  - Display upcoming key dates (interviews, assessments).

**3. Target Audience**

- **Primary:** Software engineers actively job hunting who manage numerous applications.
- **Characteristics:**
  - Tech-savvy and appreciates a terminal-inspired aesthetic.
  - Values ruthless efficiency and a no-fluff user experience.
  - Needs to track which tailored CV was sent where.
  - Wants to avoid missing deadlines, even if they lead to another rejection.
  - Possesses a healthy dose of gallows humor about the job market.

**4. User Stories (Key Scenarios)**

- **US1 (Application Logging & CV Tracking):** As a job seeker, I want to log a new application and attach the specific CV version I used, so I know which version of my resume was sent into the abyss for which role.
- **US2 (Status Update - Email):** As a job seeker, I want the system to identify emails related to my applications, so I can quickly update my tracker without having to read another templated rejection email myself.
- **US3 (Status Update - Manual):** As a job seeker, I want to manually update the status of an application, so my dashboard is an accurate reflection of my descent into the job market.
- **US4 (Deadline Management):** As a job seeker, I want to see all my upcoming interview dates and assessment deadlines in one view, so I can mentally prepare for the next round of technical challenges.
- **US5 (Information Retrieval):** As a job seeker, I want to quickly find all information related to a specific company application, so I can pretend I remember applying right before a call.
- **US6 (Communication Context):** As a job seeker, I want to easily link to the relevant email thread in Gmail for an application, so I can review the full communication history without digging through my inbox.
- **US7 (Rejection Handling):** As a job seeker, I want to mark applications as "Rejected" so I can move them to a digital graveyard and focus on the applications that haven't been rejected _yet_.

**5. Product Features (MVP Focus)**

- **F1: Application Hub**
  - **F1.1: Application List:** Display a list of all tracked job applications. Columns: Company Name, Job Title, Status, Application Date, Next Key Date.
  - **F1.2: Application Detail View:** A dedicated view for each application showing all its associated information.
  - **F1.3: Manual Application Entry:** Allow users to add applications manually.
- **F2: Status Management**
  - **F2.1: Predefined Statuses:** Core statuses (Applied, Assessment Pending, Interview Scheduled, Offer, Rejected, Withdrawn).
  - **F2.2: Status Update:** Ability to change the status of an application.
- **F3: Gmail Integration**
  - **F3.1: Secure Authentication:** OAuth 2.0 for Gmail.
  - **F3.2: Email Fetching:** Scan Gmail for emails based on user-defined keywords or labels.
  - **F3.3: Basic Email Parsing:** Attempt to identify company name and keywords for status change suggestions.
- **F4: Document Management (CV Focus)**
  - **F4.1: CV Linking/Attachment per Application:** For each application, allow the user to link to the specific CV version submitted.
  - **F4.2: CV Identification:** Allow naming or tagging of CV versions.
  - **F4.3: Easy CV Access:** View/download the linked CV from the application detail view.
- **F5: Date & Task Tracking**
  - **F5.1: Key Date Entry:** Allow users to add dates for interviews and assessment deadlines.
  - **F5.2: Upcoming Events View:** A simple list highlighting events in the near future.
- **F6: Notes**
  - **F6.1: Application-Specific Notes:** A text area within each application's detail view for notes, contacts, or prep points.
