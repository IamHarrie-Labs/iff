import { Link } from "react-router";

import { Contact, LegalPage } from "@/components/LegalPage";

export function meta() {
  return [
    { title: "Terms of use · Iff" },
    { name: "description", content: "The terms for using Iff." },
  ];
}

export default function Terms() {
  return (
    <LegalPage
      label="Terms of use"
      title="Terms of use"
      intro="These terms apply when you use Iff. By using it, you agree to them. They’re short, and we’ve tried to make them plain."
    >
      <section>
        <h2>What Iff is</h2>
        <p>
          Iff helps you organise information about your household’s bills, accounts and responsibilities
          into a plan for someone you trust. It’s an organising tool.
        </p>
      </section>

      <section>
        <h2>What Iff isn’t</h2>
        <div>
          <ul>
            <li>It isn’t financial, legal or tax advice. Check anything important with a qualified professional.</li>
            <li>It isn’t a bank and it can’t move money, contact your bank or see your balances.</li>
            <li>A plan isn’t a will, power of attorney or any other legal authority. It gives nobody the right to act on your accounts.</li>
          </ul>
        </div>
      </section>

      <section>
        <h2>Findings can be wrong</h2>
        <p>
          Iff draws findings from the records you add, and the agent can make mistakes. That’s why nothing
          reaches a plan until you confirm it. You’re responsible for checking what you confirm and share.
        </p>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          You keep ownership of everything you add. You give us permission to store and process it only to
          run Iff for you. Only add records you’re entitled to use, and only share a plan with people you
          choose to.
        </p>
      </section>

      <section>
        <h2>Fair use</h2>
        <div>
          <p>Please don’t:</p>
          <ul>
            <li>try to reach another person’s workspace or share links that aren’t meant for you</li>
            <li>overload the service or get around the daily message limit</li>
            <li>upload malware or anything you don’t have the right to share</li>
          </ul>
          <p>We may suspend accounts that do.</p>
        </div>
      </section>

      <section>
        <h2>Availability</h2>
        <p>
          Iff is an early product and is provided as it is. We work to keep it running and your data safe,
          but we can’t promise it will always be available or free of errors. Keep your own copy of anything
          you can’t afford to lose. You can export your data at any time.
        </p>
      </section>

      <section>
        <h2>Liability</h2>
        <p>
          As far as the law allows, we aren’t liable for indirect losses, or for decisions made using a plan
          or finding. Nothing in these terms limits liability that the law doesn’t let us limit.
        </p>
      </section>

      <section>
        <h2>Ending</h2>
        <p>
          You can stop using Iff and delete your workspace whenever you like. We may close the service with
          reasonable notice, and we’ll give you time to export your data first.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms go to <Contact />. Our <Link to="/privacy">privacy notice</Link>{" "}
          explains how we handle personal data.
        </p>
      </section>
    </LegalPage>
  );
}
