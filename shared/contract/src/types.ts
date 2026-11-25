// Prasthan contract v1. Source: docs/ARCHITECTURE.md sections 3-4. Owner: Session A.
// Type-only module: safe to import from the app with `import type`.

export type Lang = 'kn-IN' | 'ta-IN' | 'te-IN' | 'hi-IN' | 'od-IN' | 'bn-IN' | 'en-IN';
export type Mode = 'bus' | 'train' | 'air';
export type TimeWindow = 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
export type PartnerType = 'bus_operator' | 'sweet_shop' | 'quick_commerce';
export type Source = 'live' | 'mock' | 'fallback' | 'seeded' | 'context_dev';
export type FollowUpField = 'to' | 'date' | 'mode' | 'people';

export interface Traveller { id: string; displayName?: string; language: Lang; homeState?: string; homeTown?: string }

export interface GiftAsk { itemId: string; qty: number; partnerId?: string; unit?: string }
export type TravellingWith = 'alone' | 'family' | 'elders' | 'kids' | 'friends' | 'partner';

export interface TripIntent {
  id: string; travellerId: string;
  from: string;
  to: string | null;
  routeId: string | null;
  dateFrom: string | null; dateTo: string | null;
  timeWindow: TimeWindow;
  mode: Mode | null;
  people: number;
  boardingPoint: string | null;
  festivalId: string | null;
  gift: GiftAsk | null;
  needsFollowUp: FollowUpField[];
  language: Lang;
  transcript: string;
  confidence: number;
  /** v2: 'sarvam-llm' when Sarvam's chat model understood it; 'llm' is the old v1 name (still accepted). */
  parser: 'sarvam-llm' | 'llm' | 'rules';
  /** v2, optional: who the traveller goes with (LLM path only). */
  travellingWith?: TravellingWith | null;
}

export interface Route { id: string; to: string; toLocal: string; aliases: string[]; state: string; homeLanguage: Lang; modes: Mode[]; boardingPoints: string[] }
export interface BoardingPoint { id: string; name: string; nameKn: string; kind: string; lat: number; lng: number }

export interface ShopItem { id: string; name: string; nameLocal: string; unit: string; priceInr: number; readyInMinutes: number; dailyCapacity: number }

export interface Partner {
  id: string; type: PartnerType; name: string; styleOf?: string;
  routes?: string[];
  boardingPoint?: string; items?: ShopItem[];
  serves?: string[]; cutFirst?: boolean;
}

export interface Service { id: string; routeId: string; partnerId: string; mode: Mode; date: string; departTime: string; boardingPoint: string; seats: number; special: boolean }

export interface DemandCell {
  key: string;
  label: string;
  date: string; window: string;
  want: number;
  have: number;
  gap: number;
  suggestion: string | null;
  routeId?: string; zone?: string;
}

export type AlertKind = 'special_bus' | 'special_train' | 'surge_warning' | 'tout_warning' | 'new_service' | 'info';
export interface Alert {
  id: string; kind: AlertKind; routeId: string | null; date: string | null;
  text: string; textLocal?: Partial<Record<Lang, string>>;
  source: Source; sourceUrl?: string; createdAt: string;
}

export interface GiftOrder {
  id: string; partnerId: string; travellerId: string; intentId?: string; itemId: string; qty: number;
  pickupPoint: string; pickupDate: string; readyBy: string;
  status: 'placed' | 'ready' | 'picked_up' | 'cancelled'; payment: 'pay_at_pickup_demo';
}

export interface DeepLink { providerId: string; name: string; mode: Mode; url: string; kind: 'homepage' | 'search' }

export interface FestivalMode { festivalId: string; title: string; theme: string; greeting: Partial<Record<Lang, string>> }
export interface Announcement { text: string; routeId?: string; date?: string }

export interface FlagsView {
  festival_mode: FestivalMode;
  route_config: { enabledRoutes: string[]; featured: string[] };
  surge_warning: { warnAtMultiplier: number; rushNights: string[]; showToutWarning: boolean };
  special_service_announcements: Announcement[];
  voice_enabled: boolean; voice_fallback_offline: boolean;
  tts_model: string; tts_speaker: Record<string, string>; stt_mode: string;
  gifting_enabled: boolean; operator_add_service: boolean; shop_orders_view: boolean; quick_commerce_view: boolean;
  live_data_source: 'seeded' | 'context_dev';
  deep_link_providers: Record<Mode, string[]>;
  alert_poll_seconds: number; reply_style: 'warm' | 'short';
}

// ---------- requests / responses (section 4) ----------

export interface ApiError { error: { code: string; message: string } }

export type ModeState = 'live' | 'mock' | 'off';
export interface HealthResponse { ok: boolean; role: 'all' | 'api' | 'voice'; version: string; modes: { sarvam: ModeState; flagsmith: ModeState; contextDev: ModeState } }

export interface Traits { role?: 'traveller' | 'partner'; language?: Lang; home_state?: string; home_town?: string; partner_type?: PartnerType; partner_id?: string }
export interface IdentifyRequest { identity: string; traits?: Traits }
export interface IdentifyResponse { identity: string; flags: FlagsView }
export interface ConfigResponse { identity: string; flags: FlagsView; festival: Festival | null; source: Source }

export interface Festival { id: string; name: string; date: string; weekday?: string; nameLocal?: Partial<Record<Lang, string>>; travelWindow?: { from: string; to: string }; rushNights?: string[]; status?: string }

export interface VoiceReply { text: string; language: Lang; audioBase64: string | null; mime: string | null; audioUrl?: string | null; key?: string }
export interface StepSources { stt: Source; llm: Source; tts: Source }
export interface VoiceIntentResponse { transcript: string; language: Lang; intent: TripIntent; reply: VoiceReply; source: StepSources }

export interface IntentParseRequest { text: string; language: Lang; refDate?: string; context?: TripIntent | null }
export type IntentParseResponse = VoiceIntentResponse;

export interface TtsRequest { text: string; language: Lang }
export interface TtsResponse { audioBase64: string | null; mime: string | null; source: Source }

export interface Warning { kind: 'rush_night' | 'tout_warning' | 'surge'; text: string; textLocal?: Partial<Record<Lang, string>> }
export interface DemandSummary { want: number; have: number; label: string }
export interface OptionsResponse { routeId: string; date: string | null; mode: Mode; links: DeepLink[]; warnings: Warning[]; demand: DemandSummary | null; source: Source }

export interface Trip { id: string; intent: TripIntent; subscribed: boolean; createdAt: string }
export interface TripRequest { intent: TripIntent }
export interface TripResponse { trip: Trip }

export interface AlertsResponse { alerts: Alert[]; source: Source }
export interface PartnersResponse { partners: Partner[] }
export interface DemandResponse { partner: Partner; cells: DemandCell[]; label: string }

export interface AddServicesRequest { routeId: string; date: string; departTime: string; boardingPoint: string; seats: number; count: number; mode: Mode }
export interface AddServicesResponse { services: Service[]; alert: Alert; notified: number; demandAfter: { want: number; have: number; gap: number } }

export interface GiftOrderRequest { travellerId: string; partnerId: string; itemId: string; qty: number; pickupDate: string; readyBy: string; intentId?: string; pickupPoint?: string }
export interface GiftOrderResponse { order: GiftOrder }
export interface OrdersResponse { orders: GiftOrder[] }

export interface OpsFallbackRequest { on: boolean }
export interface OpsFallbackResponse { fallbackActive: boolean; via: 'flagsmith' | 'memory' }
export interface OpsStateResponse { fallbackActive: boolean; voiceHealthy: boolean; lastVoiceError?: string }
