import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { statusColor, categoryEmoji } from '../data';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#2a9640',
    other: '#6b7280'
};

const createCustomIcon = (priority, status, heatmapMode = false) => {
    const color = priorityColors[priority] || priorityColors.other;
    
    if (heatmapMode) {
        return new L.DivIcon({
            className: 'heatmap-div-icon',
            html: `<div style="background-color: ${color}; width: 60px; height: 60px; border-radius: 50%; opacity: 0.15; filter: blur(10px);"></div>`,
            iconSize: [60, 60],
            iconAnchor: [30, 30]
        });
    }

    return new L.DivIcon({
        className: 'custom-div-icon',
        html: `
            <div style="background-color: ${color}; 
                        width: 15px; 
                        height: 15px; 
                        border-radius: 50%; 
                        border: 3px solid white;
                        box-shadow: 0 0 10px rgba(0,0,0,0.3);
                        ${status === 'resolved' ? 'opacity: 0.6;' : 'animation: pulse 2s infinite;'}"
            ></div>
            <style>
                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(${priority === 'high' ? '239, 68, 68' : '245, 158, 11'}, 0.7); }
                    70% { transform: scale(1.2); box-shadow: 0 0 0 10px rgba(${priority === 'high' ? '239, 68, 68' : '245, 158, 11'}, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(${priority === 'high' ? '239, 68, 68' : '245, 158, 11'}, 0); }
                }
            </style>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
    });
};

export default function ComplaintsMap({ complaints, heatmapMode = false, onViewDetails }) {
    // Filter complaints that have coordinates
    const mapped = complaints.filter(c => c.latitude && c.longitude);

    // Initial center point (default to the first complaint or a stable point in AP)
    const center = mapped.length > 0
        ? [mapped[0].latitude, mapped[0].longitude]
        : [16.5062, 80.6480];

    return (
        <div className="card" style={{ height: '480px', width: '100%', marginBottom: '24px', overflow: 'hidden' }}>
            <div className="card-header" style={{
                borderBottom: '1px solid var(--gray-200)',
                background: 'var(--gray-50)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center'
            }}>
                <div style={{ fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--primary-600)', verticalAlign: 'middle' }}>map</span>
                    Grievance Location Map
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: '11px', fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} /> High</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> Medium</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a9640' }} /> Low</div>
                </div>
            </div>
            <MapContainer center={center} zoom={9} style={{ height: 'calc(100% - 60px)', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mapped.map((c) => (
                    <Marker
                        key={c.id}
                        position={[c.latitude, c.longitude]}
                        icon={createCustomIcon(c.priority, c.status, heatmapMode)}
                    >
                        <Popup>
                            <div style={{ minWidth: '220px', padding: '5px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>{categoryEmoji[c.category] || 'assignment'}</span> {c.id}
                                    </div>
                                    <span style={{
                                        fontSize: '9px',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: c.priority === 'high' ? '#fee2e2' : c.priority === 'medium' ? '#fef3c7' : '#d1fae5',
                                        color: c.priority === 'high' ? '#991b1b' : c.priority === 'medium' ? '#92400e' : '#065f46',
                                        fontWeight: 800,
                                        textTransform: 'uppercase'
                                    }}>
                                        {c.priority}
                                    </span>
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-secondary)' }}>{c.title}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{
                                        fontSize: '11px',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: c.status === 'resolved' ? '#dcfce7' : c.status === 'inprogress' ? '#dbeafe' : '#fef9c3',
                                        color: c.status === 'resolved' ? '#166534' : c.status === 'inprogress' ? '#1e40af' : '#854d0e',
                                        fontWeight: 800,
                                        textTransform: 'uppercase'
                                    }}>
                                        {c.status}
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#4b5563', fontWeight: 600 }}><span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: 'middle' }}>location_on</span> Ward {c.ward}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '14px', lineHeight: 1.5 }}>
                                    {c.description ? (c.description.length > 80 ? c.description.substring(0, 80) + '...' : c.description) : 'No description provided.'}
                                </div>
                                <button
                                    className="btn btn-primary btn-sm btn-block"
                                    style={{ padding: '8px 0', fontSize: '12px', fontWeight: 700 }}
                                    onClick={() => onViewDetails && onViewDetails(c)}
                                >
                                    View Details
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
