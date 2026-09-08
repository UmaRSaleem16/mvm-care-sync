import { BookOpen, Mail, Phone, ExternalLink } from 'lucide-react'

const sections = [
  {
    title: 'Getting Started',
    content: [
      'Log in with your internal MVM/NVM staff credentials.',
      'From the Dashboard you can see open requests, confirmed cases, and quick stats.',
      'Use the sidebar to navigate between Vendors, ASC Facilities, Requests, and Calendar.',
    ],
  },
  {
    title: 'Creating a Vendor Request',
    content: [
      'Click "New Request" in the sidebar or dashboard.',
      'Select the ASC/Facility, service type, and date.',
      'The system will automatically match available vendors based on ASC and service.',
      'If one vendor matches, they are auto-selected. If multiple match, choose from the list.',
      'Fill in case details (procedure type, times, patient initials or case ID only).',
      'Submit — the vendor receives an email and the request tracker is updated.',
    ],
  },
  {
    title: 'Request Statuses',
    content: [
      'Draft — saved but not yet sent to vendor.',
      'Requested — email sent to vendor, awaiting response.',
      'Vendor Responded — vendor has replied.',
      'Confirmed — coverage confirmed, calendar updated.',
      'Backup Needed — primary vendor unavailable, finding backup.',
      'Credentialing Pending — vendor needs credentialing before proceeding.',
      'Cancelled — request cancelled; vendor notified if previously confirmed.',
      'Completed — case completed successfully.',
    ],
  },
  {
    title: 'Vendor Email Workflow',
    content: [
      'On submission, the system sends a coverage request email to the matched vendor.',
      'Email includes: ASC name/address, date, arrival time, service needed, case type, surgeon.',
      'Vendor is asked to reply with: availability, provider name, rate, credentialing needs.',
      'In development mode (no SMTP configured), the email is saved as a preview in Notification Logs.',
      'To configure real email: set EMAIL_HOST, EMAIL_HOST_USER, and EMAIL_HOST_PASSWORD in .env.',
    ],
  },
  {
    title: 'Privacy & PHI',
    content: [
      'This system is designed to minimize patient data exposure.',
      'Only patient initials or a case ID are collected — no full names, DOBs, or MRNs.',
      'Vendor emails contain only the minimum information needed for coverage coordination.',
    ],
  },
  {
    title: 'Integration & Configuration',
    content: [
      'The backend exposes a REST API at /api/v1/ for integration with MVM/NVM Portal.',
      'Environment variables in .env control email, database, external portal URL, and Teams webhook.',
      'See README.md in caresync-backend for full environment variable documentation.',
    ],
  },
]

export default function Help() {
  return (
    <div>
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-lg bg-brand-100 p-2 text-brand-600">
          <BookOpen size={22} />
        </div>
        <div>
          <h1 className="page-header">Help & Documentation</h1>
          <p className="page-subheader">
            Guide to using the MVMCareSync ASC Vendor Management Portal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {sections.map((section) => (
          <div key={section.title} className="card p-6">
            <h2 className="mb-3 text-base font-semibold text-slate-800">{section.title}</h2>
            <ul className="space-y-2">
              {section.content.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Support contact */}
      <div className="mt-6 card p-6 bg-slate-900 text-white">
        <h2 className="mb-4 text-base font-semibold">Need Help?</h2>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <Mail size={15} />
            <span>support@mvmcaresync.local</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Phone size={15} />
            <span>610-555-0000</span>
          </div>
          <a
            href="#"
            className="flex items-center gap-2 text-brand-300 hover:text-brand-200"
          >
            <ExternalLink size={15} />
            <span>MVM/NVM Portal</span>
          </a>
        </div>
      </div>
    </div>
  )
}
