/**
 * Settings Layout
 *
 * This layout is used by Next.js for settings routes, but the actual
 * rendering is handled by CPAGBuilder which provides the HeaderBar
 * and SettingsContent component. This layout just passes through children.
 */
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // CPAGBuilder handles all rendering including HeaderBar and SettingsContent
  // This layout just passes through children
  return <>{children}</>;
}
