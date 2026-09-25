/**
 * Settings navigation items for the settings sidebar.
 * Extracted for reuse and to allow cloud overlay to filter items.
 */

export interface SettingsNavItem {
  id: string;
  label: string;
  path: string;
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { id: 'general', label: 'General', path: '/cpag/settings/general' },
  { id: 'agent', label: 'Agent', path: '/cpag/settings/agent' },
  { id: 'users', label: 'Users', path: '/cpag/settings/users' },
  { id: 'redirects', label: 'Redirects', path: '/cpag/settings/redirects' },
  { id: 'security', label: 'Security', path: '/cpag/settings/security' },
  { id: 'email', label: 'Email', path: '/cpag/settings/email' },
  { id: 'templates', label: 'Templates', path: '/cpag/settings/templates' },
  { id: 'updates', label: 'Updates', path: '/cpag/settings/updates' },
];
