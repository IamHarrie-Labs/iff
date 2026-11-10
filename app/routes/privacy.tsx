import { Link } from "react-router";

import { Contact, LegalPage } from "@/components/LegalPage";

export function meta() {
  return [
    { title: "Privacy notice · Iff" },
    { name: "description", content: "What personal data Iff collects, why, and the choices you have." },
  ];
}

export default function Privacy() {
  return (
    <LegalPage
      label="Privacy notice"
      title="Privacy notice"
      intro="This notice explains what Iff collects when you use it, why we need it, who else handles it and how long we keep it."
    >
      <section>
        <h2>Who we are</h2>
        <p>
          Iff is an independent product that helps you write down how your household runs, so someone you
          trust can step in. In this notice, “we” means the team that runs Iff. You can reach us at{" "}
          <Contact />.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <div>
          <ul>
            <li>
              <b>Account details.</b> For a passkey account, the name you choose (if any) and your
              passkey’s public key. Its private key never leaves your device. If you sign in with email
              instead, your email address and password. Sample workspaces have no email at all.
            </li>
            <li>
              <b>What you add.</b> Statements, emails and notes you upload or type, the findings Iff
              draws from them, your answers, and the names you give trusted people.
            </li>
            <li>
              <b>Questions to the agent.</b> The messages you send and the replies.
            </li>
            <li>
              <b>Share links.</b> Who each link is for, when it expires and when it was last opened.
            </li>
            <li>
              <b>Service records.</b> A daily count of agent messages, used to keep costs fair, and
              basic server logs for fixing faults.
            </li>
          </ul>
          <p>Please don’t upload passwords, full card numbers or identity documents. Iff doesn’t need them.</p>
        </div>
      </section>

      <section>
        <h2>Why we use it</h2>
        <div>
          <ul>
            <li>To provide the service you asked for: finding what repeats, asking you about it and preparing the plan.</li>
            <li>To keep your workspace private to you and keep the service secure.</li>
            <li>To limit misuse of the AI model we pay for.</li>
          </ul>
          <p>
            Where data protection law asks for a legal basis, we rely on providing the service you
            requested, and on our legitimate interest in keeping it secure. We don’t sell your data or use
            it for advertising.
          </p>
        </div>
      </section>

      <section>
        <h2>Who else handles it</h2>
        <div>
          <ul>
            <li>
              <b>Our AI model provider.</b> When you ask Iff a question, that question and the parts of
              your workspace needed to answer it are sent to Anthropic’s Claude model, either directly or
              through Builder.io. They process it to produce a reply. Under their commercial terms, this data
              isn’t used to train their models.
            </li>
            <li>
              <b>Our hosting and database providers</b>, who store the service’s data on our behalf.
            </li>
            <li>
              <b>The people you invite</b>, who see only the confirmed items you assigned to them.
            </li>
          </ul>
          <p>Some of these providers may process data outside your country, under their own data protection commitments.</p>
        </div>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <div>
          <ul>
            <li>Sample workspaces: 24 hours, then deleted with everything in them.</li>
            <li>Your workspace: until you delete it or close your account.</li>
            <li>Share links: until they expire (30 days) or you turn them off.</li>
            <li>Daily message counts and server logs: up to 30 days.</li>
          </ul>
        </div>
      </section>

      <section>
        <h2>Your rights</h2>
        <div>
          <p>
            You can download a copy of your data or delete your workspace yourself, from the account menu.
            You can also ask us to correct, delete or export anything we hold, or object to how we use it.
            Write to <Contact /> and we’ll reply within 30 days.
          </p>
          <p>
            If you’re unhappy with our answer, you can complain to the data protection authority where you
            live.
          </p>
        </div>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          We use one essential cookie to keep you signed in. There are no advertising or analytics cookies,
          so there is nothing to opt out of.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>Iff isn’t meant for anyone under 18.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          If we change how we handle your data, we’ll update this page and the date at the top. For bigger
          changes we’ll tell you in the app first. See also <Link to="/trust">how we handle data</Link> and
          the <Link to="/terms">terms of use</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
