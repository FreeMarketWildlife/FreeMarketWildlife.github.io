/** Public static configuration. These strings are visible in source, not secrets.
 * Replace demo codes before sharing. Never store confidential material here.
 */
export const clients = Object.freeze({
  'troy-kearns': Object.freeze({ passcode: 'TROY-2026', path: '/troy-kearns/' }),
  'kat-kai': Object.freeze({ passcode: 'KATKAI-10K', path: '/kat-kai/' }),
});
export function clientForPasscode(passcode) {
  return Object.values(clients).find(client => client.passcode === passcode);
}
