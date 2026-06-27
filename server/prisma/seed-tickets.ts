import prisma from "../src/lib/prisma";
import { TicketStatus, TicketCategory } from "@prisma/client";

const tickets: Array<{
  subject: string;
  body: string;
  senderEmail: string;
  status: TicketStatus;
  category: TicketCategory;
  createdAt: Date;
}> = [
  // OPEN — General Question
  { subject: "How do I reset my password?", body: "I forgot my password and can't log in. Can you help me reset it?", senderEmail: "alice.morgan@gmail.com", status: "OPEN", category: "GENERAL_QUESTION", createdAt: daysAgo(1) },
  { subject: "What are your business hours?", body: "I'd like to know when your support team is available.", senderEmail: "bob.chen@yahoo.com", status: "OPEN", category: "GENERAL_QUESTION", createdAt: daysAgo(2) },
  { subject: "Do you have a mobile app?", body: "Is there an iOS or Android app for your service?", senderEmail: "carol.white@hotmail.com", status: "OPEN", category: "GENERAL_QUESTION", createdAt: daysAgo(3) },
  { subject: "How do I update my email address?", body: "I changed my email and need to update it in my account.", senderEmail: "david.kim@outlook.com", status: "OPEN", category: "GENERAL_QUESTION", createdAt: daysAgo(4) },
  { subject: "Can I have multiple users on one account?", body: "We are a small team and want to share one subscription.", senderEmail: "emma.jones@company.com", status: "OPEN", category: "GENERAL_QUESTION", createdAt: daysAgo(5) },
  { subject: "Where can I find my invoices?", body: "I need to download my past invoices for accounting.", senderEmail: "frank.liu@startup.io", status: "OPEN", category: "GENERAL_QUESTION", createdAt: daysAgo(6) },
  { subject: "Is there a free trial?", body: "I'd like to test the product before committing to a paid plan.", senderEmail: "grace.hall@personal.net", status: "OPEN", category: "GENERAL_QUESTION", createdAt: daysAgo(7) },
  { subject: "How do I cancel my subscription?", body: "I need to cancel my plan at the end of the billing cycle.", senderEmail: "henry.park@email.com", status: "OPEN", category: "GENERAL_QUESTION", createdAt: daysAgo(8) },
  { subject: "What payment methods do you accept?", body: "Do you accept PayPal or only credit cards?", senderEmail: "iris.brown@webmail.com", status: "OPEN", category: "GENERAL_QUESTION", createdAt: daysAgo(9) },
  { subject: "Can I export my data?", body: "I'd like to export all my records as a CSV file.", senderEmail: "jack.taylor@domain.org", status: "OPEN", category: "GENERAL_QUESTION", createdAt: daysAgo(10) },

  // OPEN — Technical Question
  { subject: "API rate limit exceeded", body: "I'm getting 429 errors when calling your API. How do I increase my limit?", senderEmail: "lena.wolf@devco.io", status: "OPEN", category: "TECHNICAL_QUESTION", createdAt: daysAgo(1) },
  { subject: "Webhook not receiving events", body: "I set up a webhook endpoint but events aren't being delivered.", senderEmail: "mike.stone@techfirm.com", status: "OPEN", category: "TECHNICAL_QUESTION", createdAt: daysAgo(2) },
  { subject: "OAuth token expiring too quickly", body: "Our access tokens expire after 15 minutes which breaks our workflow.", senderEmail: "nina.ross@saasapp.io", status: "OPEN", category: "TECHNICAL_QUESTION", createdAt: daysAgo(3) },
  { subject: "CORS errors on API calls from browser", body: "Getting 'Access-Control-Allow-Origin' errors from the frontend.", senderEmail: "oscar.bell@frontend.dev", status: "OPEN", category: "TECHNICAL_QUESTION", createdAt: daysAgo(4) },
  { subject: "PDF export is blank", body: "When I export a report to PDF the file opens but all pages are empty.", senderEmail: "paula.grant@biztools.com", status: "OPEN", category: "TECHNICAL_QUESTION", createdAt: daysAgo(5) },
  { subject: "SSO login redirect loop", body: "After configuring SAML SSO users get stuck in an infinite redirect loop.", senderEmail: "quinn.archer@enterprise.net", status: "OPEN", category: "TECHNICAL_QUESTION", createdAt: daysAgo(6) },
  { subject: "Search returning incorrect results", body: "The search feature is surfacing records that don't match the query.", senderEmail: "rachel.fox@dataco.com", status: "OPEN", category: "TECHNICAL_QUESTION", createdAt: daysAgo(7) },
  { subject: "Timezone issues with scheduled reports", body: "Reports run at wrong time — looks like UTC isn't being converted to local time.", senderEmail: "sam.nguyen@analytics.io", status: "OPEN", category: "TECHNICAL_QUESTION", createdAt: daysAgo(8) },
  { subject: "Image upload failing silently", body: "Uploading profile images seems to succeed but the image never updates.", senderEmail: "tina.clark@userco.com", status: "OPEN", category: "TECHNICAL_QUESTION", createdAt: daysAgo(9) },
  { subject: "Dashboard not loading on Safari", body: "The main dashboard shows a blank screen in Safari 17, works fine in Chrome.", senderEmail: "uma.patel@macuser.me", status: "OPEN", category: "TECHNICAL_QUESTION", createdAt: daysAgo(10) },

  // OPEN — Refund Request
  { subject: "Charged twice for the same month", body: "My credit card statement shows two charges for March. Please refund one.", senderEmail: "victor.hayes@personal.com", status: "OPEN", category: "REFUND_REQUEST", createdAt: daysAgo(2) },
  { subject: "Cancelled before trial ended, still charged", body: "I cancelled on day 12 of a 14-day trial but was still billed.", senderEmail: "wendy.scott@email.net", status: "OPEN", category: "REFUND_REQUEST", createdAt: daysAgo(4) },
  { subject: "Annual plan refund — changed my mind", body: "I upgraded to annual last week but our budget was cut. Can I get a refund?", senderEmail: "xander.lee@startup.com", status: "OPEN", category: "REFUND_REQUEST", createdAt: daysAgo(6) },
  { subject: "Wrong plan charged", body: "I selected the Basic plan but was charged for Pro. Please correct.", senderEmail: "yara.mahmoud@bizuser.org", status: "OPEN", category: "REFUND_REQUEST", createdAt: daysAgo(8) },
  { subject: "Duplicate account charges", body: "Two accounts were created for my company and both were charged. I only need one.", senderEmail: "zoe.carter@agency.com", status: "OPEN", category: "REFUND_REQUEST", createdAt: daysAgo(10) },

  // RESOLVED — General Question
  { subject: "How to add a team member", body: "I'd like to invite a colleague but can't find the invite button.", senderEmail: "aaron.walsh@teamco.com", status: "RESOLVED", category: "GENERAL_QUESTION", createdAt: daysAgo(15) },
  { subject: "Difference between Admin and Agent roles", body: "Can you explain what each role can and cannot do?", senderEmail: "bella.russo@company.io", status: "RESOLVED", category: "GENERAL_QUESTION", createdAt: daysAgo(18) },
  { subject: "How do I change my plan?", body: "I want to upgrade from Basic to Pro mid-cycle.", senderEmail: "caleb.martin@email.com", status: "RESOLVED", category: "GENERAL_QUESTION", createdAt: daysAgo(20) },
  { subject: "Account locked after too many attempts", body: "I typed the wrong password 5 times and now my account is locked.", senderEmail: "diana.torres@user.net", status: "RESOLVED", category: "GENERAL_QUESTION", createdAt: daysAgo(22) },
  { subject: "Do you have an affiliate program?", body: "I'd like to refer customers and earn a commission.", senderEmail: "ethan.moore@marketer.com", status: "RESOLVED", category: "GENERAL_QUESTION", createdAt: daysAgo(25) },
  { subject: "Notification emails going to spam", body: "All emails from your system land in my junk folder.", senderEmail: "fiona.james@outlook.com", status: "RESOLVED", category: "GENERAL_QUESTION", createdAt: daysAgo(27) },
  { subject: "How to enable two-factor authentication", body: "I want to secure my account with 2FA. Where is that setting?", senderEmail: "george.adams@secure.me", status: "RESOLVED", category: "GENERAL_QUESTION", createdAt: daysAgo(30) },
  { subject: "Language and locale settings", body: "How do I change the interface language to Spanish?", senderEmail: "hannah.evans@international.com", status: "RESOLVED", category: "GENERAL_QUESTION", createdAt: daysAgo(32) },
  { subject: "Bulk import contacts", body: "Can I import a CSV file with 2,000 contacts at once?", senderEmail: "ian.cooper@salesteam.io", status: "RESOLVED", category: "GENERAL_QUESTION", createdAt: daysAgo(35) },
  { subject: "Is there a desktop app?", body: "I prefer native apps over browser tabs. Do you have one?", senderEmail: "julia.reed@poweruser.com", status: "RESOLVED", category: "GENERAL_QUESTION", createdAt: daysAgo(38) },

  // RESOLVED — Technical Question
  { subject: "Integration with Slack not working", body: "The Slack integration connects but messages aren't posting to our channel.", senderEmail: "kevin.price@devteam.com", status: "RESOLVED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(14) },
  { subject: "CSV export encoding issue", body: "Exported CSV has garbled characters for names with accents.", senderEmail: "laura.schmidt@eurocorp.de", status: "RESOLVED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(16) },
  { subject: "Custom domain not verified", body: "I added a CNAME record but the domain still shows as unverified.", senderEmail: "marcus.young@mysite.com", status: "RESOLVED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(19) },
  { subject: "Email template variables not resolving", body: "The {{first_name}} placeholder shows literally in sent emails.", senderEmail: "natalie.king@emailmarketer.io", status: "RESOLVED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(21) },
  { subject: "iOS app crash on login", body: "The app crashes immediately after I tap the Sign In button on iPhone 14.", senderEmail: "oliver.wright@iphone.user", status: "RESOLVED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(23) },
  { subject: "API key not working after rotation", body: "I rotated my API key yesterday and now all requests return 401.", senderEmail: "patricia.green@devops.com", status: "RESOLVED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(26) },
  { subject: "Notification bell badge stuck at 99+", body: "The notification counter never clears even after reading everything.", senderEmail: "quentin.hall@ui.bug", status: "RESOLVED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(28) },
  { subject: "Data grid freezes with large datasets", body: "Loading more than 5,000 rows makes the browser tab unresponsive.", senderEmail: "rose.baker@dataanalyst.com", status: "RESOLVED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(31) },
  { subject: "Two-factor auth codes not accepted", body: "My authenticator app generates codes but the system says they're invalid.", senderEmail: "steven.ward@secureuser.net", status: "RESOLVED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(33) },
  { subject: "Report email attachment corrupt", body: "The PDF attached to my weekly report email can't be opened.", senderEmail: "tracy.cox@reports.io", status: "RESOLVED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(36) },

  // RESOLVED — Refund Request
  { subject: "Refund for unused months", body: "I've been on annual but only used 3 months. Can I get a pro-rated refund?", senderEmail: "ursula.ford@user.com", status: "RESOLVED", category: "REFUND_REQUEST", createdAt: daysAgo(13) },
  { subject: "Charged after account deletion", body: "I deleted my account on the 1st but was charged on the 3rd.", senderEmail: "vincent.hill@billing.complaint", status: "RESOLVED", category: "REFUND_REQUEST", createdAt: daysAgo(17) },
  { subject: "Promo code not applied to charge", body: "I had a 20% off coupon but my invoice shows full price.", senderEmail: "wilma.stone@coupon.user", status: "RESOLVED", category: "REFUND_REQUEST", createdAt: daysAgo(24) },
  { subject: "Subscription renewed while in dispute", body: "My annual plan auto-renewed while I had an open billing dispute.", senderEmail: "xavier.hunt@unhappy.customer", status: "RESOLVED", category: "REFUND_REQUEST", createdAt: daysAgo(29) },
  { subject: "Team seat refund — person left company", body: "An employee left and we need a refund for their unused seat.", senderEmail: "yvonne.lane@hr.company", status: "RESOLVED", category: "REFUND_REQUEST", createdAt: daysAgo(34) },

  // CLOSED — General Question
  { subject: "How long is data retained?", body: "If I cancel, how long do you keep my data before deleting it?", senderEmail: "zachary.brooks@privacy.minded", status: "CLOSED", category: "GENERAL_QUESTION", createdAt: daysAgo(45) },
  { subject: "GDPR data deletion request", body: "Per GDPR I request deletion of all my personal data.", senderEmail: "amelia.shaw@eu.citizen", status: "CLOSED", category: "GENERAL_QUESTION", createdAt: daysAgo(48) },
  { subject: "Accessibility features available?", body: "Does the platform support screen readers and keyboard navigation?", senderEmail: "ben.foster@accessible.org", status: "CLOSED", category: "GENERAL_QUESTION", createdAt: daysAgo(50) },
  { subject: "White label options?", body: "Can we rebrand the interface with our own logo and colors?", senderEmail: "claire.butler@agency.design", status: "CLOSED", category: "GENERAL_QUESTION", createdAt: daysAgo(52) },
  { subject: "On-premise deployment available?", body: "Our security policy requires self-hosted solutions. Is that an option?", senderEmail: "derek.simmons@enterprise.co", status: "CLOSED", category: "GENERAL_QUESTION", createdAt: daysAgo(55) },
  { subject: "SLA document request", body: "We need a formal SLA for our legal team before signing.", senderEmail: "elena.cross@legal.procurement", status: "CLOSED", category: "GENERAL_QUESTION", createdAt: daysAgo(57) },
  { subject: "How to merge duplicate accounts", body: "I accidentally created two accounts and need them merged.", senderEmail: "felix.warren@double.signup", status: "CLOSED", category: "GENERAL_QUESTION", createdAt: daysAgo(60) },
  { subject: "API documentation location", body: "Where can I find the full API reference docs?", senderEmail: "grace.porter@dev.curious", status: "CLOSED", category: "GENERAL_QUESTION", createdAt: daysAgo(62) },
  { subject: "Compliance certifications — SOC 2?", body: "Does your platform have SOC 2 Type II certification?", senderEmail: "hector.mills@compliance.team", status: "CLOSED", category: "GENERAL_QUESTION", createdAt: daysAgo(65) },
  { subject: "IP allowlist for account access", body: "Can we restrict account login to specific IP ranges?", senderEmail: "irene.gray@security.admin", status: "CLOSED", category: "GENERAL_QUESTION", createdAt: daysAgo(67) },

  // CLOSED — Technical Question
  { subject: "Zapier integration broken after update", body: "Our Zaps started failing after your platform update last Tuesday.", senderEmail: "james.wood@automation.pro", status: "CLOSED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(40) },
  { subject: "Database connection timeout", body: "Queries that used to run in 200ms now timeout after 30 seconds.", senderEmail: "karen.burns@backend.dev", status: "CLOSED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(43) },
  { subject: "Pagination broken on page 3+", body: "Clicking next page works for pages 1 and 2 but page 3 shows the same data as page 1.", senderEmail: "liam.cook@frontend.bug", status: "CLOSED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(46) },
  { subject: "Attachment download requires login each time", body: "Every attachment download prompts me to log in again even with active session.", senderEmail: "mia.bell@frustration.io", status: "CLOSED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(49) },
  { subject: "Graph not rendering in dark mode", body: "Charts are invisible in dark mode — black lines on black background.", senderEmail: "noah.turner@darkmode.fan", status: "CLOSED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(51) },
  { subject: "Batch API requests return partial results", body: "Sending 50 items in a batch request consistently returns only 47.", senderEmail: "olivia.hayes@api.user", status: "CLOSED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(54) },
  { subject: "Login page not loading on company VPN", body: "Outside the VPN the site loads fine; on VPN it hangs at the login page.", senderEmail: "peter.chan@corporate.vpn", status: "CLOSED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(56) },
  { subject: "Automated emails skipping certain users", body: "About 5% of our users never receive our automated onboarding emails.", senderEmail: "quinn.shaw@onboarding.ops", status: "CLOSED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(59) },
  { subject: "Sort order resets after page refresh", body: "I sort the table, navigate away, come back, and the sort is gone.", senderEmail: "rachel.price@ux.feedback", status: "CLOSED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(61) },
  { subject: "Infinite scroll skipping records", body: "When scrolling down quickly some records disappear and don't come back.", senderEmail: "samuel.jenkins@scroll.bug", status: "CLOSED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(64) },

  // CLOSED — Refund Request
  { subject: "Accidental annual upgrade", body: "I clicked upgrade by mistake and meant to select monthly.", senderEmail: "teresa.mason@oops.email", status: "CLOSED", category: "REFUND_REQUEST", createdAt: daysAgo(41) },
  { subject: "Service was down during billed period", body: "Your platform had a 6-hour outage in January. I'd like partial credit.", senderEmail: "ulrich.hoffman@downtime.complaint", status: "CLOSED", category: "REFUND_REQUEST", createdAt: daysAgo(44) },
  { subject: "Feature removed that I paid for", body: "The bulk export feature I specifically signed up for was removed in the last update.", senderEmail: "vera.nelson@feature.gone", status: "CLOSED", category: "REFUND_REQUEST", createdAt: daysAgo(47) },
  { subject: "Non-profit discount not applied", body: "I submitted NGO documentation two weeks ago but was charged full price.", senderEmail: "walter.church@ngo.org", status: "CLOSED", category: "REFUND_REQUEST", createdAt: daysAgo(53) },
  { subject: "Student discount refund claim", body: "I qualified for the student discount but my card was charged the standard rate.", senderEmail: "xena.powell@university.edu", status: "CLOSED", category: "REFUND_REQUEST", createdAt: daysAgo(58) },

  // More OPEN mixed — recent variety
  { subject: "Dark mode option requested", body: "Is there a dark mode? My eyes are strained using the app at night.", senderEmail: "yosef.klein@nightowl.com", status: "OPEN", category: "GENERAL_QUESTION", createdAt: daysAgo(0) },
  { subject: "Can I share a dashboard with a client?", body: "I want to give read-only access to a specific dashboard to an external client.", senderEmail: "zara.ahmed@consulting.co", status: "OPEN", category: "GENERAL_QUESTION", createdAt: daysAgo(0) },
  { subject: "Login page renders broken on Firefox", body: "On Firefox 120 the login form fields are stacked oddly and the button is off-screen.", senderEmail: "alex.brooks@firefox.user", status: "OPEN", category: "TECHNICAL_QUESTION", createdAt: daysAgo(1) },
  { subject: "Memory leak in desktop electron app", body: "RAM usage climbs from 200MB to 4GB over about 8 hours of use.", senderEmail: "beth.cole@electron.issue", status: "OPEN", category: "TECHNICAL_QUESTION", createdAt: daysAgo(1) },
  { subject: "Refund — purchased wrong tier", body: "I bought the Enterprise plan by accident. I need the Team plan.", senderEmail: "carl.davidson@mistake.buyer", status: "OPEN", category: "REFUND_REQUEST", createdAt: daysAgo(1) },
  { subject: "Is there a public roadmap?", body: "I'd like to know what features are planned for Q3.", senderEmail: "dana.edwards@curious.user", status: "OPEN", category: "GENERAL_QUESTION", createdAt: daysAgo(2) },
  { subject: "Audit logs not exporting", body: "The audit log export button spins for 10 minutes then shows a generic error.", senderEmail: "evan.fisher@audit.needed", status: "OPEN", category: "TECHNICAL_QUESTION", createdAt: daysAgo(2) },
  { subject: "Charged after cancelling within 24h", body: "I signed up and cancelled within the hour. Still got a full month charge.", senderEmail: "faye.garcia@instant.cancel", status: "OPEN", category: "REFUND_REQUEST", createdAt: daysAgo(3) },
  { subject: "How to revoke an API key", body: "An API key was accidentally committed to GitHub. How do I revoke it immediately?", senderEmail: "glen.harris@security.panic", status: "OPEN", category: "TECHNICAL_QUESTION", createdAt: daysAgo(3) },
  { subject: "Pricing for non-profits", body: "Do you offer discounted plans for registered charities?", senderEmail: "hope.ito@charity.org", status: "OPEN", category: "GENERAL_QUESTION", createdAt: daysAgo(4) },
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  // Spread within the day for variety
  d.setHours(Math.floor(Math.random() * 14) + 7);
  d.setMinutes(Math.floor(Math.random() * 60));
  return d;
}

async function run() {
  console.log(`Inserting ${tickets.length} tickets…`);
  const result = await prisma.ticket.createMany({ data: tickets, skipDuplicates: false });
  console.log(`Done — created ${result.count} tickets.`);
}

run()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
