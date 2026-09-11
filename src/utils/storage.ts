import { SeatingPlanState, Seat } from '../types';
import { initialPlanState } from '../data/initialPlan';

const STORAGE_KEY = 'silpa_bhirasri_seating_plan_v3';

export function loadSeatingPlan(): SeatingPlanState {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && parsed.seats && parsed.metadata) {
        if (!parsed.unassignedGuests) {
          parsed.unassignedGuests = initialPlanState.unassignedGuests;
        }
        if (!parsed.metadata.bgImageUrl || parsed.metadata.bgImageUrl.includes('ceremony_flow_100.svg')) {
          parsed.metadata.bgImageUrl = initialPlanState.metadata.bgImageUrl;
        }
        if (!parsed.metadata.bgDriveUrl) {
          parsed.metadata.bgDriveUrl = initialPlanState.metadata.bgDriveUrl;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load stored plan:', err);
  }
  return initialPlanState;
}

export function saveSeatingPlan(state: SeatingPlanState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save plan:', err);
  }
}

export function resetToDefaultPlan(): SeatingPlanState {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('silpa_bhirasri_plan_bg_image');
    localStorage.removeItem('silpa_bhirasri_plan_drive_url');
    localStorage.removeItem('silpa_bhirasri_plan_bg_drive_url');
    localStorage.removeItem('silpa_bhirasri_plan_default_url');
    localStorage.removeItem('silpa_bhirasri_plan_default_drive_url');
    localStorage.removeItem('silpa_bhirasri_plan_default_image');
  } catch {
    // ignore
  }
  return JSON.parse(JSON.stringify(initialPlanState));
}

export function exportToJsonFile(state: SeatingPlanState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `silpa_bhirasri_seating_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportToCsv(seats: Record<string, Seat>): void {
  const headers = ['Seat ID', 'Row', 'Number', 'Position / Title', 'Guest Name', 'Organization', 'Set Group', 'Flower Basket (*)', 'Art Set', 'Seat Color', 'Category', 'Status', 'Notes', 'Check-in Time'];
  
  const rows = Object.values(seats).map(s => [
    `"${s.id}"`,
    `"${s.row}"`,
    s.number,
    `"${(s.position || '').replace(/"/g, '""')}"`,
    `"${(s.guestName || '').replace(/"/g, '""')}"`,
    `"${(s.organization || '').replace(/"/g, '""')}"`,
    `"${(s.setGroup || '').replace(/"/g, '""')}"`,
    s.hasFlowerBasket ? 'YES' : 'NO',
    s.hasArtSet ? 'YES' : 'NO',
    `"${(s.colorBg || 'Default White').replace(/"/g, '""')}"`,
    `"${s.category}"`,
    `"${s.status}"`,
    `"${(s.notes || '').replace(/"/g, '""')}"`,
    `"${s.checkInTime || ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `silpa_bhirasri_guest_list_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
