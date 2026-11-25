// The app's view of the api (docs/ARCHITECTURE.md section 4). HttpClient and MockClient both implement it.
import type {
  AddServicesRequest, AddServicesResponse, AlertsResponse, ConfigResponse, DemandResponse, GiftOrderRequest, GiftOrderResponse,
  IdentifyResponse, Lang, PickupsResponse, ShopsResponse, Mode, OpsStateResponse, OptionsResponse, OrdersResponse, PartnersResponse, PartnerType, Traits,
  TripIntent, TripResponse, TtsResponse, VoiceIntentResponse,
} from '@contract';

export interface RecordedAudio { uri: string; mime: string; name: string }

export interface Api {
  readonly kind: 'http' | 'mock';
  identify(identity: string, traits: Traits): Promise<IdentifyResponse>;
  config(): Promise<ConfigResponse>;
  voiceIntent(audio: RecordedAudio, language: Lang, context: TripIntent | null): Promise<VoiceIntentResponse>;
  parse(text: string, language: Lang, context: TripIntent | null): Promise<VoiceIntentResponse>;
  tts(text: string, language: Lang): Promise<TtsResponse>;
  options(routeId: string, date: string | null, mode: Mode | null, people: number): Promise<OptionsResponse>;
  saveTrip(intent: TripIntent): Promise<TripResponse>;
  alerts(since?: string): Promise<AlertsResponse>;
  partners(type?: PartnerType): Promise<PartnersResponse>;
  demand(partnerId: string, date?: string): Promise<DemandResponse>;
  addServices(partnerId: string, req: AddServicesRequest): Promise<AddServicesResponse>;
  giftOrder(req: GiftOrderRequest): Promise<GiftOrderResponse>;
  orders(partnerId: string): Promise<OrdersResponse>;
  /** v2: sweet shops nearest the boarding point first. */
  shops(boardingPoint: string | null): Promise<ShopsResponse>;
  /** v2: one order's current status (shop marks it ready / picked up). */
  order(id: string): Promise<GiftOrderResponse>;
  /** v2: shop side, what to have ready per pickup point and day. */
  pickups(partnerId: string, date?: string): Promise<PickupsResponse>;
  opsState(): Promise<OpsStateResponse>;
}
