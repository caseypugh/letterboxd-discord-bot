# Privacy Policy
Effective Date: May 11, 2026

### 1. Introduction
This Privacy Policy explains what information the Letterboxd Discord Bot ("the Bot") collects, how it is used, and how it is stored. The Bot is operated by Casey Pugh ("we," "us," or "our").

### 2. Information We Collect
The Bot stores the minimum information required to poll Letterboxd RSS feeds and post diary entries to the correct Discord channel:

- **Letterboxd usernames** that have been added to the Bot via the `/add` slash command.
- **Discord server (guild) IDs** for the servers the Bot has been added to.
- **Discord channel IDs** when a server administrator configures a destination channel via `/channel`.
- **Timestamps** (`createdAt`, `updatedAt`, `lastCheckedAt`) used to determine which Letterboxd entries are new since the last poll.

The Bot does **not** collect or store Discord usernames, Discord user IDs, message contents, member lists, presence data, voice data, or any direct messages. The Bot operates with only the `GUILDS` gateway intent.

In addition, when an error occurs, anonymous error reports (stack traces and runtime context) may be sent to [Sentry](https://sentry.io) for debugging. These error reports do not contain personal data beyond what may incidentally appear in an error message (e.g., a Letterboxd username that triggered a parsing error).

### 3. How We Use Your Information
The information above is used solely to:

- Fetch the public Letterboxd RSS feed (`letterboxd.com/<username>/rss/`) for each added username on a recurring schedule.
- Post new diary entries to the configured Discord channel for the corresponding server.
- Diagnose and fix bugs in the Bot.

We do not perform analytics, profiling, advertising, or any form of behavioural tracking.

### 4. Where Your Information Is Stored
- **Database:** A PostgreSQL database hosted by [Neon](https://neon.tech).
- **Application hosting:** [Fly.io](https://fly.io).
- **Error monitoring:** [Sentry](https://sentry.io), only when error reporting is enabled.
- **Letterboxd:** Public RSS feeds at letterboxd.com are accessed over HTTPS; no credentials or personal data are sent to Letterboxd.

We do not sell, rent, or otherwise share your information with any other third parties.

### 5. Data Retention and Deletion
Your information is retained only for as long as it is needed to operate the Bot. It is deleted automatically in the following cases:

- A server administrator runs `/remove <username>` — that user's row is deleted from the database immediately.
- The Bot is removed from a Discord server — the `guildDelete` event handler hard-deletes every `User` and `GuildConfig` row for that server. There is no soft delete or backup retention.

If you would like your information deleted manually, or have any other privacy-related request, please open an issue at <https://github.com/caseypugh/letterboxd-discord-bot/issues>.

### 6. Data Security
Information is transmitted over HTTPS and stored on managed infrastructure providers (Neon, Fly.io) that implement industry-standard security controls. No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.

### 7. Your Rights
Depending on your jurisdiction, you may have rights to access, correct, or delete the information the Bot stores about you or your server. Because the only information we store is your Letterboxd username (or your server's ID and channel ID), you can exercise these rights at any time by:

- Running `/list` to see which Letterboxd usernames are tracked in your server.
- Running `/remove <username>` to delete a tracked user.
- Removing the Bot from your server to delete all associated data.
- Filing a GitHub issue using the link in Section 9.

### 8. Open Source Transparency
The Bot is open source. The full source code, including every place data is read or written, is publicly available at <https://github.com/caseypugh/letterboxd-discord-bot>.

### 9. Contact Us
For any questions or requests regarding this Privacy Policy, please open an issue at <https://github.com/caseypugh/letterboxd-discord-bot/issues>.

### 10. Changes to This Privacy Policy
We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date. Continued use of the Bot constitutes acceptance of the revised Privacy Policy.
