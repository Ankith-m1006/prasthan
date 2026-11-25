// "Add buses" sheet for bus operators (shown only when the Flagsmith flag operator_add_service is on).
import { useState } from 'react';
import { View } from 'react-native';
import type { AddServicesRequest, DemandCell } from '@contract';
import routesJson from '../../../../../seed/routes.json';
import { Button, Card, Chip, H2, Small } from '../../ui/kit';

/** Pure: builds the POST /v1/partners/:id/services body (tested). */
export function buildAddRequest(cell: DemandCell, count: number, departTime: string, boardingPoint: string, seats = 40): AddServicesRequest {
  return { routeId: cell.routeId ?? '', date: cell.date, departTime, boardingPoint, seats, count, mode: 'bus' };
}

export function AddBuses({ cell, onSubmit, onCancel }: { cell: DemandCell; onSubmit: (r: AddServicesRequest) => void; onCancel: () => void }) {
  const points = routesJson.routes.find((r) => r.id === cell.routeId)?.boardingPoints ?? ['MAJESTIC'];
  const [count, setCount] = useState(6);
  const [time, setTime] = useState('22:30');
  const [point, setPoint] = useState(points[0]);
  return (
    <Card>
      <H2>Add buses: {cell.label}</H2>
      <Small>How many buses (40 seats each)</Small>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginVertical: 6 }}>
        {[2, 4, 6, 10, 20].map((n) => <Chip key={n} label={String(n)} selected={n === count} onPress={() => setCount(n)} />)}
      </View>
      <Small>Departure</Small>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginVertical: 6 }}>
        {['21:00', '22:00', '22:30', '23:15'].map((x) => <Chip key={x} label={x} selected={x === time} onPress={() => setTime(x)} />)}
      </View>
      <Small>Boarding point</Small>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginVertical: 6 }}>
        {points.map((p) => <Chip key={p} label={p} selected={p === point} onPress={() => setPoint(p)} />)}
      </View>
      <Button tone="leaf" label={`Add ${count} buses`} hint="waiting travellers get an alert in their language" onPress={() => onSubmit(buildAddRequest(cell, count, time, point))} />
      <Button tone="plain" label="Cancel" onPress={onCancel} />
    </Card>
  );
}
