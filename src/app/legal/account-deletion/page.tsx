import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Deletion Request — BingeWise",
  robots: { index: true, follow: true },
};

export default function AccountDeletionPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 space-y-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">Account Deletion Request</h1>
      <p className="text-muted-foreground">BingeWise &mdash; Last Updated: April 2026</p>

      <p>
        You have the right to delete your BingeWise account and all personal data
        associated with it at any time. This page explains how to submit a deletion
        request and what happens to your data.
      </p>

      <h2 className="text-lg font-semibold mt-8 border-b-2 border-zinc-100 pb-1.5">
        How to Delete Your Account
      </h2>

      <div className="border border-zinc-200 rounded-[10px] p-5 md:p-6 bg-zinc-50 space-y-3">
        <span className="inline-block bg-blue-50 text-blue-700 rounded px-2 py-0.5 text-xs font-bold">
          Option 1 &mdash; Recommended
        </span>
        <h3 className="text-base font-semibold">Delete from within the BingeWise app</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Open the <strong>BingeWise</strong> app and sign in.</li>
          <li>Tap <strong>Settings</strong> (bottom navigation bar).</li>
          <li>Tap <strong>Account Settings</strong>.</li>
          <li>Tap <strong>Delete Account</strong>.</li>
          <li>Enter your password to confirm your identity.</li>
          <li>Optionally provide a reason, then tap <strong>Delete</strong>.</li>
          <li>
            Confirm the final prompt &mdash; your account and data will be permanently
            deleted immediately.
          </li>
        </ol>
      </div>

      <div className="border border-zinc-200 rounded-[10px] p-5 md:p-6 bg-zinc-50 space-y-3">
        <span className="inline-block bg-blue-50 text-blue-700 rounded px-2 py-0.5 text-xs font-bold">
          Option 2 &mdash; Email Request
        </span>
        <h3 className="text-base font-semibold">Submit a deletion request by email</h3>
        <p>If you no longer have access to the app or your account, email us at:</p>
        <p>
          <a className="underline" href="mailto:support@api-bingewise.com?subject=Data Deletion Request">
            support@api-bingewise.com
          </a>
        </p>
        <p>Please include the following in your email:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Subject line: <strong>Data Deletion Request</strong></li>
          <li>Your registered <strong>email address</strong> or <strong>username</strong></li>
        </ul>
        <p>We will process your request and confirm deletion within <strong>30 days</strong>.</p>
      </div>

      <h2 className="text-lg font-semibold mt-8 border-b-2 border-zinc-100 pb-1.5">
        What Data Is Deleted
      </h2>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-zinc-100">
            <th className="text-left p-2.5 border border-zinc-200">Data Type</th>
            <th className="text-left p-2.5 border border-zinc-200">Action</th>
            <th className="text-left p-2.5 border border-zinc-200">Retention Period</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2.5 border border-zinc-200 align-top">
              Account credentials (email, username, password)
            </td>
            <td className="p-2.5 border border-zinc-200 align-top text-red-600 font-semibold">
              Permanently deleted
            </td>
            <td className="p-2.5 border border-zinc-200 align-top">Immediately upon deletion</td>
          </tr>
          <tr>
            <td className="p-2.5 border border-zinc-200 align-top">
              Profile information (name, bio, avatar)
            </td>
            <td className="p-2.5 border border-zinc-200 align-top text-red-600 font-semibold">
              Permanently deleted
            </td>
            <td className="p-2.5 border border-zinc-200 align-top">Immediately upon deletion</td>
          </tr>
          <tr>
            <td className="p-2.5 border border-zinc-200 align-top">
              Posts, comments, and reviews
            </td>
            <td className="p-2.5 border border-zinc-200 align-top text-red-600 font-semibold">
              Permanently deleted
            </td>
            <td className="p-2.5 border border-zinc-200 align-top">Immediately upon deletion</td>
          </tr>
          <tr>
            <td className="p-2.5 border border-zinc-200 align-top">
              Viewing preferences and genre selections
            </td>
            <td className="p-2.5 border border-zinc-200 align-top text-red-600 font-semibold">
              Permanently deleted
            </td>
            <td className="p-2.5 border border-zinc-200 align-top">Immediately upon deletion</td>
          </tr>
          <tr>
            <td className="p-2.5 border border-zinc-200 align-top">
              Streaming service preferences
            </td>
            <td className="p-2.5 border border-zinc-200 align-top text-red-600 font-semibold">
              Permanently deleted
            </td>
            <td className="p-2.5 border border-zinc-200 align-top">Immediately upon deletion</td>
          </tr>
          <tr>
            <td className="p-2.5 border border-zinc-200 align-top">
              Following / follower relationships
            </td>
            <td className="p-2.5 border border-zinc-200 align-top text-red-600 font-semibold">
              Permanently deleted
            </td>
            <td className="p-2.5 border border-zinc-200 align-top">Immediately upon deletion</td>
          </tr>
          <tr>
            <td className="p-2.5 border border-zinc-200 align-top">Push notification tokens</td>
            <td className="p-2.5 border border-zinc-200 align-top text-red-600 font-semibold">
              Permanently deleted
            </td>
            <td className="p-2.5 border border-zinc-200 align-top">Immediately upon deletion</td>
          </tr>
          <tr>
            <td className="p-2.5 border border-zinc-200 align-top">Anonymised usage analytics</td>
            <td className="p-2.5 border border-zinc-200 align-top text-amber-600 font-semibold">
              Retained (anonymised)
            </td>
            <td className="p-2.5 border border-zinc-200 align-top">
              Cannot be linked back to you after deletion
            </td>
          </tr>
          <tr>
            <td className="p-2.5 border border-zinc-200 align-top">Legal / compliance records</td>
            <td className="p-2.5 border border-zinc-200 align-top text-amber-600 font-semibold">
              Retained where required by law
            </td>
            <td className="p-2.5 border border-zinc-200 align-top">As required by applicable law</td>
          </tr>
        </tbody>
      </table>

      <h2 className="text-lg font-semibold mt-8 border-b-2 border-zinc-100 pb-1.5">
        Important Notes
      </h2>

      <ul className="list-disc pl-5 space-y-1">
        <li>Account deletion is <strong>permanent and cannot be undone</strong>.</li>
        <li>Deleting your account will <strong>immediately sign you out</strong> on all devices.</li>
        <li>Any content you shared (comments, reviews) will be removed from other users&apos; feeds.</li>
        <li>
          If you have an active subscription through a third-party provider, you must cancel it
          separately through that provider.
        </li>
      </ul>

      <div className="bg-blue-50 rounded-lg p-4 md:p-5 space-y-1">
        <strong>Questions?</strong>
        <p>
          Contact us at{" "}
          <a className="underline" href="mailto:support@api-bingewise.com">
            support@api-bingewise.com
          </a>{" "}
          and we will respond within 5 business days.
        </p>
      </div>
    </article>
  );
}