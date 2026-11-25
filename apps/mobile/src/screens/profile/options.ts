// Choices for the profile form, all from the seed data (no free-text towns, so trips always match a route).
import type { Lang, Mode } from '@contract';
import bpJson from '../../../../../seed/boarding-points.json';
import routesJson from '../../../../../seed/routes.json';
import type { AgeGroup, Gender, TravellingWith } from '../../state/profile';

export const LANG_CHOICES: Array<[Lang, string]> = [['kn-IN', 'ಕನ್ನಡ'], ['ta-IN', 'தமிழ்'], ['te-IN', 'తెలుగు'], ['hi-IN', 'हिन्दी'], ['od-IN', 'ଓଡ଼ିଆ'], ['bn-IN', 'বাংলা'], ['en-IN', 'English']];
export const ROUTES = routesJson.routes;
export const STATES = [...new Set(ROUTES.map((r) => r.state))];
export const BOARDING = bpJson.boardingPoints.map((b) => ({ id: b.id, label: b.name.split(' (')[0].split(',')[0], kind: b.kind }));
export const MODE_CHOICES: Array<[Mode, string]> = [['bus', 'Bus'], ['train', 'Train'], ['air', 'Air']];
export const WITH_CHOICES: Array<[TravellingWith, string]> = [['alone', 'Alone'], ['family', 'Family'], ['kids', 'With kids'], ['elders', 'With elders']];
export const AGE_CHOICES: Array<[AgeGroup, string]> = [['under18', 'Under 18'], ['18-59', '18-59'], ['60plus', '60+']];
export const GENDER_CHOICES: Array<[Gender, string]> = [['woman', 'Woman'], ['man', 'Man'], ['unsaid', 'Prefer not to say']];

/** Boarding points that fit the usual mode (KR Puram serves bus and train). */
export function boardingFor(mode: Mode) {
  return BOARDING.filter((b) => b.kind.split('+').includes(mode));
}
