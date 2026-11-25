// Enter / leave the partner portal: role on the device + identity for api calls and Flagsmith traits.
import { router } from 'expo-router';
import type { Partner } from '@contract';
import { api } from '../../api';
import { partnerTraits, setIdentity } from '../../state/identity';
import { profileStore } from '../../state/profile';
import { roleStore } from '../../state/role';

export function enterPartner(p: Partner): void {
  roleStore.becomePartner(p);
  setIdentity({ partner: { id: p.id, type: p.type }, mode: 'partner' });
  void api.identify(p.id, partnerTraits(p.id, p.type)).catch(() => undefined);
  router.replace('/partner');
}

/** Traveller view: the saved guest profile (or the welcome screen if there is none yet). */
export function enterTraveller(): void {
  roleStore.becomeTraveller();
  setIdentity({ mode: 'traveller' });
  router.replace(profileStore.get() ? '/' : '/welcome');
}

/** Restores identity on a fresh load of the portal (the role was saved on the device). */
export function restorePartnerIdentity(p: Partner): void {
  setIdentity({ partner: { id: p.id, type: p.type }, mode: 'partner' });
}
