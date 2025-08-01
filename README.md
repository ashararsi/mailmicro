# MailMicro Admin Dashboard

A Node.js + Express + EJS + Bootstrap 5 admin dashboard for managing SMTP configs, email templates, and bulk email campaigns with reporting.

## Features

- Multi-tenant (user_id scoped) campaign management
- Manage multiple SMTP configs, test connection, mark active
- Create and preview email templates (logo, colors, placeholders)
- Create campaigns, upload CSVs, send personalized emails
- Dashboard with stats, graphs, and logs
- Modern UI with Bootstrap 5

## Getting Started

1. Install dependencies

    ```
    npm install
    ```

2. Run the app

    ```
    npm start
    ```

3. Visit [http://localhost:3000](http://localhost:3000)

## Notes

- Uses SQLite for demo. Switch to another DB by editing `models/index.js`.
- Demo authentication auto-logs in a test user. Replace with real auth for production.
- File uploads are saved in `public/uploads/`.
- Email sending uses Nodemailer and supports concurrency.

## License

MIT