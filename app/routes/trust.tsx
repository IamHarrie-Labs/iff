import { Link } from "react-router";

import { Contact, LegalPage } from "@/components/LegalPage";

export function meta() {
  return [
    { title: "How Iff handles your data" },
    { name: "description", content: "What Iff stores, who can see it, and how to remove it." },
  ];
}

export default function Trust() {
  return (
    <LegalPage
      label="How we handle data"
      title={
        <>
          Your records stay <em>yours</em>
        </>
      }
      intro="Iff reads statements and emails that describe your money. Here is how we keep that material private, and what we haven’t built yet."
    >
      <section>
        <h2>Who can see what</h2>
        <div>
          <ul>
            <li>
              Each workspace belongs to one signed-in person. Every read and write is checked against that
              person’s session on the server.
            </li>
            <li>
              A trusted person sees only the items you confirmed and assigned to them, with your
              instructions. They never see your original statements or emails.
            </li>
            <li>The people who run Iff don’t browse workspaces. Access to the database is limited to keeping the service running.</li>
          </ul>
        </div>
      </section>

      <section>
        <h2>What the agent can and can’t do</h2>
        <div>
          <ul>
            <li>It can read your workspace, explain a finding and suggest an answer.</li>
            <li>It can’t mark anything as confirmed. Only you can, from the app.</li>
            <li>It can’t create or turn off share links, export your data or delete it.</li>
            <li>It has no access to your bank, your email account or any password.</li>
          </ul>
        </div>
      </section>

      <section>
        <h2>Share links</h2>
        <div>
          <p>
            You invite someone with a private link. The link is the key, so treat it like one: send it
            only to the person it’s for.
          </p>
          <ul>
            <li>We store a fingerprint of the link, never the link itself.</li>
            <li>Links expire after 30 days, or with the sample workspace after 24 hours.</li>
            <li>You can turn a link off at any time. It stops working straight away.</li>
            <li>You can see when each link was last opened.</li>
            <li>Shared pages ask search engines not to index them.</li>
          </ul>
        </div>
      </section>

      <section>
        <h2>Sample workspaces</h2>
        <p>
          “Try it with sample data” opens a private workspace with no sign-up. It holds a fictional
          household, and we delete it, along with anything you added and any links you made, 24 hours
          after it was created.
        </p>
      </section>

      <section>
        <h2>Your controls</h2>
        <div>
          <p>From the account menu in your workspace you can:</p>
          <ul>
            <li>download everything Iff holds about you as a JSON file</li>
            <li>delete your workspace, which also turns off every share link</li>
          </ul>
        </div>
      </section>

      <section>
        <h2>Cookies and tracking</h2>
        <p>
          Iff sets one cookie to keep you signed in. We don’t use advertising cookies, analytics
          trackers or session recording.
        </p>
      </section>

      <section>
        <h2>Not done yet</h2>
        <div>
          <p>Iff is an early product. We’d rather you hear these from us:</p>
          <ul>
            <li className="no">We haven’t completed an independent security audit or a SOC 2 report.</li>
            <li className="no">Data is encrypted at rest by our database host, not with a key held only by you.</li>
            <li className="no">There is no two-person approval for sharing yet.</li>
          </ul>
          <p>
            Found a problem? Contact us at <Contact />. Read the <Link to="/privacy">privacy notice</Link>{" "}
            for the full detail.
          </p>
        </div>
      </section>
    </LegalPage>
  );
}
